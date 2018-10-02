const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const facet = require('../modules/facet');
const fs = require('fs');
const path = require('path');

const facetPrams = {
	facet  		: ['topics', 'organisations', 'people', 'genre'],
	period 		: 'days',
	interval 	: 1,
	numInterval : 10,
	maxFacets 	: 10
};

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
	const results = await facet.searchForFacetHistory(facetPrams);
	res.setHeader("Content-Type", "application/json");
	res.json(results);
});

router.get('/table', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/table", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/people_text', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/people_text", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/people_venn', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/people_venn", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/people_venn_moardata', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	const history = await facet.searchForFacetHistory(facetPrams);

	res.render("ftabulous/people_venn", {
		data: JSON.stringify(results),
		facetHistory: JSON.stringify(history)
	});
});

router.get('/people_venn_timeselect', async (req, res, next) => {
	const results = await article.getArticleRelations(1);

	res.render("ftabulous/people_venn_timeselect", {
		data: JSON.stringify(results)
	});
});

router.get('/people_venn_timetravel', async (req, res, next) => {
	const filePath = path.join(__dirname, '../data/simulationVenn.json');

	fs.readFile(filePath, {encoding: 'utf-8'}, function(err,data){
		if(!err){
			res.render("ftabulous/people_venn_timetravel", {
				
				data: JSON.stringify(JSON.parse(data))
			});
		} else {
			console.log(err);
		}
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
