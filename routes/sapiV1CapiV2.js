const express = require('express');
const router = express.Router();
const sapiV1CapiV2 = require('../lib/sapiV1CapiV2');
const debug = require('debug')('views:sapiV1CapiV2');
const image = require('../helpers/image');

// set up in index.js, so not needed here
// const bodyParser = require('body-parser');
// // support parsing of application/json type post data
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(bodyParser.json());

router.get("/", (req, res, next) => {
  res.render("sapiV1CapiV2");
});

function constructSearchParamsFromRequest( urlParams={}, bodyParams={} ){
	const params = {};
	// string params
  // ['queryString', 'apiKey'].forEach( name => {
  ['queryString'].forEach( name => {
		if (urlParams.hasOwnProperty(name) && urlParams[name] !== "") {
			params[name] = urlParams[name];
		}
	});
	// int params
	['maxResults', 'offset', 'maxDepth'].forEach( name => {
		if (urlParams.hasOwnProperty(name) && urlParams[name] !== "") {
			params[name] = Number( urlParams[name] );
		}

    if (bodyParams.hasOwnProperty(name) && typeof bodyParams[name] !== 'number') {
      bodyParams[name] = Number(bodyParams[name]);
    }
	});
	// boolean params
	['includeCapi'].forEach( name => {
		if (urlParams.hasOwnProperty(name) && urlParams[name] !== "") {
			params[name] = Boolean( urlParams[name] );
		}
	});
  // string list params
  ['genres', 'groups'].forEach( name => {
    if (urlParams.hasOwnProperty(name) && urlParams[name] !== "") {
      params[name] = urlParams[name].split(',');
    }
    if (bodyParams.hasOwnProperty(name) && typeof bodyParams[name] == 'string') {
      bodyParams[name] = bodyParams[name].split(',');
    }
  });

  const combinedParams = Object.assign( {}, bodyParams, params ); // because body-parser creates req.body which does not have hasOwnProperty()... yes, really

  debug(`constructSearchParamsFromRequest: combinedParams=${JSON.stringify(combinedParams)},
  urlParams=${JSON.stringify(urlParams)},
  bodyParams=${JSON.stringify(bodyParams)}`);

	return combinedParams;
}

const pathsFns = [
  ['/search'                      , sapiV1CapiV2.search                  ],
  ['/search/deeper'               , sapiV1CapiV2.searchDeeper            ],
  ['/search/deeper/articles'      , sapiV1CapiV2.searchDeeperArticles    ],
  ['/search/deeper/articles/capi' , sapiV1CapiV2.searchDeeperArticlesCapi],
  ['/correlateDammit'             , sapiV1CapiV2.correlateDammit         ],
];

// unpack all the combinations of get/post for each of the main routes
['get', 'post'].forEach( method => {
  pathsFns.forEach( pathFnPair => {
    const path = pathFnPair[0];
    const fn   = pathFnPair[1];

    debug(`sapiV1CapiV2:routes: method=${method}, path=${path}, fn=${fn.name}`);

    router[method](path, async (req, res, next) => {
      try {
        const bodyParams = (req.body)? Object.assign({}, req.body) : {};
      	const combinedParams = constructSearchParamsFromRequest( req.query, bodyParams );
      	const searchResponse = await fn( combinedParams );
      	res.json( searchResponse );
      } catch( err ){
        res.json( {
          error: err.message,
          path
        });
      }
    });

  });
});

router.get('/getArticle/uuid', async (req, res, next) => {
	 try {
     const uuid = req.params.uuid;
	   const searchResponse = await sapiV1CapiV2.getArticle( uuid );
	   res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/getArticle', async (req, res, next) => {
	 try {
     const uuid = req.query.uuid;
     if (! uuid) {
       throw new Error( '/getArticle: must specify a uuid, as either a query param (?uuid=...) or a path param (/getArticle/...)');
     }
	   const searchResponse = await sapiV1CapiV2.getArticle( uuid );
	   res.json( searchResponse );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/summariseFetchTimings', async (req, res, next) => {
	 try {
     const lastFew = (req.query.hasOwnProperty('lastFew'))? Number(req.query['lastfew']) : 0;
	   const summary = sapiV1CapiV2.summariseFetchTimings( lastFew );
	   res.json( summary );
   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/test', async (req, res, next) => {
	res.json({
		test: true,
	});
});

function prepAnnotationsGroup( groupName, annoPairs, groupDetails, searchResponse ){
  const group = {
    name : groupName,
    byCount : {
      topAnnotations : [],
      annotationsBubblingUnder : [],
    },
  };

  group.byCount.topAnnotations = annoPairs
  .filter( pair => { return pair[1] > 1; }) // just those with count > 1
  .map( pair => { // bring together details, incl list of articles
    const name      = pair[0];
    const count     = pair[1];
    const uuids     = groupDetails.uuidsGroupedByItem[name];
    const articles  = uuids.map( uuid => { return searchResponse.articlesByUuid[uuid]; });
    articles.forEach( article => {
      if (article.mainImage
        && article.mainImage.members
        && article.mainImage.members.length > 0 ) {
          article.mainImage.thumbnailUrl = image.formatImageUrl(article.mainImage.members[0], 200);
      }
    });

    return {
      name,
      count,
      uuids,
      articles,
    }
  })
  ;

  group.byCount.annotationsBubblingUnder = annoPairs
  .filter( pair => { return pair[1] == 1; })
  .map( pair => { return pair[0]; })
  ;

  return group;
}

function prepDisplayData( searchResponse ){
  const groupName = 'abouts';
  const groupDetails = searchResponse.correlations.groups[groupName];

  const data = {
    groups : [],
    searchResponse,
  };

  const mainGroup = prepAnnotationsGroup( groupName, groupDetails.sortedByCount, groupDetails, searchResponse );
  data.groups.push( mainGroup );

  const taxonomies = Object.keys( groupDetails.sortedByCountGroupedByTaxonomy );
  taxonomies.forEach( taxonomy => {
    const annoPairs = groupDetails.sortedByCountGroupedByTaxonomy[taxonomy];
    const taxonomyGroupName = `${groupName}: ${taxonomy}`;
    const taxonomyGroup = prepAnnotationsGroup( taxonomyGroupName, annoPairs, groupDetails, searchResponse );
    data.groups.push( taxonomyGroup );
  });

  return data;
}

router.get('/display', async (req, res, next) => {
	 try {
     const combinedParams = constructSearchParamsFromRequest( req.query );
     const searchResponse = await sapiV1CapiV2.correlateDammit( combinedParams );
     const data = prepDisplayData( searchResponse );
	   res.json( data );

   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/display/:template', async (req, res, next) => {
	 try {
     const template = req.params.template;
     const combinedParams = constructSearchParamsFromRequest( req.query );
     const searchResponse = await sapiV1CapiV2.correlateDammit( combinedParams );
     const data = prepDisplayData( searchResponse );
     res.render(`sapiV1CapiV2Experiments/${template}`, {
   		data,
   		params: {
   			// days,
   			// minCorrelation,
   			// timeslip,
   		},
   	});

   } catch( err ){
     res.json( { error: err.message, });
   }
});


module.exports = router;
