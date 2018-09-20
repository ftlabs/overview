const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const facet = require('../modules/facet');

// paths
router.get('/', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/testPoint', async(req, res, next) => {


	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const history = await facet.searchForFacetHistory(facetPrams);

	res.setHeader("Content-Type", "application/json");
	res.json(history);
	return;
});


module.exports = router;
