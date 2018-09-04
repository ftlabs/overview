const express = require('express');
const router = express.Router();
const facet = require('../modules/facet');


// paths
router.get('/', async (req, res, next) => {
	res.render("heartbeat");
});

router.get('/:template/:facet/:days', async (req, res, next) => {
	try {
		const facets = await facet.searchForFacetHistory({
			facet  		: req.params.facet,
			period 		: 'days',
			interval 	: 1,
			numInterval : req.params.days,
			maxFacets 	: 10
		});

		res.render(`heartbeat/${req.params.template}`, {
			data: JSON.stringify(facets)
		});		
		return;
	} catch (err) {
		console.log('err: ' + err);
	}
});

// endpoints



module.exports = router;
