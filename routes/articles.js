const express = require('express');
const router = express.Router();
const Article = require('../modules/Article');

router.get('/search/:searchTerm', async (req, res, next) => {
	try {
		const articles = await Article.searchByTerm(req.params.searchTerm);
		res.json(articles);
	} catch (err) {
		next(err);
	}
});

router.get('/get/:uuid', async (req, res, next) => {
	try {
		const article = await Article.getByUuid(req.params.uuid);
		res.json(article);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
