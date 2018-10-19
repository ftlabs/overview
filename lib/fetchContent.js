// This module makes use of 'node-fetch' to acces SAPI

const fetch = require('node-fetch');
const debug = require('debug')('lib:fetchContent');
const parameters = require('../helpers/parameters');
const time = require('../helpers/time');
const arrs = require('../helpers/array');
const objs = require('../helpers/object');
const directly = require('../helpers/directly');
const listService = require('../lib/listService');

const CAPI_KEY = process.env.CAPI_KEY;
if (!CAPI_KEY) {
    throw new Error('ERROR: CAPI_KEY not specified in env');
}
const CAPI_PATH = 'http://api.ft.com/enrichedcontent/';
const SAPI_PATH = 'http://api.ft.com/content/search/v1';

const CAPI_CONCURRENCE = (process.env.hasOwnProperty('CAPI_CONCURRENCE'))? process.env.CAPI_CONCURRENCE : 2;

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
        aspects: ['title', 'lifecycle', 'location'], // [ "title", "location", "summary", "lifecycle", "metadata"],
        constraints: [],
        facets: { names: ['people', 'organisations', 'topics'], maxElements: -1 }
    };
    const combined = Object.assign({}, defaults, params);
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

function search(params) {
    const sapiUrl = `${SAPI_PATH}?apiKey=${CAPI_KEY}`;
    const sapiQuery = constructSAPIQuery(params);
    const options = {
        method: 'POST',
        body: JSON.stringify(sapiQuery),
        headers: {
            'Content-Type': 'application/json'
        }
    };
    debug(`search: sapiQuery=${JSON.stringify(sapiQuery)}`);
    return fetchResText(sapiUrl, options)
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
          searchObj.sapiObj['capi'] = "might be added soon";

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
          });
        })
        .catch(err => {
            console.log(`ERROR: search: err=${err}.`);
            return { params }; // NB, no sapiObj...
        });
}


function searchSequence(searches) {
    if (searches === undefined || searches.length === 0) {
        return [];
    }

    let searchPromises = [];
    searches.forEach(params => {
        searchPromises.push(search(params));
    });

    return Promise.all(searchPromises).then(results => {
        return results;
    });
}


const DEFAULT_MAX_SEARCH_DEEPER_DURATION_MS = 3000;
const DEFAULT_MAX_SEARCH_DEPTH = 10;
// maxDepth == 1 => do 1 search, 2 ==> max 2 searches, etc
// maxDurationMs could curtail next iteration
// return list of searchItems
function searchDeeper(params, maxDepth = DEFAULT_MAX_SEARCH_DEPTH) {
    if (maxDepth < 1) {
        return [];
    }
    if (!params.hasOwnProperty('maxDurationMs')) {
        params.maxDurationMs = DEFAULT_MAX_SEARCH_DEEPER_DURATION_MS;
    }
    if (!params.hasOwnProperty('startMs')) {
        params.startMs = Date.now();
    }
    return search(params)
        .then(searchItem => {
            const sapiObj = searchItem.sapiObj;
            const durationMs = Date.now() - params.startMs;

            searchItem.maxDepth = maxDepth;
            searchItem.offset = sapiObj.query.resultContext.offset;
            searchItem.maxResults = sapiObj.query.resultContext.maxResults;
            searchItem.indexCount = sapiObj.results[0].indexCount;
            searchItem.thisNumResults = sapiObj.results[0].results.length;
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
            return searchDeeper(nextParams, maxDepth - 1)
                .then(nextSearchItems => searchItems.concat(nextSearchItems))
                ;
        })
        .catch(err => {
            console.log(`WARNING: searchDeeper: maxDepth=${maxDepth}: err=${err}`);
            return []; // if in doubt, return an empty list
        })
        ;
}

function getArticle(uuid) {
    const capiUrl = `${CAPI_PATH}${uuid}?apiKey=${CAPI_KEY}`;
    return fetch(capiUrl)
        .then(res => {
            if (res.status === 400) {
                throw `ERROR: fetch article for uuid=${uuid} status code=${res.status}`;
            }
            return res;
        })
        .then(res => res.text())
        .then(text => JSON.parse(text))
        .catch(err => {
            debug(`ERROR: article: err=${err}, capiUrl=${capiUrl}`);
            throw err;
        });
}

