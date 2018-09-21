const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const facet = require('../modules/facet');

// paths
router.get('/', async (req, res, next) => {
	res.render("ftabulous");
});

router.get('/table', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/table", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/vis_one', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/vis_one", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});


module.exports = router;