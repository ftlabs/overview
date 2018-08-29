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

router.get('/clusteredImages/:template/:facet', async (req, res, next) => {

	const results = await article.getArticlesInTopics(1, req.params.facet);

	switch(req.params.template){
		case 'one':
			view = 'facetsWithArticles/clusteredImages/one';
			data = results.breakdown.splice(0, 1);
			break;
		case 'two':
			view = 'facetsWithArticles/clusteredImages/two';
			data = results.breakdown.splice(0, 1);
			break;
		case 'three':
			view = 'facetsWithArticles/clusteredImages/three';
			data = results.breakdown.splice(0, 1);
			break;
		case 'four':
			view = 'facetsWithArticles/clusteredImages/four';
			data = results.breakdown.splice(0, 1);
			break;
		case 'five-a':
			view = 'facetsWithArticles/clusteredImages/fiveA';
			data = results.breakdown.splice(0, 3);
			break;
		case 'five-b':
			view = 'facetsWithArticles/clusteredImages/fiveB';
			data = results.breakdown.splice(0, 3);
			break;
		case 'five-c':
			view = 'facetsWithArticles/clusteredImages/fiveC';
			data = results.breakdown.splice(0, 3);
			break;
		case 'six':
			view = 'facetsWithArticles/clusteredImages/six';
			data = results.breakdown.splice(0, 3);
			break;
	}

	res.render(view, {data: data});
});


router.get('/relatedContent/one', async (req, res, next) => {
	const results = await article.getArticlesInTopics( 1, 'topics' );
	res.render("facetsWithArticles/relatedContent/one", {
		topTopic: results.breakdown.splice(0, 1)
	} );
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