function getArticles(uuids, params) {
    return search(params).then(results => {
        return results.sapiObj.results[0].results;
    });
}

function constructUUIDsQuery(uuids){
    let ids = uuids.map(id => `id:=\"${id}\"`);
    return ids.join(' OR ');
}

function getRecentArticles(days, aspects, facets) {
    const date = time.getDatetimeRange('days', days, 0);
    const params = {
        queryString: `lastPublishDateTime:> ${date.next}`,
        maxResults: 100,
        aspects: aspects,
        facets: {
            "names": facets,
            "maxElements": -1
        }
    };

    return searchDeeper(params)
        .then(results => extractArticles(results))
        .catch(err => {
            throw err;
        });
}

function getArticleRelations(days, facets, aspects) {
    const date = time.getDatetimeRange('days', days, 0);
    aspects = checkMetaDataPresent(aspects);
    const params = {
        queryString: `lastPublishDateTime:> ${date.next}`,
        maxResults: 100,
        aspects: aspects,
        facets: {
            "names": facets,
            "maxElements": -1
        }
    };

    return searchDeeper(params)
        .then(results => extractArticles(results))
        .then(articles => sortArticlesIntoFacets(articles, facets))
        .then(article => wrapResults(article, days))
        .catch(err => {
            throw err;
        });
}

function getArticlesAggregation(days, facets, aspects, minCorrelation=2, timeslip=0)
{
	// days=range in days, facets=SAPI metadata list, aspects=SAPI content type list,
	// minCorrelation=min threshold for correlationAnalysis, timeslip=how long ago in days
	const dateRange = time.getDatetimeRange('days', days, timeslip);
	aspects = checkMetaDataPresent(aspects);
	const maxSearchDepth = 20;
	const maxSearchDurationMs = 9000;
	const params = {
		queryString: `lastPublishDateTime:>${dateRange.next} and lastPublishDateTime:<${dateRange.first}`,
		maxResults : 100,
		aspects : aspects,
		facets : {
			"names": facets,
			"maxElements":-1
		},
		'maxDurationMs' : maxSearchDurationMs,
	};

	let filterByMetadataCsv = null; // initially, then non-null later
	return searchDeeper(params, maxSearchDepth)
		.then(results =>  extractArticles(results) )
		.then(articles => aggregateArticles(articles, facets, minCorrelation, days, params, filterByMetadataCsv) )
		.then(aggregation => {
			// look for all the distinct genre CSVs
			const allCsvs = Object.keys(aggregation.articlesByMetadataCsv);
			const allGenreCsvs = allCsvs.filter( csv => csv.startsWith('genre:') );
			// re-establish the full list of articles
			const articles = Object.values(aggregation.articlesByUuid);
			// construct an aggregation for each genre csv
			const aggregationsByGenre = {};
			const articleCounts = {};
			let articleCountsTotal = 0;
			allGenreCsvs.forEach( csv => {
				filterByMetadataCsv = csv;
				aggregationsByGenre[csv] = aggregateArticles(articles, facets, minCorrelation, days, params, filterByMetadataCsv);
				articleCounts[csv] = aggregationsByGenre[csv].numArticles;
				articleCountsTotal = articleCountsTotal + aggregationsByGenre[csv].numArticles;
			});

			return {
				'description' :[
					'calculating aggregations for each genre CSV',
				],
				'params': {
					days,
					facets,
					aspects,
					minCorrelation,
					timeslip,
					dateRange,
					'searchParams' : params,
				},
				articleCountsTotal,
				articleCounts,
				aggregationsByGenre
			};
		})
		.catch(err => {
			throw err;
		});
}

