const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	res.render("topicArticles");
});

// endpoints
router.get('/q', async (req, res, next) => {
	let days = ( req.query.days ) ? req.query.days : 1;
	let results = await article.getArticlesInTopics( days );

	res.setHeader("Content-Type", "application/json");
	res.json( results );
});



module.exports = router;
