const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const parameters = require('../helpers/parameters');
 

const defaultAspects = ["audioVisual",
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
const defaultFacets = ["organisations",
						"organisationsId",
						"people", 
						"peopleId",
						"topics",
						"topicsId"
					];




// paths
router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/1', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1, defaultAspects, defaultFacets);
	res.render("twentyfourhrs/one", { results: results });
});

router.get('/2', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1, defaultAspects, defaultFacets);
	res.render("twentyfourhrs/two", { results: results });
});

router.get('/2a', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(2, defaultAspects, defaultFacets);
	results = parameters.limitReturn(results, 100);
	res.render("twentyfourhrs/twoA", { results: results });
});

router.get('/3', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1, defaultAspects, defaultFacets);
	res.render("twentyfourhrs/three", { results: results });
});


// endpoints
router.get('/daysOfArticles', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(req.query.days, defaultAspects, defaultFacets);
	res.json( results );
});



module.exports = router;