async function getArticlesAggregationWithListHistory(days, facets, aspects, minCorrelation=2, timeslip=0, listName='uk-homepage-top-stories'){
  const daysAgoFrom = timeslip + days;
  const daysAgoTo   = timeslip;
  // get the data in parallel
  const [articlesAgg, listHistory] = await Promise.all([
    getArticlesAggregation(days, facets, aspects, minCorrelation, timeslip),
    listService.overRange(listName, daysAgoFrom, daysAgoTo),
  ]);

  const genreNewsAggregation = articlesAgg.aggregationsByGenre['genre:genre:News'];

  const knownUuids = {};
  listHistory[0].forEach(item => { knownUuids[item.content_id] = true; });

  // lookup/filter UUIDs in genre:genre:News.articlesByUuid
  const newsUuids = Object.keys(knownUuids).filter( uuid => {
    return genreNewsAggregation.articlesByUuid.hasOwnProperty(uuid);
  });

  const newsArticlesByUuid = {};
  newsUuids.forEach( uuid => {
    const article = genreNewsAggregation.articlesByUuid[uuid];
    const primaryTheme = article.metadata.primaryTheme;
    const ptTaxonomy = (primaryTheme)? primaryTheme.term.taxonomy : 'unknown';
    const ptName = (primaryTheme)? primaryTheme.term.name : 'unknown';
    const primaryThemeCsv = (primaryTheme)? ['primaryTheme', ptTaxonomy, ptName].join(':') : "unknown:unknown:unknown";
    const images = article.images;
    const imageUrl = (images.length > 0)? images[0].url : 'https://www.ft.com/__origami/service/image/v2/images/raw/ftlogo-v1:brand-ft-logo-squared-bw?source=origami-registry&width=200';
    newsArticlesByUuid[uuid] = {
      uuid,
      title: article.title.title,
      initialPublishDateTime: article.lifecycle.initialPublishDateTime,
      primaryThemeCsv,
      primaryThemeName: ptName,
      imageUrl,
    }
  });

  // sort most recent first
  newsUuids.sort((a,b) => {
    if (newsArticlesByUuid[a].initialPublishDateTime < newsArticlesByUuid[b].initialPublishDateTime) { return 1; }
    else if(newsArticlesByUuid[a].initialPublishDateTime > newsArticlesByUuid[b].initialPublishDateTime) { return -1; }
    else { return 0; }
  });

  const knownPrimaryThemeNames = {};
  const primaryThemeNamesSequence = [];
  newsUuids.forEach( uuid => {
    const article = newsArticlesByUuid[uuid];
    const name = article.primaryThemeName;
    if (! knownPrimaryThemeNames.hasOwnProperty(name)) {
      primaryThemeNamesSequence.push(name);
      knownPrimaryThemeNames[name] = [];
    }
    knownPrimaryThemeNames[name].push(article);
  });

  const articlesByPrimaryThemeNames = primaryThemeNamesSequence.map(name => {
    return {
      name,
      articles: knownPrimaryThemeNames[name]
    };
  });

  const newsArticles = newsUuids.map( uuid => {
    return newsArticlesByUuid[uuid];
  });

  const listHistoryProcessed = {
    articlesByPrimaryThemeNames,
    newsUuids,
    newsArticles,
    newsArticlesByUuid,
    listHistory
  };

  // add list data to main result
  articlesAgg.listHistoryProcessed = listHistoryProcessed;

  return articlesAgg;
}

function addUuidToFacetTuple(grouping, facetTuple, uuid){
	const metadataKey = facetTuple.metadataKey;
	const taxonomy    = facetTuple.term.taxonomy;
	const name        = facetTuple.term.name;

	if (!grouping.hasOwnProperty(metadataKey)) {
		grouping[metadataKey] = {};
	}

	if (!grouping[metadataKey].hasOwnProperty(taxonomy)) {
		grouping[metadataKey][taxonomy] = {};
	}

	if (!grouping[metadataKey][taxonomy].hasOwnProperty(name)) {
		grouping[metadataKey][taxonomy][name] = [];
	}

	grouping[metadataKey][taxonomy][name].push(uuid);
}

function addFacetCorrelation( grouping, facetTuple1, facetTuple2 ){
	const metadataKey1 = facetTuple1.metadataKey;
	const taxonomy1    = facetTuple1.term.taxonomy;
	const name1        = facetTuple1.term.name;

	const metadataKey2 = facetTuple2.metadataKey;
	const taxonomy2    = facetTuple2.term.taxonomy;
	const name2        = facetTuple2.term.name;

	const csv2 = [metadataKey2, taxonomy2, name2].join(':');

	if (!grouping.hasOwnProperty(metadataKey1)) {
		grouping[metadataKey1] = {};
	}

	if (!grouping[metadataKey1].hasOwnProperty(taxonomy1)) {
		grouping[metadataKey1][taxonomy1] = {};
	}

	if (!grouping[metadataKey1][taxonomy1].hasOwnProperty(name1)) {
		grouping[metadataKey1][taxonomy1][name1] = {};
	}

	if (!grouping[metadataKey1][taxonomy1][name1].hasOwnProperty(csv2)) {
		grouping[metadataKey1][taxonomy1][name1][csv2] = 0;
	}

	grouping[metadataKey1][taxonomy1][name1][csv2]++;
}

