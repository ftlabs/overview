const express = require('express');
const router = express.Router();
const sapiV1CapiV2 = require('../lib/sapiV1CapiV2');
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

  // the invocation of this endpoint as a POST/GET must include a CAPI key
  if (! params.hasOwnProperty('apiKey')) {
    throw new Error("ERROR: apiKey not specified as a query param");
  }

	return params;
}

// paths
router.post('/search', async (req, res, next) => {
  try {
  	const queryParams = constructSearchParamsFromRequest( req.query );
    const combinedParams = Object.assign( {}, req.body, queryParams ); // because body-parser creates req.body which does not have hasOwnProperty()... yes, really
  	const searchResponse = await sapiV1CapiV2.search( combinedParams );
  	res.json( searchResponse );
  } catch( err ){
    res.json( { error: err.message, });
  }
});

router.post('/search/deeper', async (req, res, next) => {
  try {
  	const queryParams = constructSearchParamsFromRequest( req.query );
    const combinedParams = Object.assign( {}, req.body, queryParams );
  	const searchResponse = await sapiV1CapiV2.searchDeeper( combinedParams );
  	res.json( searchResponse );
  } catch( err ){
    res.json( { error: err.message, });
  }
});

router.post('/search/deeper/articles', async (req, res, next) => {
  try {
  	const queryParams = constructSearchParamsFromRequest( req.query );
    const combinedParams = Object.assign( {}, req.body, queryParams );
  	const searchResponse = await sapiV1CapiV2.searchDeeperArticles( combinedParams );
  	res.json( searchResponse );
  } catch( err ){
    res.json( { error: err.message, });
  }
});

router.post('/search/deeper/articles/capi', async (req, res, next) => {
  try {
  	const queryParams = constructSearchParamsFromRequest( req.query );
    const combinedParams = Object.assign( {}, req.body, queryParams );
  	const searchResponse = await sapiV1CapiV2.searchDeeperArticlesCapi( combinedParams );
  	res.json( searchResponse );
  } catch( err ){
    res.json( { error: err.message, });
  }
});

router.get('/search', async (req, res, next) => {
	 try {
     const queryParams = constructSearchParamsFromRequest( req.query );
	    const searchResponse = await sapiV1CapiV2.search( queryParams );
	     res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/search/deeper', async (req, res, next) => {
	 try {
     const queryParams = constructSearchParamsFromRequest( req.query );
	   const searchResponse = await sapiV1CapiV2.searchDeeper( queryParams );
	   res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/search/deeper/articles', async (req, res, next) => {
	 try {
     const queryParams = constructSearchParamsFromRequest( req.query );
	   const searchResponse = await sapiV1CapiV2.searchDeeperArticles( queryParams );
	   res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/search/deeper/articles/capi', async (req, res, next) => {
	 try {
     const queryParams = constructSearchParamsFromRequest( req.query );
	   const searchResponse = await sapiV1CapiV2.searchDeeperArticlesCapi( queryParams );
	   res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/test', async (req, res, next) => {
	res.json({
		test: true,
	});
});

module.exports = router;
