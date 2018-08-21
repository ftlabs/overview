// This module makes use of 'node-fetch' to acces SAPI

const fetch = require('node-fetch');
const debug = require('debug')('lib:fetchContent');
const parameters = require('../helpers/parameters');
const time = require('../helpers/time');
const CAPI_KEY = process.env.CAPI_KEY;
if (!CAPI_KEY) {
	throw new Error('ERROR: CAPI_KEY not specified in env');
}
const CAPI_PATH = 'http://api.ft.com/enrichedcontent/';
const SAPI_PATH = 'http://api.ft.com/content/search/v1';

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
		.catch(err => {
			console.log(`ERROR: search: err=${err}.`);
			return { params }; // NB, no sapiObj...
		});
}


function searchSequence(searches){
	if(searches === undefined || searches.length === 0){
		return [];
	}

	let searchPromises = [];
	searches.forEach( params => {
		searchPromises.push( search(params) );
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
function searchDeeper(params, maxDepth = DEFAULT_MAX_SEARCH_DEPTH){
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
	.then( searchItem => {
		const sapiObj = searchItem.sapiObj;
		const durationMs = Date.now() - params.startMs;

		searchItem.maxDepth         = maxDepth;
		searchItem.offset           = sapiObj.query.resultContext.offset;
		searchItem.maxResults       = sapiObj.query.resultContext.maxResults;
		searchItem.indexCount       = sapiObj.results[0].indexCount;
		searchItem.thisNumResults   = sapiObj.results[0].results.length;
		searchItem.remainingResults = Math.max(0, searchItem.indexCount - searchItem.thisNumResults - searchItem.offset);
		searchItem.durationMs       = durationMs;

		const searchItems = [searchItem]
		if(
			searchItem.maxDepth < 2
			|| searchItem.remainingResults <= 0
			|| durationMs >= params.maxDurationMs
		){
			debug(`searchDeeper: curtailing: searchItem.maxDepth=${searchItem.maxDepth}, searchItem.remainingResults=${searchItem.remainingResults}, searchItem.indexCount=${searchItem.indexCount}, durationMs=${durationMs}, params.maxDurationMs=${params.maxDurationMs}`);
			return searchItems;
		}

		const nextParams = Object.assign({}, params);
		if (!nextParams.hasOwnProperty('offset')) {
				nextParams.offset = 0;
		}
		nextParams.offset = nextParams.offset + searchItem.maxResults;
		return searchDeeper( nextParams, maxDepth-1 )
		.then( nextSearchItems => searchItems.concat(nextSearchItems) )
		;
	})
	.catch( err => {
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

function getRecentArticles(days, aspects, facets)
{
	const date = time.getDatetimeRange('days', days, 0);
	const params = {
		queryString: `lastPublishDateTime:> ${date.next}`,
		maxResults : 100,
		aspects : aspects,
		facets : {
			"names": facets,
			"maxElements":-1
		}
	};

	return searchDeeper(params, 10)
		.then(results =>  extractArticles(results) )
		.catch(err => {
			throw err;
		});
}

function extractArticles(results)
{
	let articles = [];
	results.forEach(result => {
		result.sapiObj.results[0].results.forEach(article =>  articles.push(article) );
	});
	return articles;
}

function searchFacetHistory(params)
{
	const MAX_FACETS			= 100;
	const MAX_INTERVAL			= 5;
	const MAX_INTERVAL_NUM		= 5;
	const DEFAULT_PERIOD		= 'days';
	const DEFAULT_FACETS		= 10;
	const DEFAULT_INTERVAL		= 1;
	const DEFAULT_INTERVAL_NUM	= 5;

	const searchFacet		= params.facet;
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
		}
	};

	return searchSequence(searches)
		.then(results => {

			// get facet elements for all returned days
			results.forEach(result => {
				let facet = result.sapiObj.results[0].facets;
				let indexCount = result.sapiObj.results[0].indexCount;

				if(indexCount > 0 && facet !== undefined){
					facet.forEach( facetElement => {
						if(facetElement.name === searchFacet){
							intervaledFacets.push( facetElement.facetElements );
						}
					});
				}
			});


			// stop if no results found
			if(intervaledFacets.length === 0){
				return {
					error: "No results found for this set of queries"
				};
			}

			// get most recent segement of top facets
			if(numFacetItems >= intervaledFacets[0].length){
				numFacetItems = intervaledFacets[0].length;
			}

			for (var i = 0; i < numFacetItems; i++) {
				let facet = intervaledFacets[0][i];

				if(facet.hasOwnProperty('name')){
					recentTopFacets.push(facet.name);
				}
			}


			// find the numbers for each of today's top facet elements
			recentTopFacets.forEach( topFacet => {
				facetHistory[topFacet] = [];

				intervaledFacets.forEach( day => {
					const facetValue = day.filter(item => item.name == topFacet);

					if(facetValue[0] !== undefined && facetValue[0].hasOwnProperty('count')){
						facetHistory[topFacet].push(facetValue[0].count);
					} else {
						facetHistory[topFacet].push(0);
					}
				});
			});


			resultFacets[searchFacet] = facetHistory;
			return resultFacets;
		})
		.catch(err => {
			throw err;
		});
}

function createDateTimeRangeQueryStrings(period, numInterval, numIntervals, searchFacet){
	let queries = [];
	for (let i = 0; i <= numIntervals; i++) {
		queries.push( createFacetQueryString(period, numInterval, searchFacet, i) );
	}
	return queries; 
}

function createFacetQueryString(period, invterval, facetName, offset){

	if( facetName === "topics" || facetName === "people" || facetName === "organisations" ){
		const datetimeRange = time.getDatetimeRange(period, invterval, offset);

		return {
			"queryString": `lastPublishDateTime:>${datetimeRange.next} AND lastPublishDateTime:<${datetimeRange.first}`,
			"maxResults" : 1,
			"facets" : {
				"names" : [facetName, facetName + "Id"],
				"maxElements" : -1
			}
		};	
	}

	console.log("createFacetQueryString: Incorrect facetName passed");
	return "";
}

module.exports = {
	search,
	searchDeeper,
	searchSequence,
	searchFacetHistory,
	getArticle,
	getRecentArticles
};
