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


router.get('/topics/last7days', async (req, res, next) => {
	try {
		const num_days	= 7;
		const searches	= [];
		
		for (let i = 1; i <= num_days; i++) {
			searches.push( createQueryString(i) );
		}

		const articles = await Article.searchBySequence(searches);
		res.json(articles);
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
