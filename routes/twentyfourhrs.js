const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const parameters = require('../helpers/parameters');


// paths
router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/1', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/one", { results: results });
});

router.get('/2', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/two", { results: results });
});

router.get('/2a', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(2);
	results = parameters.limitReturn(results, 100);
	res.render("twentyfourhrs/twoA", { results: results });
});

router.get('/3', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/three", { results: results });
});


// endpoints
router.get('/daysOfArticles', async (req, res, next) => {
	let aspects = (req.query.aspects) ? req.query.aspects : undefined;
	let facets = (req.query.facets) ? req.query.facets : undefined;
	let results = await article.getDaysOfRecentArticles(req.query.days, aspects, facets);
	res.json( results );
});



module.exports = router;
