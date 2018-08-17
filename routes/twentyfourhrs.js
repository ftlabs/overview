const express = require('express');
const router = express.Router();
const Article = require('../modules/article');
const Facet = require('../modules/facet');
const Time = require('../helpers/time');


router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/1', async (req, res, next) => {
	res.render("twentyfourhrs/one");
});

router.get('/2', async (req, res, next) => {
	res.render("twentyfourhrs/two");
});

router.get('/2a', async (req, res, next) => {
	res.render("twentyfourhrs/twoA");
});

router.get('/3', async (req, res, next) => {
	res.render("twentyfourhrs/three");
});

router.get('/dataReq', async (req, res, next) => {
	try {
		const date = Time.getDatetimeRange('days', 1, 0);
		console.log(date);
		const params = {
			queryString: "lastPublishDateTime:>" + date.next,
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
