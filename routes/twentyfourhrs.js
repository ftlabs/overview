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


router.get('/dataReq', async (req, res, next) => {
	try {
		const params = {
			queryString: "lastPublishDateTime:>2018-08-05T00:00:00Z",
			maxResults : 30,
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
		const articles = await Article.searchByParams(params);
		res.json(articles);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
