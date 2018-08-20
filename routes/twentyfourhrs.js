const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const parameters = require('../helpers/parameters');
 

// paths
router.get('/', async (req, res, next) => {
	res.render("twentyfourhrs");
});

router.get('/1', async (req, res, next) => {
	res.render("twentyfourhrs/one", { results: await article.getDaysOfRecentArticles(1) });
});

router.get('/2', async (req, res, next) => {
	res.render("twentyfourhrs/two", { results: await article.getDaysOfRecentArticles(1) });
});

router.get('/2a', async (req, res, next) => {
	let results = await article.getDaysOfRecentArticles(2);
	results = parameters.limitReturn(results, 100);
	res.render("twentyfourhrs/twoA", { results: results });
});

router.get('/3', async (req, res, next) => {
	res.render("twentyfourhrs/three", { results: await article.getDaysOfRecentArticles(1) });
});


// endpoints
router.get('/daysOfArticles', async (req, res, next) => {
	res.json( await article.getDaysOfRecentArticles(req.query.days) );
});



module.exports = router;
