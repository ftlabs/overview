// This module makes use of 'node-fetch' to acces SAPI

const fetch = require('node-fetch');
const debug = require('debug')('lib:fetchContent');
const parameters = require('../helpers/parameters');
const time = require('../helpers/time');
const arrs = require('../helpers/array');
const objs = require('../helpers/object');
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

		const searchItems = [searchItem];
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

function getArticleRelations(days, facets, aspects)
{
	const date = time.getDatetimeRange('days', days, 0);
	aspects = checkMetaDataPresent(aspects);
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
		.then(articles => sortArticlesIntoFacets(articles, facets) )
		.then(article => wrapResults(article, days) )
		.catch(err => {
			throw err;
		});
}

function checkMetaDataPresent(aspects){
	if(!aspects.some((element) => element === 'metadata')) {
		aspects.push('metadata')
	}
	return aspects;
}

function wrapResults(results, days){
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
					let itemObj = objs.getItem(facetWithArticles, 'facetName', facet.term.name);

					if(itemObj === undefined){
						facetWithArticles.push( newCollection(facet.term.name) );
						itemObj = objs.getItem(facetWithArticles, 'facetName', facet.term.name);
					}

					let authors = [];
					
					if(article.metadata.authors){
						authors = article.metadata.authors.map(x => x.term.name);
					}

					itemObj.facet = facetName;
					itemObj.articleCount = itemObj.articleCount++;
					itemObj.articles.push(article);
					itemObj.related.topics = addRelatedFacets('topics', itemObj, article.metadata.topics);
					itemObj.related.people = addRelatedFacets('people', itemObj, article.metadata.people, authors);
					itemObj.related.orgs = addRelatedFacets('organisations', itemObj, article.metadata.organisations);
					itemObj.related.genre = addRelatedFacets('genre', itemObj, article.metadata.genre);
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

function newCollection(name){
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

function addRelatedFacets(type, obj, data, exclusions = null){
	if(data){
		const existingData = (obj.related[type]) ? obj.related[type] : [];
		const newData = data.reduce((results, item) => {
			if(item.term.name !== obj.facetName){
				if(exclusions !== null){
					if(!exclusions.includes(item.term.name)){
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

function extractArticles(results)
{
	const articles = [];
	results.forEach(result => {
		result.sapiObj.results[0].results.forEach(article => {
			articles.push(article);
		});
	});
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

function prepFacet(facet = []){
	if(typeof facet === "string"){
		var arr = [];
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

function checkFacets(facets){
	const supported = ['topics', 'organisations', 'people', 'genre'];
	return facets.some(item => {
		return supported.includes(item);
	});
}

function genFacetListing(facets){
	var arr = [];
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
	getRecentArticles,
	getArticleRelations
};
