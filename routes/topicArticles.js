const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	res.render("topicArticles");
});

// endpoints
router.get('/relatedContent', async (req, res, next) => {
	let days = ( req.query.days ) ? req.query.days : 1;
	let facet = ( req.query.facet ) ? req.query.facet : 'topics';
	let results = await article.getArticlesInTopics( days, facet );

	res.setHeader("Content-Type", "application/json");
	res.json( results );
});



module.exports = router;
