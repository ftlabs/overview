const debug = require('debug')('lib:sapiV1CapiV2');
const directly = require('../helpers/directly');
const cache = require('../helpers/cache');
const CAPI_KEY = process.env.CAPI_KEY;
if (!CAPI_KEY) {
    throw new Error('ERROR: CAPI_KEY not specified in env');
}
const CAPI_PATH = 'http://api.ft.com/enrichedcontent/';
const SAPI_PATH = 'http://api.ft.com/content/search/v1';
const CAPI_CONCURRENCE = process.env.hasOwnProperty('CAPI_CONCURRENCE') ? process.env.CAPI_CONCURRENCE : 4;
const defaultAspects = [
	"audioVisual",
	"editorial",
	"images",
	"lifecycle",
	"location",
	"master",
	"metadata",
	"nature",
	"provenance",
	"summary",
	"title"
];
const defaultFacets = [
	"organisations",
	"organisationsId",
	"people",
	"peopleId",
	"topics",
	"topicsId",
	"genre",
	"genreId"
];

// NB: should only match basic ontology values, maybe with Id suffix, e.g. people and peopleId,
// and *not* other constraint fields such as lastPublishDateTime
const EntityRegex = /^([a-z]+(?:Id)?):(.+)$/;
function rephraseEntityForQueryString(item) {
    const match = EntityRegex.exec(item);
    if (match) {
        return match[1] + ':"' + match[2] + '"';
    } else {
        return item;
    }
}

// const valid facetNames = [
//   "authors",
//   "authorsId",
//   "brand",
//   "brandId",
//   "category",
//   "format",
//   "genre",
//   "genreId",
//   "icb",
//   "icbId",
//   "iptc",
//   "iptcId",
//   "organisations",
//   "organisationsId",
//   "people",
//   "peopleId",
//   "primarySection",
//   "primarySectionId",
//   "primaryTheme",
//   "primaryThemeId",
//   "regions",
//   "regionsId",
//   "sections",
//   "sectionsId",
//   "specialReports",
//   "specialReportsId",
//   "subjects",
//   "subjectsId",
//   "topics",
//   "topicsId"
// ];

function constructSAPIQuery(params) {
    const defaults = {
        queryString: '',
        maxResults: 10,
        offset: 0,
        aspects: ['title', 'lifecycle', 'location', 'summary', 'metadata'], // [ "title", "location", "summary", "lifecycle", "metadata"],
        constraints: [],
        facets: { names: ['people', 'organisations', 'topics'], maxElements: -1 }
    };

    const resultContext = (params.hasOwnProperty('resultContext'))? params['resultContext'] : {}; // in case proper SAPI search body is being passed in.
    const combined = Object.assign({}, defaults, resultContext, params);

		debug(`constructSAPIQuery: combined=${JSON.stringify(combined)},
		defaults=${JSON.stringify(defaults)},
		resultContext=${JSON.stringify(resultContext)},
		params=${JSON.stringify(params)}`);

    let queryString = combined.queryString;
    if (combined.constraints.length > 0) {
        // NB: not promises...
        queryString = `"${combined.queryString}" and `;
        queryString += combined.constraints
            .map(c => {
                return rephraseEntityForQueryString(c);
            })
            .join(' and ');
    }

    const full = {
        queryString: queryString,
        queryContext: {
            curations: ['ARTICLES', 'BLOGS']
        },
        resultContext: {
            maxResults: `${combined.maxResults}`,
            offset: `${combined.offset}`,
            aspects: combined.aspects,
            sortOrder: 'DESC',
            sortField: 'lastPublishDateTime',
            facets: combined.facets
        }
    };
    return full;
}

const FetchTimings = {};

function recordFetchTiming(method, timing, resOk, status, statusText) {
    if (!FetchTimings.hasOwnProperty(method)) {
        FetchTimings[method] = [];
    }
    FetchTimings[method].push({
        timing,
        resOk,
        status,
        statusText
    });
}

function summariseFetchTimings(history) {
    const summary = {};
    Object.keys(FetchTimings).forEach(method => {
        const totalCount = FetchTimings[method].length;
        history = history ? history : totalCount;
        const recentFew = FetchTimings[method].slice(-history);
        const count = recentFew.length;
        let statusesNotOk = [];
        let numOk = 0;
        let numNotOk = 0;
        let sum = 0;
        let max = 0;
        let min = -1;
        recentFew.forEach(item => {
            if (item.resOk) {
                numOk = numOk + 1;
            } else {
                numNotOk = numNotOk + 1;
                statusesNotOk.push({
                    status: item.status,
                    statusText: item.statusText
                });
            }

            sum = sum + item.timing;
            max = Math.max(max, item.timing);
            min = min == -1 ? item.timing : Math.min(min, item.timing);
        });
        summary[method] = {
            totalCount: FetchTimings[method].length,
            count,
            mean: sum / count,
            max,
            min,
            numOk,
            numNotOk,
            statusesNotOk
        };
    });

    return summary;
}

