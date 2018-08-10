const express = require('express');
const router = express.Router();
const Article = require('../modules/Article');


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


function getISODatetimeMinusXDays(num_days){
	return new Date( Math.round( new Date().getTime() - ((24 * 3600 * 1000)*(num_days)) ) ).toISOString().split('.')[0]+"Z";
}

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


/*
 * 
 */
router.get('/todaysTopTopics/:days/:numTopics', async (req, res, next) => {
	const MAX_DAYS = 30;
	const MAX_TOPICS = 20;


	return [];
});


router.get('/topics/last7days', async (req, res, next) => {
	try {
		const num_days			= 7;
		const searches			= [];
		let dailyTopTopics 		= [];
		let todaysTopTopics		= [];
		let topicFacets			= {};
		
		for (let i = 1; i <= num_days; i++) {
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

		console.log(topicFacets);

		res.json(topicFacets);
	} catch (err) {
		console.log(err);
	}
});


function createQueryString(i){
	let query = {
		"queryString": "",
		"maxResults" : 1,
		"aspects" : [ 
			"lifecycle",
			"title"
		],
		"facets" : {"names":["topics", "topicsId"], "maxElements":-1}
	};
	let qString = "lastPublishDateTime:>" + getISODatetimeMinusXDays(i) + " AND " + "lastPublishDateTime:<" + getISODatetimeMinusXDays(i-1);
	query.queryString = qString;
	return query;
}




module.exports = router;