function aggregateArticles(articles, facets, minCorrelation, days, searchParams, filterByMetadataCsv=null)
{
	const metadataKeyPairsForCorrelationAnalysis = [
		['primaryTheme', 'topics'],
		['primaryTheme', 'regions'],
		['people', 'people'],
		['regions', 'regions'],
		['topics', 'topics'],
		['organisations', 'organisations'],
	];
	const articlesByUuid = {}; // UUID -> article
	const articlesByFacetTaxonomyName = {}; // {metadataKey}{taxonomy}{name} -> [UUID]
	const facetCorrelations = {}; // {metadataKey}{taxonomy}{name} {metadataKey:taxonomy:name} -> count

	articles.forEach(article => {
		const uuid = article.id;
		const metadata = article.metadata;
		const metadataKeys = Object.keys(metadata);

		article.metadataCsvs = [];

		// construct list of all facetTuples for this article
		let facetTuples = []; // [ [metadataKey, term], ... ]
		metadataKeys.forEach( metadataKey => {
			if (metadataKey === 'primarySection' || metadataKey === 'primaryTheme') {
				facetTuples.push({
					metadataKey,
					term : metadata[metadataKey].term
				});
			} else {
				metadata[metadataKey].forEach( wrappedTerm => {
					facetTuples.push({
						metadataKey,
						term : wrappedTerm.term
					});
				});
			}
		});

		// construct the csv for each facetTuple
		facetTuples.forEach( facetTuple => {
			facetTuple.csv = [facetTuple.metadataKey, facetTuple.term.taxonomy, facetTuple.term.name].join(':');
		});

		// check if we have the specified filterByMetadataCsv (if not null),
		if (filterByMetadataCsv !== null) {
			const tuplesMatchingFilter = facetTuples.filter( facetTuple => facetTuple.csv === filterByMetadataCsv );
			if (tuplesMatchingFilter.length == 0) {
				return; // ignore this article if no tuples match
			}
		}

		articlesByUuid[uuid] = article;

		// filter out people who are authors
		const knownAuthors = {};
		facetTuples.forEach( facetTuple => {
			if (facetTuple.term.taxonomy == 'authors') {
				knownAuthors[facetTuple.term.name] = true;
			}
		})

		facetTuples = facetTuples.filter( facetTuple => facetTuple.term.taxonomy !== 'people' || ! knownAuthors[facetTuple.term.name]);

		// construct articlesByFacetTaxonomyName
		facetTuples.forEach( facetTuple => {
			addUuidToFacetTuple(articlesByFacetTaxonomyName, facetTuple, uuid);
		});

		// construct facetCorrelations
		facetTuples.forEach( facetTuple1 => {
			facetTuples.forEach( facetTuple2 => {
				if ( facetTuple1.csv !== facetTuple2.csv ) {
						addFacetCorrelation( facetCorrelations, facetTuple1, facetTuple2 );
					}
			});
		});

		// refactor metadata into CSVs
		facetTuples.forEach( facetTuple => {
			article.metadataCsvs.push( facetTuple.csv );
		});
	});

	// strip out weak correlations, using minCorrelation

	Object.keys( facetCorrelations ).forEach(metadataKey => {
		Object.keys( facetCorrelations[metadataKey] ).forEach( taxonomy => {
			Object.keys( facetCorrelations[metadataKey][taxonomy] ).forEach( name => {
				Object.keys( facetCorrelations[metadataKey][taxonomy][name] ).forEach( csv => {
					if (facetCorrelations[metadataKey][taxonomy][name][csv] < minCorrelation) {
						delete facetCorrelations[metadataKey][taxonomy][name][csv];
					}
				});
			});
		});
	});

	// refactor maps to use CSVs

	const facetCorrelationsCsv = {};
	Object.keys( facetCorrelations ).forEach(metadataKey => {
		Object.keys( facetCorrelations[metadataKey] ).forEach( taxonomy => {
			Object.keys( facetCorrelations[metadataKey][taxonomy] ).forEach( name => {
				const numCorrelating = Object.keys( facetCorrelations[metadataKey][taxonomy][name] ).length;
			  if (numCorrelating > 0) {
					const csv = [metadataKey, taxonomy, name].join(':');
					facetCorrelationsCsv[csv] = facetCorrelations[metadataKey][taxonomy][name];
				}
			});
		});
	});

	const articlesByMetadataCsv = {};
	Object.keys( articlesByFacetTaxonomyName ).forEach(metadataKey => {
		Object.keys( articlesByFacetTaxonomyName[metadataKey] ).forEach( taxonomy => {
			Object.keys( articlesByFacetTaxonomyName[metadataKey][taxonomy] ).forEach( name => {
				const csv = [metadataKey, taxonomy, name].join(':');
					articlesByMetadataCsv[csv] = articlesByFacetTaxonomyName[metadataKey][taxonomy][name];
			});
		});
	});

	// analyse correlations

  const correlationAnalysis = {};
  const correlationAnalysisBubblingUnder = {};
	metadataKeyPairsForCorrelationAnalysis.forEach( keyPair => {
		const metadataKey = keyPair[0];
		const taxonomy    = keyPair[1];
		if (!correlationAnalysis.hasOwnProperty(metadataKey)) {
			correlationAnalysis[metadataKey] = {};
      correlationAnalysisBubblingUnder[metadataKey] = {};
		}
		if (!correlationAnalysis[metadataKey].hasOwnProperty(taxonomy)) {
      correlationAnalysis[metadataKey][taxonomy] = {};
      correlationAnalysisBubblingUnder[metadataKey][taxonomy] = {};
		}
		if (facetCorrelations.hasOwnProperty(metadataKey)) {
			if (facetCorrelations[metadataKey].hasOwnProperty(taxonomy)) {
				const correlatedNames = Object.keys(facetCorrelations[metadataKey][taxonomy]);
				const nameCountPairs = [];
        const namesBubblingUnder = [];
				correlatedNames.forEach( name => {
					const csvs = Object.keys(facetCorrelations[metadataKey][taxonomy][name]);
					const counts = Object.values(facetCorrelations[metadataKey][taxonomy][name]);
					const maxCount = Math.max( ...counts);
					if (csvs.length > 0	) {
						nameCountPairs.push([name, maxCount]);
					} else {
            namesBubblingUnder.push(name);
          }
				});
				nameCountPairs.sort( (a,b) => { return b[1] - a[1] });
        namesBubblingUnder.sort();
        correlationAnalysis[metadataKey][taxonomy] = nameCountPairs;
        correlationAnalysisBubblingUnder[metadataKey][taxonomy] = namesBubblingUnder;
			}
		}
	});

	return {
		'description': [
			`Obtained all articles from last ${days} days, constructed assorted views of the articles' metadata`,
			`filterByMetadataCsv: ${filterByMetadataCsv}`,
			`searchParams:${JSON.stringify(searchParams)}`,
			'correlationAnalysis: {metadataKey}{taxonomy} -> [ [name, maxCount], ...] - looking at most highly correlated metadataKey:taxonomy:names',
      'correlationAnalysisBubblingUnder: {metadataKey}{taxonomy} -> [ [name], ...]',
			'articlesByMetadataCsv: {"metadataKey:taxonomy:name"} -> [UUID,...]',
			`facetCorrelationsCsv: {"metadataKey:taxonomy:name"} -> {"metadataKey:taxonomy:name"} -> count (>= ${minCorrelation})`,
			`facetCorrelations: {metadataKey}{taxonomy}{name} -> {"metadataKey:taxonomy:name"} -> count (>= ${minCorrelation})`,
			'articlesByMetadataCsv: {metadataKey}{taxonomy}{name} -> [UUID,...]',
			'articlesByUuid: {UUID} -> article',
		],
		'numArticles' : Object.keys(articlesByUuid).length,
		correlationAnalysis,
    correlationAnalysisBubblingUnder,
		articlesByMetadataCsv,
		facetCorrelationsCsv,
		facetCorrelations,
		articlesByFacetTaxonomyName,
		articlesByUuid,
	}
}


