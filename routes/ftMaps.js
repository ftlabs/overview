const express = require('express');
const router = express.Router();
const articleList = require('../modules/article');
const countries = require('../static/js/mapCodes/countryCodes.js');
const continents = require('../static/js/mapCodes/continentCodes.js');

// paths
router.get('/', async (req, res, next) => {
	res.render("ftMaps");
});

router.get('/view', async (req, res, next) => {
	res.render("ftMaps/view",);
});

router.get('/articleList', async (req, res, next) => {
	let results = await articleList.getDaysOfRecentArticles(1);

	results = results.map(item => {
		let itemObj = {};

		if (item.metadata.regions) {
			itemObj.title = item.title.title;
			itemObj.region = item.metadata.regions[0].term.name;
			return itemObj;
		}
	}).filter(n => n)
	res.send(results);
});

router.get('/countryCodes', async (req, res, next) => {
	res.send(countries)
});

router.get('/continentCodes', async (req, res, next) => {
	res.send(continents)
});

module.exports = router;
