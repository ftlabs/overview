const express = require('express');
const router = express.Router();
const facet = require('../modules/facet');


// paths
router.get('/', async (req, res, next) => {
	res.render("heartbeat");
});

router.get('/one', async (req, res, next) => {
	try {
		const facets = await facet.searchForFacetHistory({
			facet  		: 'topics',
			period 		: 'days',
			interval 	: 1,
			numInterval : 10,
			maxFacets 	: 10
		});

		res.render("heartbeat/one", { data: JSON.stringify(facets) });		
		return;
	} catch (err) {
		console.log('err: ' + err);
	}
});

// endpoints



module.exports = router;
