const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	res.render("facetsWithArticles");
});

router.get('/test', async (req, res, next) => {
	const results = await article.getArticleRelations( 1 );
	res.render("facetsWithArticles/test", { facetsJson: JSON.stringify(results) } );
});

router.get('/clusteredImages/:template/:facet', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	if(req.params.template.startsWith('five') || req.params.template === 'six'){
		data = results.breakdown.splice(0, 3);
	} else {
		data = results.breakdown.splice(0, 1);
	}
	res.render(`facetsWithArticles/clusteredImages/${req.params.template}`, {data: data});
});

router.get('/charts/:template/:facet/:days', async (req, res, next) => {
	const results = await article.getArticleRelations(req.params.days);
	const data = [];
	let maxitems = 10;

	for(var i = 0; i < results.breakdown.length; i++){
		if(results.breakdown[i].facet == req.params.facet){
			data.push(results.breakdown[i]);
		}
		if(data.length >= maxitems){
			break;
		}
	}

	res.render(`facetsWithArticles/charts/${req.params.template}`, {
		data: JSON.stringify(data),
		facet: req.params.facet
	});
});


// endpoints
router.get('/relatedContent', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const facet = ( req.query.facet ) ? req.query.facet : 'topics';
	let aspects = ( req.query.aspects ) ? req.query.aspects : undefined;

	if(aspects){ aspects = aspects.split(',') }

	const results = await article.getArticleRelations( days );

	res.setHeader("Content-Type", "application/json");
	res.json( results );
});



module.exports = router;