function checkMetaDataPresent(aspects){
	if(!aspects.some((element) => element === 'metadata')) {
		aspects.push('metadata')
	}
	return aspects;
}

function wrapResults(results, days) {
    return {
        description: `List of facets, from the last ${days} days. Each returned facet item has a list of articles it features in and a list of other facets listed by those articles`,
        facetItemTotal: results.facetItemCount,
        articleTotal: results.articleCount,
        breakdown: results.breakdown
    };
}

function sortArticlesIntoFacets(articles, facets)
{
	let facetWithArticles = [];
	let totalArticleCount = 0;
	let facetList = ['people', 'organisations', 'genre', 'topics'];

	if(facets.length > 0){
		facetList = facets;
	}

	articles.forEach(article => {

		facetList.forEach(facetName => {

			const facets = article.metadata[facetName];

			if(!!facets){
				facets.forEach(facet => {

					let authors = [];
					let topicExclusions = getExclusions('topics');

					if(article.metadata.authors){
						authors = article.metadata.authors.map(x => x.term.name);
					}

					if(!authors.includes(facet.term.name) && !topicExclusions.includes(facet.term.name)){
						let itemObj = objs.getItem(facetWithArticles, 'facetName', facet.term.name);

						if(itemObj === undefined){
							facetWithArticles.push( newCollection(facet.term.name) );
							itemObj = objs.getItem(facetWithArticles, 'facetName', facet.term.name);
						}

						itemObj.facet = facetName;
						itemObj.articleCount = itemObj.articleCount++;
						itemObj.articles.push(article);
						itemObj.related.topics = addRelatedFacets('topics', itemObj, article.metadata.topics, getExclusions('topics'));
						itemObj.related.people = addRelatedFacets('people', itemObj, article.metadata.people, authors);
						itemObj.related.orgs = addRelatedFacets('organisations', itemObj, article.metadata.organisations);
						itemObj.related.genre = addRelatedFacets('genre', itemObj, article.metadata.genre);
					}
				});
			}
			totalArticleCount++;

		});

	});

	facetWithArticles.forEach(item => {
		item.relatedTopicCount = arrs.uniqueSort(item.related.topics, "count");
		item.relatedPeopleCount = arrs.uniqueSort(item.related.people, "count");
		item.relatedOrgsCount = arrs.uniqueSort(item.related.orgs, "count");
		item.relatedGenreCount = arrs.uniqueSort(item.related.genre, "count");
		item.articleCount = item.articles.length;
		delete item.related;
	});

	arrs.sortArray(facetWithArticles, "articleCount");

	return {
		breakdown: facetWithArticles,
		facetItemCount: facetWithArticles.length,
		articleCount: totalArticleCount
	};
}

