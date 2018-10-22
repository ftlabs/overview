const express = require('express');
const router = express.Router();
const sapiV1CapiV2 = require('../modules/sapiV1CapiV2');
const debug = require('debug')('views:sapiV1CapiV2');
const bodyParser = require('body-parser');
// support parsing of application/json type post data
router.use(bodyParser.json());


// paths
router.post('/search', async (req, res, next) => {
	const postParams = req.body;
	// debug(`route:sapiV1CapiV2: req.body: ${JSON.stringify(req.body, null, 2)}`)
	const apiKey = (req.query.apiKey) ? req.query.apiKey : undefined;
	if (apiKey !== undefined) {
		postParams['apiKey'] = apiKey;
	}
	const searchResponse = await sapiV1CapiV2.search( postParams );

	res.json( searchResponse );
});

router.post('/search/deeper', async (req, res, next) => {
	const postParams = req.body;
	const apiKey = (req.query.apiKey) ? req.query.apiKey : undefined;
	const maxDepth = (req.query.maxDepth)? Number(req.query.maxDepth) : 2;
	if (apiKey !== undefined) {
		postParams['apiKey'] = apiKey;
	}
	const searchResponse = await sapiV1CapiV2.searchDeeper( postParams, maxDepth );

	res.json( searchResponse );
});

router.get('/test', async (req, res, next) => {
	res.json({
		test: true,
	});
});

module.exports = router;