function fetchWithTiming(url, options = {}) {
    const startMillis = Date.now();
    return fetch(url, options).then(res => {
        const endMillis = Date.now();
        const timing = endMillis - startMillis;
        return { res, timing };
    });
}

function fetchResText(url, options) {
    return fetchWithTiming(url, options)
        .then(resWithTiming => {
            const method = options && options.method == 'POST' ? 'POST' : 'GET';
            const res = resWithTiming.res;
            const resOk = res && res.ok;
            const timing = resWithTiming.timing;
            recordFetchTiming(method, timing, resOk, res.status, res.statusText);
            if (resOk) {
                return res;
            } else {
                throw new Error(
                    `fetchResText: res not ok: res.status=${
                    res['status']
                    }, res.statusText=${
                    res['statusText']
                    }, url=${url}, options=${JSON.stringify(options)}`
                );
            }
        })
        .then(res => res.text());
}

function cachedFetchResText(url, options) {
  const safeUrl = url.replace(/apiKey=[^&]+/, 'apiKey=...');
  const clonedOptions = Object.assign({}, options);
  delete clonedOptions['apiKey'];
  const keyData = { safeUrl, clonedOptions };
  const key = JSON.stringify( keyData );

  let cachedValue = cache.get(key);

  if (cachedValue !== undefined) {
    return Promise.resolve(cachedValue);
  }

  return fetchResText( url, options )
  .then( text => {
    cache.set(key, text);
    return text;
  } );
}