function getExclusions(facet){
	switch(facet){
		case "topics":
			return [
				"Companies",
				"World",
				"Markets"
			];
			break;
		default:
			return [];
			break;
	}
}

function newCollection(name) {
    return {
        facetName: name,
        articles: [],
        articleCount: 0,
        related: {
            topics: [],
            people: [],
            orgs: [],
            genre: []
        },
    };
}

function addRelatedFacets(type, obj, data, exclusions = null) {
    if (data) {
        const existingData = (obj.related[type]) ? obj.related[type] : [];
        const newData = data.reduce((results, item) => {
            if (item.term.name !== obj.facetName) {
                if (exclusions !== null) {
                    if (!exclusions.includes(item.term.name)) {
                        results.push(item.term.name);
                    }
                } else {
                    results.push(item.term.name);
                }
            }
            return results;
        }, []);
        return existingData.concat(newData);
    } else {
        return [];
    }
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

function searchFacetHistory(params)
{
	const MAX_FACETS			= 100;
	const MAX_INTERVAL			= 5;
	const MAX_INTERVAL_NUM		= 10;
	const DEFAULT_PERIOD		= 'days';
	const DEFAULT_FACETS		= 10;
	const DEFAULT_INTERVAL		= 1;
	const DEFAULT_INTERVAL_NUM	= 5;

	const searchFacet		= prepFacet(params.facet);
	const searchPeriod		= parameters.check('string', params.period, 0, 0, ['minutes','hours','days'], 'days');
	const intervaledFacets 	= [];
	const recentTopFacets	= [];
	const facetHistory		= {};

	let numInterval 		= parameters.check('int', params.interval, 1, MAX_INTERVAL, null, DEFAULT_INTERVAL);
	let numIntervals 		= parameters.check('int', params.numInterval, 1, MAX_INTERVAL_NUM, null, DEFAULT_INTERVAL_NUM);
	let numFacetItems		= parameters.check('int', params.maxFacets, 1, MAX_FACETS, null, DEFAULT_FACETS);
	let fullDateTime		= time.getDatetimeRange(searchPeriod, (numInterval * numIntervals), 0);
	let searches 			= createDateTimeRangeQueryStrings(searchPeriod, numInterval, numIntervals, searchFacet);

	let resultFacets		= {
		description : "Returns metrics for facet numbers over the time period specificed in the params of the query",
		requestParams : {
			facet : searchFacet,
			period : searchPeriod,
			interval : numInterval,
			numInterval : numIntervals,
			maxFacets : numFacetItems,
		},
		datetimeRange : {
			start : fullDateTime.first,
			end : fullDateTime.next,
			list : fullDateTime.list,
		}
	};

	return searchSequence(searches)
		.then(results => {

			searchFacet.forEach(sf => {
				intervaledFacets[sf] = [];
			})

			// get facet elements for all returned days
			results.forEach(result => {
				let facet = result.sapiObj.results[0].facets;
				let indexCount = result.sapiObj.results[0].indexCount;

				if(indexCount > 0 && facet !== undefined){
					facet.forEach( facetElement => {
						if(facetElement.name.indexOf('Id') < 0 && searchFacet.includes(facetElement.name)){
							intervaledFacets[facetElement.name].push( facetElement.facetElements );
						}
					});
				}
			});

			// stop if no results found
			if(Object.keys(intervaledFacets).length === 0){
				return {
					error: "No results found for this set of queries"
				};
			}

			// get counts for each day for each facet item
			let collection = [];

			searchFacet.forEach(sf => {
				let dataset = intervaledFacets[sf];
				for(let i = 0; i <= dataset.length; i++){
					if(dataset[i]){
						dataset[i].forEach(item => {
							let obj = Object.entries(item);
							let name = obj[0][1];
							let count = obj[1][1];
							let targetObj = collection.find(obj => { return obj.name === name; });

							if(!targetObj){
								let newCount = new Array(dataset.length).fill(0);
								let logCount = newCount;
								collection.push({
									name: name,
									count: newCount,
									logCount: []
								});
								targetObj = collection.find(obj => { return obj.name === name; });
							}

							targetObj.count[i] = count;
						});
					}
				}

			});

			collection.forEach(col => {
				col.logCount = col.count.map(x => (Math.log10(x) !== -Infinity) ? Math.log10(x) : 0 );
			});

			resultFacets['facets'] = collection;
			return resultFacets;
		})
		.catch(err => {
			throw err;
		});
}

function prepFacet(facet = []) {
    if (typeof facet === "string") {
        let arr = [];
        arr.push(facet);
        return arr;
    }
    return facet;
}

function createDateTimeRangeQueryStrings(period, numInterval, numIntervals, searchFacet){
	let queries = [];
	for (let i = 0; i <= numIntervals; i++) {
		queries.push( createFacetQueryString(period, numInterval, searchFacet, i) );
	}
	return queries;
}

function createFacetQueryString(period, invterval, facets, offset){
	if(checkFacets(facets)){
		const datetimeRange = time.getDatetimeRange(period, invterval, offset);
		return {
			"queryString": `lastPublishDateTime:>${datetimeRange.next} AND lastPublishDateTime:<${datetimeRange.first}`,
			"maxResults" : 1,
			"facets" : {
				"names" : genFacetListing(facets),
				//"names": ["topics", "topicsId"],
				"maxElements" : -1
			}
		};
	}

	console.log("createFacetQueryString: Incorrect facets passed");
	return "";
}

function checkFacets(facets) {
    const supported = ['topics', 'organisations', 'people', 'genre'];
    return facets.some(item => {
        return supported.includes(item);
    });
}

function genFacetListing(facets) {
    let arr = [];
    facets.forEach(facet => {
        arr.push(facet);
        arr.push(facet + 'Id');
    });
    return arr;
}

module.exports = {
	search,
	searchDeeper,
	searchSequence,
	searchFacetHistory,
	getArticle,
	getArticles,
	getRecentArticles,
	getArticleRelations,
	constructUUIDsQuery,
	getArticlesAggregation,
  getArticlesAggregationWithListHistory
};
