const express = require('express');
const router = express.Router();
const sapiV1CapiV2 = require('../modules/sapiV1CapiV2');
const debug = require('debug')('views:sapiV1CapiV2');
const bodyParser = require('body-parser');
// support parsing of application/json type post data
router.use(bodyParser.json());

router.get("/", async (req, res, next) => {
  res.render("sapiV1CapiV2");
});

function constructSearchParamsFromRequest( reqParams ){
	const params = {};
	// string params
	['queryString', 'apiKey'].forEach( name => {
		if (reqParams.hasOwnProperty(name) && reqParams[name] !== "") {
			params[name] = reqParams[name];
		}
	});
	// int params
	['maxResults', 'offset', 'maxDepth'].forEach( name => {
		if (reqParams.hasOwnProperty(name) && reqParams[name] !== "") {
			params[name] = Number( reqParams[name] );
		}
	});
	// boolean params
	['includeCapi'].forEach( name => {
		if (reqParams.hasOwnProperty(name) && reqParams[name] !== "") {
			params[name] = Boolean( reqParams[name] );
		}
	});
	return params;
}

// paths
router.post('/search', async (req, res, next) => {
	const objectifiedBody = Object.assign({}, req.body); // because body-parser creates req.body which does not have hasOwnProperty()... yes, really
	const params = constructSearchParamsFromRequest( objectifiedBody );
	const searchResponse = await sapiV1CapiV2.search( params );
	res.json( searchResponse );
});

router.post('/search/deeper', async (req, res, next) => {
	const objectifiedBody = Object.assign({}, req.body);
	const params = constructSearchParamsFromRequest( objectifiedBody );
	const searchResponse = await sapiV1CapiV2.searchDeeper( params );
	res.json( searchResponse );
});

router.get('/search', async (req, res, next) => {
	const params = constructSearchParamsFromRequest( req.query );
	const searchResponse = await sapiV1CapiV2.search( params );
	res.json( searchResponse );
});

router.get('/search/deeper', async (req, res, next) => {
	const params = constructSearchParamsFromRequest( req.query );
	const searchResponse = await sapiV1CapiV2.searchDeeper( params );
	res.json( searchResponse );
});

router.get('/test', async (req, res, next) => {
	res.json({
		test: true,
	});
});

module.exports = router;
