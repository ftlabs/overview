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


router.get('/facetHistory/:facet/:days/:numFacetItems', async (req, res, next) => {

	//TODO: update to be 'time period' & interval/frequency rather than days

	try {
		const MAX_FACET_ITEMS	= 20;
		const searchFacet		= req.params.facet;
		const numDays			= req.params.days;
		const numFacetItems		= req.params.numFacetItems;
		const searches			= [];
		const dailyTopTopics 	= [];
		const todaysTopTopics	= [];
		const topicFacets		= {};

		const resultFacets = {
			description : "Returns metrics for facet numbers over the time period specificed in the params of the query",
			requestParams : {
				facet : searchFacet,
				days : numDays,
				numFacetItems : numFacetItems
			}
		}

		// Check passed params are within acceptable ranges 
		//TODO: check if req.params are in correct format > or error out

		// Apply hard coded limits
		if(numDays > MAX_DAYS){
			numDays = MAX_DAYS;
		}
		if(numFacetItems > MAX_FACET_ITEMS){
			numFacetItems = MAX_FACET_ITEMS;
		}



		// Create date query strings
		for (let i = 1; i <= numDays; i++) {
			searches.push( createFacetQueryString(searchFacet, i) );
		}

		// Request API results for each query string
		const queryResults = await Facet.searchBySequence(searches);

		// Get facet topics for all returned days
		queryResults.forEach(result => {
			let facet = result.sapiObj.results[0].facets;

			facet.forEach( facetElement => {
				if(facetElement.name === searchFacet){
					// Shouldn't this just get all?
					if(numFacetItems === null && numFacetItems === 0){
						dailyTopTopics.push( facetElement.facetElements );
					} else {
						dailyTopTopics.push( facetElement.facetElements.slice(0, numFacetItems) );
					}
				}
			});
		});

		// get today's (last 24 hours) of top topics
		dailyTopTopics[0].forEach( topic => {
			if(topic.hasOwnProperty('name')){
				todaysTopTopics.push(topic.name);
			}
		});

		// find the numbers for each of today's top topics in the returned days worth of topics
		todaysTopTopics.forEach( topTopic => {
			topicFacets[topTopic] = [];

			dailyTopTopics.forEach( day => {
				const facetValue = day.filter(topic => topic.name == topTopic);

				if(facetValue[0] !== undefined && facetValue[0].hasOwnProperty('count')){
					topicFacets[topTopic].push(facetValue[0].count);
				} else {
					topicFacets[topTopic].push(0);
				}
			});
		});

		resultFacets.topics = topicFacets;

		//return
		res.json(resultFacets);

	} catch (err) {
		console.log('err: ' + err);
	}
});


function createFacetQueryString(facetName, i){
	if( facetName === "topics" || facetName === "people" || facetName === "organisations" ){
		const datetimeRange = Time.getDatetimeRange('days', 1, i);
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
