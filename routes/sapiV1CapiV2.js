const express = require('express');
const router = express.Router();
const path = require('path');
const sapiV1CapiV2 = require('../lib/sapiV1CapiV2');
const debug = require('debug')('views:sapiV1CapiV2');
const image = require('../helpers/image');


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
	// numeric params
	['maxResults', 'offset', 'maxDepth', 'maxDurationMs', 'concertinaOverlapThreshold',
  'min2ndCliqueCount', 'min2ndCliqueProportion', 'max2ndCliqueProportion'].forEach( name => {
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
  ['/correlateDammit'             , sapiV1CapiV2.correlateDammit         ]
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

const plusBR = ' +<br>';

function aggregateAboutsAnnosByTaxonomyFromUuids(uuids, articlesByUuid){
  const annosByTaxonomy = {};

  uuids.forEach(uuid => {
    const article = articlesByUuid[uuid];
    if (article
    && article['mergedAnnotations']
    && article['mergedAnnotations']['abouts']) {
      article['mergedAnnotations']['abouts'].forEach(anno => {
        const annoParts = anno.split(':');
        const taxonomy = annoParts[0];
        const annoName = annoParts[1];
        if (!annosByTaxonomy.hasOwnProperty(taxonomy)) {
          annosByTaxonomy[taxonomy] = {};
        }
        if (!annosByTaxonomy[taxonomy].hasOwnProperty(annoName)) {
          annosByTaxonomy[taxonomy][annoName] = 0;
        }
        annosByTaxonomy[taxonomy][annoName] += 1;
      });
    }
  });

  const annosByTaxonomyWithCounts = {
    'PERSON' : [],
    'ORGANISATION': [],
    'LOCATION': [],
    'TOPIC' : []
  };
  Object.keys(annosByTaxonomy).forEach(taxonomy => {
    const annoNames = Object.keys(annosByTaxonomy[taxonomy]);
    annosByTaxonomyWithCounts[taxonomy] = annoNames.map(name => {
      return { name, count: annosByTaxonomy[taxonomy][name] };
    })
    .sort( (a,b) => { if (a.count<b.count){return 1;} else if(a.count>b.count){ return -1;} else {return 0;} });
  });

  return annosByTaxonomyWithCounts;
}

function prepAnnotationsGroup( groupName, annosDetails, groupDetails, searchResponse, params={} ){

  const defaultParams = {
    min2ndCliqueCount      : 5,
    min2ndCliqueProportion : 0.33,
    max2ndCliqueProportion : 0.67
  };

  const combinedParams = Object.assign({}, defaultParams, params);

  const group = {
    name : groupName,
    byCount : {
      topAnnotations : [],
      annotationsBubblingUnder : []
    },
  };

  group.byCount.topAnnotations = annosDetails
  .filter( anno => { return anno.count > 1; }) // just those with count > 1
  .map( anno => { // bring together details, incl list of articles
    const name      = anno.name;
    const count     = anno.count;
    const constituentNames = (anno.hasOwnProperty('constituentNames'))? anno.constituentNames : [name];
    const uuids     = groupDetails.uuidsGroupedByItem[name];
    const articles  = uuids.map( uuid => { return searchResponse.articlesByUuid[uuid]; });
    articles.forEach( article => {
      if (article.mainImage
        && article.mainImage.members
        && article.mainImage.members.length > 0 ) {
          article.mainImage.thumbnailUrl = image.formatImageUrl(article.mainImage.members[0], 200);
      }
    });

    const namesWithCounts = constituentNames
    .map( name => { return {
      nameWithTaxonomy: name,
      name: name.split(':')[1],
      count: groupDetails.uuidsGroupedByItem[name].length
    }; })
    .sort( (a,b) => {  if(a.count>b.count){ return -1; } else if(a.count<b.count){ return 1; } else { return 0; } });

    const nameWithCountsBR = namesWithCounts
    .map( nws => { return `${nws.name} (${nws.count})`; })
    .join(plusBR);

    // scan down sorted list of namesWithCounts
    // if 2nd item's count is > 5 (param) and >= 1/3 (param) of 1st and <= 2/3 of 1st (param)
    // - split UUIDs into 2 groups
    // - then distribute remaining names into either of the 2 groups
    // - until we find one that has UUIDs in both groups (in which case, abort this split)
    //   or we find that we have created two cliques

    const min2ndCliqueCount      = combinedParams.min2ndCliqueCount;
    const min2ndCliqueProportion = combinedParams.min2ndCliqueProportion;
    const max2ndCliqueProportion = combinedParams.max2ndCliqueProportion;

    const cliques = [];
    if (namesWithCounts.length > 1
     && namesWithCounts[1].count > min2ndCliqueCount
     && (namesWithCounts[1].count / namesWithCounts[0].count) >= min2ndCliqueProportion
     && (namesWithCounts[1].count / namesWithCounts[0].count) <= max2ndCliqueProportion
    ){
      const clique0Name = namesWithCounts[0].nameWithTaxonomy;
      const clique1Name = namesWithCounts[1].nameWithTaxonomy;
      const clique1Names = [clique0Name, clique1Name];
      const clique1KnownUuids = {};

      groupDetails.uuidsGroupedByItem[clique1Name]
      .forEach( uuid => { clique1KnownUuids[uuid] = true; });

      const clique0Names = [clique0Name];
      const clique0KnownUuids = {};

      groupDetails.uuidsGroupedByItem[clique0Name]
      .filter( uuid => { return !clique1KnownUuids.hasOwnProperty(uuid); })
      .forEach( uuid => { clique0KnownUuids[uuid] = true; });

      // loop over remaining names
      // looking for (and bailing if found) any name whose uuids are in both clique0 and clique1

      let foundAStraddler = false;
      for (let i = 2; i < namesWithCounts.length; i++) {
        const name = namesWithCounts[i].nameWithTaxonomy;
        const uuidsOfName = groupDetails.uuidsGroupedByItem[name];

        const uuidsInClique0 = uuidsOfName
        .filter(uuid => { return clique0KnownUuids.hasOwnProperty(uuid); });

        const uuidsInClique1 = uuidsOfName
        .filter(uuid => { return clique1KnownUuids.hasOwnProperty(uuid); });

        if (uuidsInClique0.length > 0 && uuidsInClique1.length > 0) {
          foundAStraddler = true;
          break;
        } else if (uuidsInClique0.length > 0) {
          uuidsOfName.forEach(uuid => { clique0KnownUuids[uuid] = true; });
          clique0Names.push(name);
        } else if (uuidsInClique1.length > 0) {
          uuidsOfName.forEach(uuid => { clique1KnownUuids[uuid] = true; });
          clique1Names.push(name);
        } else {
          throw new Error( `prepAnnotationsGroup: should never experience this situation where the name (${name}) has no uuids in both clique0 (${clique0Name}) and clique1 (${clique1Name})`);
        }
      }

      if (! foundAStraddler) {
        debug( `prepAnnotationsGroup: found a clique: clique0Name=${clique0Name}, clique1Name=${clique1Name}` );
        const clique0NamesWithoutTaxonomy = clique0Names.map( name => { return name.split(':')[1]; });
        const clique0Uuids = Object.keys(clique0KnownUuids);
        const clique0NamesWithCountsBR = clique0Names
        .map( name => {
          const groupCount = groupDetails.uuidsGroupedByItem[name].length;
          const cliqueCount = (name === clique0Name)? `${clique0Uuids.length} / ${groupCount}` : `${groupCount}`;
          return {
            name : name.split(':')[1],
            groupCount,
            cliqueCount
          }; })
        .map( details => { return `${details.name} (${details.cliqueCount})`; });

        const clique0 = {
          nameWithTaxonomy: clique0Name,
          name : clique0Name.split(':')[1],
          namesWithTaxonomy: clique0Names,
          names : clique0NamesWithoutTaxonomy,
          namesBR : clique0NamesWithoutTaxonomy.join( plusBR),
          namesWithCountsBR : clique0NamesWithCountsBR.join(plusBR),
          uuids : clique0Uuids,
          annosByTaxonomy: aggregateAboutsAnnosByTaxonomyFromUuids(clique0Uuids, searchResponse.articlesByUuid),
          articles: clique0Uuids.map( uuid => { return searchResponse.articlesByUuid[uuid]; })
        };
        const clique1NamesWithoutTaxonomy = clique1Names.map( name => { return name.split(':')[1]; });
        const clique1Uuids = Object.keys(clique1KnownUuids);
        const mainNameUuidsInClique1 = groupDetails.uuidsGroupedByItem[clique0Name]
        .filter( uuid => { return clique1KnownUuids.hasOwnProperty(uuid)});

        const clique1NamesWithCountsBR = clique1Names
        .map( name => {
          const groupCount = groupDetails.uuidsGroupedByItem[name].length;
          const cliqueCount = (name === clique0Name)? `${mainNameUuidsInClique1.length} / ${groupCount}` : `${groupCount}`;
          return {
            name: name.split(':')[1],
            groupCount,
            cliqueCount
          }; })
        .map( details => { return `${details.name} (${details.cliqueCount})`; });

        const clique1 = {
          nameWithTaxonomy: clique1Name,
          name: `${clique0Name.split(':')[1]} / ${clique1Name.split(':')[1]}`,
          namesWithTaxonomy: clique1Names,
          names : clique1NamesWithoutTaxonomy,
          namesBR: clique1NamesWithoutTaxonomy.join(plusBR),
          namesWithCountsBR : clique1NamesWithCountsBR.join(plusBR),
          uuids : clique1Uuids,
          annosByTaxonomy: aggregateAboutsAnnosByTaxonomyFromUuids(clique1Uuids, searchResponse.articlesByUuid),
          articles: clique1Uuids.map( uuid => { return searchResponse.articlesByUuid[uuid]; })
        }
        cliques.push(clique0);
        cliques.push(clique1);
      }
    }

    return {
      name,
      nameBR : name.split(' + ').join(plusBR),
      nameWithCountsBR,
      count,
      uuids,
      articles,
      namesWithCounts,
      cliques,
      annosByTaxonomy: aggregateAboutsAnnosByTaxonomyFromUuids(uuids, searchResponse.articlesByUuid)
    }
  });

  group.byCount.annotationsBubblingUnder = annosDetails
  .filter( anno => { return anno.count === 1; })
  .map( anno => { return anno.name.split(' + ').map( name => { return name.split(':')[1]; }).join(' + '); })
  .sort()
  .reverse();

  return group;
}

function prepDisplayData( searchResponse, params={} ){
  const data = {
    groups : [],
    searchResponse,
  };

  if (!searchResponse.hasOwnProperty('correlations')) {
    throw new Error(`prepDisplayData: was expecting searchResponse.correlations
      keys=${JSON.stringify(Object.keys(searchResponse))}`);
  }
  if (!searchResponse.correlations.hasOwnProperty('groups')) {
    throw new Error(`prepDisplayData: was expecting searchResponse.correlations.groups`);
  }

  const defaultGroupNames = ['primaryThemes', 'abouts'];
  let groupNames = defaultGroupNames;
  if (params.hasOwnProperty('groups') ) {
    groupNames = params['groups'];
  }

  groupNames.forEach( groupName => {
    const groupDetails = searchResponse.correlations.groups[groupName];

    ['main', 'concertinaed'].forEach( groupingType => {
      let groupWithTypeName    = groupName;
      let groupWithTypeDetails = groupDetails;

      if (groupingType === 'concertinaed') {
        if (groupWithTypeName === 'primaryThemes') {
          return; // no point in displaying concertina for primaryThemes since they are always unique per article
        }
        groupWithTypeName = `(concertinaed) ` + groupWithTypeName;
        groupWithTypeDetails = groupDetails.concertinaedSortedLists;
      }

      const mainGroup = prepAnnotationsGroup( groupWithTypeName, groupWithTypeDetails.sortedByCount, groupDetails, searchResponse, params );
      data.groups.push( mainGroup );

      const taxonomies = Object.keys( groupWithTypeDetails.sortedByCountGroupedByTaxonomy );
      taxonomies.forEach( taxonomy => {
        const annosDetails = groupWithTypeDetails.sortedByCountGroupedByTaxonomy[taxonomy];
        const taxonomyGroupName = `${groupWithTypeName}-${taxonomy}`;
        const taxonomyGroup = prepAnnotationsGroup( taxonomyGroupName, annosDetails, groupDetails, searchResponse, params );
        data.groups.push( taxonomyGroup );
      });

    })

  });

  return data;
}

router.get('/display', async (req, res, next) => {
	 try {
     const combinedParams = constructSearchParamsFromRequest( req.query );
     const searchResponse = await sapiV1CapiV2.correlateDammit( combinedParams );
     const data = prepDisplayData( searchResponse, combinedParams );
	   res.json( data );

   } catch( err ){
     res.json( { error: err.message, });
   }
});

router.get('/display/:template', async (req, res, next) => {
	 try {
     const template = req.params.template;
     const defaultParams = {
       maxResults  : 100,
       maxDepth    : 3,
       maxDurationMs : 5000,
       queryString : 'lastPublishDateTime:>2018-11-07T00:00:00Z and lastPublishDateTime:<2018-11-08T00:00:00Z',
       genres      : "News,Opinion",
       concertinaOverlapThreshold : 0.66,
       groups      : 'primaryThemes,abouts' // also mentions,aboutsAndMentions
     }
     const copyQueryParams = Object.assign(req.query);
     Object.keys(defaultParams).forEach( param => {
       if (copyQueryParams.hasOwnProperty(param)
        && copyQueryParams[param] === "") {
         delete copyQueryParams[param];
       }
     });

     const combinedParams = constructSearchParamsFromRequest( copyQueryParams, defaultParams );
     const searchResponse = await sapiV1CapiV2.correlateDammit( combinedParams );
     const data = prepDisplayData( searchResponse, combinedParams );
     res.render(path.resolve(__dirname + `/sapiV1CapiV2Experiments/${template}`), {
   		data,
   		params: combinedParams,
      context : {
        numArticles        : searchResponse.numArticles,
        numArticlesInGenres: searchResponse.correlations.numArticlesInGenres,
        genresString       : searchResponse.correlations.genres.join(',')
      }
   	});

   } catch( err ){
    console.log('ERROR:', err);
     res.json( { error: err.message, });
   }
});


module.exports = router;
