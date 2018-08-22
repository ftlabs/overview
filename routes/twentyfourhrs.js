const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const parameters = require('../helpers/parameters');


// paths
router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/tiledTitles', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/tiledTitles", { results: results });
});

router.get('/tiledImages', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/tiledImages", { results: results });
});

router.get('/tiledImages100Grid', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(2);
	results = parameters.limitReturn(results, 100);
	res.render("twentyfourhrs/tiledImages100Grid", { results: results });
});

router.get('/stretchedImages', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(1);
	res.render("twentyfourhrs/stretchedImages", { results: results });
});


// endpoints
router.get('/daysOfArticles', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(req.query.days, req.query.aspects, req.query.facets);
	res.setHeader("Content-Type", "application/json");
	res.json( results );
});



module.exports = router;
