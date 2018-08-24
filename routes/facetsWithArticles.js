const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	res.render("facetsWithArticles");
});

router.get('/test', async (req, res, next) => {
	const results = await article.getArticlesInTopics( 1, 'topics' );
	res.render("facetsWithArticles/test", { facetsJson: JSON.stringify(results) } );
});

// endpoints
router.get('/relatedContent', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const facet = ( req.query.facet ) ? req.query.facet : 'topics';
	let aspects = ( req.query.aspects ) ? req.query.aspects : undefined;

	if(aspects){ aspects = aspects.split(',') }

	const results = await article.getArticlesInTopics( days, facet, aspects );

	res.setHeader("Content-Type", "application/json");
	res.json( results );
});



module.exports = router;
