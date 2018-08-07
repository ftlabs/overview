const express = require('express');
const router = express.Router();
const Article = require('../modules/Article');
const queryString = "lastPublishDateTime:>2018-08-05T00:00:00Z";

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
		const articles = await Article.searchByTerm(queryString);
		res.json(articles);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
