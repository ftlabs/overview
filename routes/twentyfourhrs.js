const express = require('express');
const router = express.Router();
const Article = require('../modules/Article');
const Facet = require('../modules/Facet');
const Time = require('../helpers/Time');


router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/1', async (req, res, next) => {
	res.render("twentyfourhrs/one");
});

router.get('/2', async (req, res, next) => {
	res.render("twentyfourhrs/two");
});

router.get('/3', async (req, res, next) => {
	res.render("twentyfourhrs/three");
});

// -----------------------------------------

/**
 * Returns numerical facet history for the selected time period.
 *
 * @string 	facet 			facet type to query [topic, organisation, people] matching id facet auto included e.g. people & peopleId 
 * @string 	period 			time period to query [minutes, hours, days]
 * @integer interval 		quantity of the time period to query [1, 10]
 * @integer numInterval 	number of intervals [1, 10]
 * @integer maxFacets 		number of facets to retrun results for [0, 100]
 *
 * @example url
 * http://localhost:8000/24hrs/facetHistory/topics/day/1/5/10
 * Quering the topic history of the past 5 days, 1 day intervals and limit returned top facets to 10
 * 
 */
  
router.get('/facetHistory/:facet/:period/:interval/:numInterval/:maxFacets', async (req, res, next) => {

	const MAX_FACETS			= 100;
	const MAX_INTERVAL			= 10;
	const MAX_INTERVAL_NUM		= 10;

	try {
		const searchFacet		= req.params.facet;
		const searchPeriod		= req.params.period;
		const intervaledFacets 	= [];
		const recentTopFacets	= [];
		const facetHistory		= {};

		let numInterval			= (req.params.interval > MAX_INTERVAL ? MAX_INTERVAL : req.params.interval);
		let numIntervals		= (req.params.numInterval > MAX_INTERVAL_NUM ? MAX_INTERVAL_NUM : req.params.numInterval);
		let numFacetItems		= (req.params.maxFacets > MAX_FACETS ? MAX_FACETS : req.params.maxFacets);
		let resultFacets		= {
			description : "Returns metrics for facet numbers over the time period specificed in the params of the query",
			requestParams : {
				facet : searchFacet,
				period : searchPeriod,
				interval : numInterval,
				numInterval : numIntervals,
				maxFacets : numFacetItems
			}
		}

		const searches = createDateTimeRangeQueryStrings(searchPeriod, numInterval, numIntervals, searchFacet);
		const queryResults = await Facet.searchBySequence(searches);


		// get facet elements for all returned days
		queryResults.forEach(result => {
			let facet = result.sapiObj.results[0].facets;

			facet.forEach( facetElement => {
				if(facetElement.name === searchFacet){
					intervaledFacets.push( facetElement.facetElements );
				}
			});
		});


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
		res.json(resultFacets);

	} catch (err) {
		console.log('err: ' + err);
	}
});

function createDateTimeRangeQueryStrings(period, numInterval, numIntervals, searchFacet){
	let queries = [];
	for (let i = 0; i <= numIntervals; i++) {
		queries.push( createFacetQueryString(period, numInterval, searchFacet, i) );
	}
	return queries; 
}

function createFacetQueryString(period, invterval, facetName, offset){

	if( facetName === "topics" || facetName === "people" || facetName === "organisations" ){
		const datetimeRange = Time.getDatetimeRange(period, invterval, offset);

		return query = {
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

// -----------------------------------------

router.get('/dataReq', async (req, res, next) => {
	try {
		const date = getISODatetimeMinusXDays(1);
		const params = {
			queryString: "lastPublishDateTime:>" + date,
			maxResults : 100,
			aspects : [ 
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
			],
			facets : {"names":[ "organisations", "organisationsId", "people", "peopleId", "topics", "topicsId"], "maxElements":-1}
		};
		const articles = await Article.searchByParamsDeep(params, 4);
		res.json(articles);
	} catch (err) {
		next(err);
	}
});

router.get('/topics/last7days', async (req, res, next) => {
	try {
		const num_days			= 7;
		const searches			= [];
		let dailyTopTopics 		= [];
		let todaysTopTopics		= [];
		let topicFacets			= {};
		
		for (let i = 0; i <= num_days; i++) {
			searches.push( createQueryString(i) );
		}

		const articles = await Article.searchBySequence(searches);


		// get last 7 days of facet topics
		articles.forEach(element => {
			let facets = element.sapiObj.results[0].facets;
			facets.forEach( facet => {
				if(facet.name === 'topics'){
					let topicSlice = facet.facetElements.slice(0,20);
					dailyTopTopics.push(topicSlice);
				}
			});
		});


		// get today's (last 24 hours) of top topics
		dailyTopTopics[0].forEach( topic => {
			if(topic.hasOwnProperty('name')){
				todaysTopTopics.push(topic.name);
			}
		});


		//find the numbers for each of today's top topics in the last 7 days worth of topics
		todaysTopTopics.forEach( topTopic => {
			topicFacets[topTopic] = [];

			dailyTopTopics.forEach( day => {
				const facetValue = day.filter(topic => topic.name == topTopic);
				if(facetValue[0] != undefined && facetValue[0].hasOwnProperty('count')){
					topicFacets[topTopic].push(facetValue[0].count);
				} else {
					topicFacets[topTopic].push(0);
				}
			});
		});


		res.json(topicFacets);
	} catch (err) {
		console.log('err:' + err);
	}
});


function createQueryString(i){
	const datetimeRange = Time.getDatetimeRange('days', 1, i);
	return query = {
		"queryString": `lastPublishDateTime:>${datetimeRange.next} AND lastPublishDateTime:<${datetimeRange.first}`,
		"maxResults" : 1,
		"aspects" : [ 
			"title"
		],
		"facets" : {
			"names" : ["topics"],
			"maxElements" : -1
		}
	};
}



module.exports = router;
