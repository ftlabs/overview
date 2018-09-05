const express = require('express');
const router = express.Router();
const articleList = require('../modules/article');

// paths
router.get('/', async (req, res, next) => {
	res.render("tinder");
});

router.get('/aMatch', async (req, res, next) => {
	res.render("tinder/aMatch",);
});

router.get('/myType', async (req, res, next) => {
	// TODO: pass local storage to results of myType to generate a reading list
	
	res.render("tinder/myType",);

	// let results = localStorage.getItem('readingList')
	// res.render("tinder/myType", { results : results });
});

router.get('/articleList', async (req, res, next) => {
	let results = await articleList.getDaysOfRecentArticles(1);

	results = results.map(item => {
		let itemObj = {};
		
		if (item.images[0] && item.images[0].url) {
			itemObj.title = item.title.title;
			itemObj.url = item.images[0].url;
			itemObj.author = item.editorial.byline;
			itemObj.link = item.location.uri;
			// add more if you need to!
			return itemObj;
		}
	}).filter(n => n)
	res.send(results);
});

module.exports = router;
