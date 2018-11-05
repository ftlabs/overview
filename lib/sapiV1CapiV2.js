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

const defaultCapiAspects = [
	'id',
	'title',
	'standfirst',
	'summary',
	'firstPublishedDate',
	'publishedDate',
	'prefLabel',
	'types',
	'mergedAnnotations',
	'uuid',
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

function cachedFetchResText(path, options) {
	const url=`${path}?apiKey=${CAPI_KEY}`;
  const safeUrl = `${path}?apiKey=...`;
  const keyData = { safeUrl, options };
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

function cachedFetchResJson(path, options){
	return cachedFetchResText(path, options)
	.then(text => {
			let sapiObj;
			try {
					sapiObj = JSON.parse(text);
			} catch (err) {
					throw new Error(`cachedFetchResJson: JSON.parse: err=${err},
	text=${text}`);
			}
			return sapiObj;
	})
}

function searchSapi(params) {
		debug(`searchSapi: params=${JSON.stringify(params)}`);
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
    return cachedFetchResJson(SAPI_PATH, options)
        .then(json => {
            return {
                params,
                sapiObj: json
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
          ;

        })
        ;
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
		// debug(`mergeCapiFlavours: anno=${JSON.stringify(anno, null, 2)}`);
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
		abouts           : [],
		implicitlyAbouts : [],
		mentions         : [],
		classifiedBys    : [],
		implicitlyClassifiedBys : [],
	};
	annotations.forEach( anno => {
		const csv = [anno.type, anno.prefLabel].join(':');
		if (anno.type === 'GENRE') {
			massagedAnnotations['genre'] = anno.prefLabel;
		}
		if( anno.predicate.endsWith('/about') ){
			massagedAnnotations.abouts.push(csv);
			if (!isNew) {
				massagedAnnotations['primaryTheme'] = csv;
			}
		} else if( anno.predicate.endsWith('/implicitlyAbout') ){
			massagedAnnotations.implicitlyAbouts.push(csv);
		} else if (anno.predicate.endsWith('/hasDisplayTag')) {
			massagedAnnotations['primaryTheme'] = csv;
			// massagedAnnotations.abouts.push(csv);
		} else if(anno.predicate.endsWith('/majorMentions')) {
			massagedAnnotations.abouts.push(csv);
		} else if(anno.predicate.endsWith('/mentions')) {
			massagedAnnotations.mentions.push(csv);
		} else if(anno.predicate.endsWith('/isClassifiedBy')) {
			massagedAnnotations.classifiedBys.push(csv);
		} else if(anno.predicate.endsWith('/implicitlyClassifiedBy')) {
			massagedAnnotations.implicitlyClassifiedBys.push(csv);
		} else if(anno.predicate.endsWith('/isPrimarilyClassifiedBy')) {
			massagedAnnotations['primarilyClassifiedBy'] = csv;
		}
	});

	return massagedAnnotations;
}

function extractArticles(results) {
	  debug( `extractArticles: num sets of results: ${results.length}` );
    const articles = [];
		const articleSetsSizes = [];
    results.forEach(result => {
				articleSetsSizes.push(result.sapiObj.results[0].results.length);
        result.sapiObj.results[0].results.forEach(article => {
            articles.push(article);
        });
    });
		debug( `extractArticles: articleSetsSizes: ${JSON.stringify(articleSetsSizes)}` );
    return articles;
}

function getCapi(uuid) {
		const options = { method: 'GET' };
		const path = `${CAPI_PATH}${uuid}`;
    return cachedFetchResJson(path, options)
			.then(json => {
				const merged = mergeCapiFlavours(json);
				json['mergedAnnotations'] = merged;
				return json;
			})
	    ;
}

//---------------------

function getArticle(uuid) {
    return getCapi(uuid)
        .catch(err => {
            return { err: err.message };
        })
        ;
}

function search(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	return searchSapi(params)
	.then( sapiObj => {
		return {
			description: 'a SAPI call followed by a CAPI call for each article result, named capi in the article. Full results.',
			params,
			sapiObj,
		}
	})
	.catch( err => {
		return { err: err.message };
	})
	;
}

function searchDeeper(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	const maxDepth = (params.hasOwnProperty('maxDepth')) ? params['maxDepth'] : 2;
	return searchSapiDeeper(params,maxDepth)
	.then( sapiObjs => {
		return {
			description: 'a SAPI call followed by a CAPI call for each article result, named capi in the article. Search is iterated if there are more results. Full results.',
			params,
			maxDepth,
			sapiObjs,
		}
	})
	.catch( err => {
		return { err: err.message };
	})
	;
}

function searchDeeperArticles(params={}){
	return searchDeeper(params)
	.then( sdResult => {
		if (sdResult.hasOwnProperty('err')) {
			throw new Error( sdResult.err );
		}
		return sdResult.sapiObjs;
	})
	.then( sapiObjList => {
		return extractArticles(sapiObjList);
	})
	.then( articles => {
		const filteredArticles = articles.map( article => {
			const capi = article.capi;
			const filteredCapi = {};
			defaultCapiAspects.forEach(aspect => {
				filteredCapi[aspect] = capi[aspect];
			});

			article.capi = filteredCapi;
			return article;
		});
		return articles;
	})
	.then( articles => {
		return {
			description: 'a series of SAPI calls followed by a CAPI call for each article result, named capi in the article, then filtered down to just be a merged list of articles.',
			params,
			numArticles : articles.length,
			articles,
		}
	})
	.catch( err => {
		return { err: err.message };
	})
	;
}

function searchDeeperArticlesCapi(params={}){
	return searchDeeperArticles(params)
	.then( sdaResult => {
		if (sdaResult.hasOwnProperty('err')) {
			throw new Error( sdaResult.err );
		}
		return sdaResult.articles;
	})
	.then( articles => {
		const justCapis = articles.map( article => {
			return article.capi;
		});

		return {
			description : 'just the CAPI portions of the SAPI/CAPI results',
			params,
			numArticles : justCapis.length,
			articles : justCapis,
		};
	})
	.catch( err => {
		return { err: err.message };
	})
	;
}

module.exports = {
	search,
	searchDeeper,
	searchDeeperArticles,
	searchDeeperArticlesCapi,
	getArticle,
	summariseFetchTimings,
};
