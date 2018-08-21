const express = require('express');
const router = express.Router();
const facet = require('../modules/facet');


// Paths
router.get('/', async (req, res, next) => {
	res.render("facethistory");
});

router.get('/1', async (req, res, next) => {
	try {
		const facets = await facet.searchForFacetHistory({
			facet  		: 'topics',
			period 		: 'days',
			interval 	: 1,
			numInterval : 5,
			maxFacets 	: 10
		});

		res.render("facethistory/one", { facetsJson: JSON.stringify(facets) });		
		return;
	} catch (err) {
		console.log('err: ' + err);
	}
});


// Endpoints
router.get('/:facet/', async (req, res, next) => {
	try {
		const facets = await facet.searchForFacetHistory({
			facet  		: req.params.facet,
			period 		: req.query.period,
			interval 	: req.query.interval,
			numInterval : req.query.numInterval,
			maxFacets 	: req.query.maxFacets
		});

		res.setHeader("Content-Type", "application/json");
		res.json(facets);
		return;
	} catch (err) {
		console.log('err: ' + err);
	}
});



module.exports = router;