function searchSapi(params) {
    const apiKey = (params['apiKey'] !== undefined)? params['apiKey'] : CAPI_KEY;
    const sapiUrl = `${SAPI_PATH}?apiKey=${apiKey}`;
    const sapiQuery = constructSAPIQuery(params);
    const options = {
        method: 'POST',
        body: JSON.stringify(sapiQuery),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    const capiUnaspects = (params.hasOwnProperty('capiUnaspects'))? params['capiUnaspects'] : []; // capi attributes to be discarded
    debug(`searchSapi: sapiQuery=${JSON.stringify(sapiQuery)}`);
    return cachedFetchResText(sapiUrl, options)
        .then(text => {
            let sapiObj;
            try {
                sapiObj = JSON.parse(text);
            } catch (err) {
                throw new Error(`JSON.parse: err=${err},
				text=${text},
				params=${params}`);
            }
            return {
                params,
                sapiObj
            };
        })
        .then( searchObj => { // look for capi details in here
          if (params.includeCapi) {
            searchObj.sapiObj['capi'] = "including CAPI results";
          } else {
            return searchObj;
          }

          if (!searchObj
            || ! searchObj.sapiObj
            || ! searchObj.sapiObj.results
            || ! searchObj.sapiObj.results.length > 0
            || ! searchObj.sapiObj.results[0].results) {
              return searchObj;
            }

          const uuids = searchObj.sapiObj.results[0].results.map( result => {
            return result.id;
          });

          // get all the articles
          const articlePromisers = uuids.map( uuid => {
                  return function () {
                          return getArticle(uuid); // a fn which returns a promise
                  };
          });

          return directly(CAPI_CONCURRENCE, articlePromisers)
          .then( capiResponses => {

            // prep the article data for integration w/sapi

            const capiResponsesByUuid = {};
            capiResponses.forEach( capiResponse => {
              if (capiResponse
                && capiResponse.id) {

                const id = capiResponse.id;
                const uuid = id.split('/').pop();
                capiUnaspects.forEach( aspect => {
                  delete capiResponse[aspect];
                });
                capiResponse['uuid'] = uuid;

                capiResponsesByUuid[uuid] = capiResponse;
              }
            });

            searchObj.sapiObj.results[0].results.forEach( result => {
              const uuid = result.id;
              if (capiResponsesByUuid.hasOwnProperty(uuid)) {
                result['capi'] = capiResponsesByUuid[uuid];
              }
            } );

            return searchObj;
          })
          .catch(err => {
              console.log(`ERROR: search: err=${err}.`);
              return { params, err }; // NB, no sapiObj...
          });

        })
        .catch(err => {
            console.log(`ERROR: search: err=${err}.`);
            return { params, err }; // NB, no sapiObj...
        });
}

const DEFAULT_MAX_SEARCH_DEEPER_DURATION_MS = 3000;
const DEFAULT_MAX_SEARCH_DEPTH = 10;
// maxDepth == 1 => do 1 search, 2 ==> max 2 searches, etc
// maxDurationMs could curtail next iteration
// return list of searchItems
function searchSapiDeeper(params, maxDepth = DEFAULT_MAX_SEARCH_DEPTH) {
    if (maxDepth < 1) {
        return [];
    }
    if (!params.hasOwnProperty('maxDurationMs')) {
        params.maxDurationMs = DEFAULT_MAX_SEARCH_DEEPER_DURATION_MS;
    }
    if (!params.hasOwnProperty('startMs')) {
        params.startMs = Date.now();
    }
    return searchSapi(params)
        .then(searchItem => {
            const sapiObj = searchItem.sapiObj;
            const durationMs = Date.now() - params.startMs;

            searchItem.maxDepth = maxDepth;
            searchItem.offset = sapiObj.query.resultContext.offset;
            searchItem.maxResults = sapiObj.query.resultContext.maxResults;
            searchItem.indexCount = sapiObj.results[0].indexCount;
            searchItem.thisNumResults = (sapiObj.results[0].hasOwnProperty('results'))? sapiObj.results[0].results.length : 0;
            searchItem.remainingResults = Math.max(0, searchItem.indexCount - searchItem.thisNumResults - searchItem.offset);
            searchItem.durationMs = durationMs;

            const searchItems = [searchItem];
            if (
                searchItem.maxDepth < 2
                || searchItem.remainingResults <= 0
                || durationMs >= params.maxDurationMs
            ) {
                debug(`searchDeeper: curtailing: searchItem.maxDepth=${searchItem.maxDepth}, searchItem.remainingResults=${searchItem.remainingResults}, searchItem.indexCount=${searchItem.indexCount}, durationMs=${durationMs}, params.maxDurationMs=${params.maxDurationMs}`);
                return searchItems;
            }

            const nextParams = Object.assign({}, params);
            if (!nextParams.hasOwnProperty('offset')) {
                nextParams.offset = 0;
            }
            nextParams.offset = nextParams.offset + searchItem.maxResults;
            return searchSapiDeeper(nextParams, maxDepth - 1)
                .then(nextSearchItems => searchItems.concat(nextSearchItems))
                ;
        })
        .catch(err => {
            console.log(`WARNING: searchDeeper: maxDepth=${maxDepth}: err=${err}`);
            return []; // if in doubt, return an empty list
        })
        ;
}

function mergeCapiFlavours( capiResponse ){
	// Bridge the gap between old and new capi capiResponses.
	// - Assess whether is new or old (by scanning for key attributes)
	// - compile useful common view of all types of capi
	// - inject into capiResponse as a sort-of-new set
// debug(`mergeCapiFlavours: capiResponse=${JSON.stringify(capiResponse, null, 2)}`);
	const annotations = capiResponse.annotations;

	let isNew = true;
	for( let i=0; i<annotations.length; i++ ){
		const anno = annotations[i];
		debug(`mergeCapiFlavours: anno=${JSON.stringify(anno, null, 2)}`);
		if (anno.predicate.endsWith('/majorMentions')) {
			isNew = false; break;
		} else if (
			anno.predicate.endsWith('/implicitlyAbout')
	 || anno.predicate.endsWith('/hasDisplayTag')
 		) {
			isNew = true; break;
		}
	}

	const massagedAnnotations = {
		abouts : [],
	};
	annotations.forEach( anno => {
		const csv = [anno.type, anno.prefLabel].join(':');
		if (anno.type === 'GENRE') {
			massagedAnnotations['genre'] = anno.prefLabel;
		} else if( anno.predicate.endsWith('/about') ){
			massagedAnnotations.abouts.push(csv);
			if (!isNew) {
				massagedAnnotations['primaryTheme'] = csv;
			}
		} else if (anno.predicate.endsWith('/hasDisplayTag')) {
			massagedAnnotations['primaryTheme'] = csv;
			massagedAnnotations.abouts.push(csv);
		} else if(anno.predicate.endsWith('/majorMentions')) {
			massagedAnnotations.abouts.push(csv);
		}
	});

	return massagedAnnotations;
}

//---------------------

function getArticle(uuid) {
    const capiUrl = `${CAPI_PATH}${uuid}?apiKey=${CAPI_KEY}`;
    const cacheKey = `${CAPI_PATH}${uuid}`;
    const cachedValue = cache.get( cacheKey );

    if (cachedValue !== undefined) {
      return Promise.resolve(cachedValue);
    }

    return fetch(capiUrl)
        .then(res => {
            if (res.status === 400) {
                throw `ERROR: fetch article for uuid=${uuid} status code=${res.status}`;
            }
            return res;
        })
        .then(res => res.text())
        .then(text => {
          const json = JSON.parse(text);
          cache.set(cacheKey, json);
          return json;
        })
				.then(json => {
					const merged = mergeCapiFlavours(json);
					json['mergedAnnotations'] = merged;
					return json;
				})
        .catch(err => {
            debug(`ERROR: article: err=${err}, capiUrl=${capiUrl}`);
            throw err;
        })
        ;
}

function search(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	return searchSapi(params);
}

function searchDeeper(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	const maxDepth = (params.hasOwnProperty('maxDepth')) ? params['maxDepth'] : 2;
	return searchSapiDeeper(params,maxDepth);
}

module.exports = {
	search,
	searchDeeper,
	getArticle,
};
