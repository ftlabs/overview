const express = require('express');
const router = express.Router();
const articleList = require('../modules/article');

// paths
router.get('/', async (req, res, next) => {
	res.render("tinder");
});

router.get('/aMatch', async (req, res, next) => {
	let results = await articleList.getDaysOfRecentArticles(1);

	results = results.map(item => {
		let itemObj = {};
		
		if (item.images[0] && item.images[0].url) {
			itemObj.title = item.title.title;
			itemObj.url = item.images[0].url;
			return itemObj;
		}
	})

	res.render("tinder/aMatch", { results: results });
});

router.get('/myType', async (req, res, next) => {
	let results = await articleList.getDaysOfRecentArticles(1);
	res.render("tinder/myType", { results: results });
});

module.exports = router;
