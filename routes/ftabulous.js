const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const facet = require('../modules/facet');

// paths
router.get('/', async (req, res, next) => {
	res.render("ftabulous");
});

router.get('/getArticleRelations', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	res.setHeader("Content-Type", "application/json");
	res.json(results);
});

router.get('/searchForFacetHistory', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};
	const results = await facet.searchForFacetHistory(facetPrams);
	res.setHeader("Content-Type", "application/json");
	res.json(results);
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

router.get('/venn_people', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'organisations', 'people', 'genre'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/venn_people", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/tree', async (req, res, next) => {
	const facetPrams = {
		facet  		: ['topics', 'people'],
		period 		: 'days',
		interval 	: 1,
		numInterval : 10,
		maxFacets 	: 10
	};

	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);
	let first = {};

	results.breakdown.forEach(rb => {
		if(rb.facet === "topics"){
			first = {
				header: rb.facetName,
				data: rb
			};
			return;
		}
	});

	res.render("ftabulous/tree", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history),
		first: [first]
	});
});


module.exports = router;
