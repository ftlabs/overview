const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const debug = require('debug')('views:facetsWithArticles');


// paths
router.get('/', async (req, res, next) => {
	res.render("facetsWithArticles");
});

router.get('/test', async (req, res, next) => {
	const results = await article.getArticleRelations( 1 );
	res.render("facetsWithArticles/test", { facetsJson: JSON.stringify(results) } );
});

router.get('/clusteredImages/:template/:facet', async (req, res, next) => {
	const results = await article.getArticleRelations(1);
	if(req.params.template.startsWith('five') || req.params.template === 'six'){
		data = results.breakdown.splice(0, 3);
	} else {
		data = results.breakdown.splice(0, 1);
	}
	res.render(`facetsWithArticles/clusteredImages/${req.params.template}`, {data: data});
});

router.get('/charts/:template/:facet/:days', async (req, res, next) => {
	const results = await article.getArticleRelations(req.params.days);
	const data = [];
	let maxitems = 10;

	for(let i = 0; i < results.breakdown.length; i++){
		if(results.breakdown[i].facet == req.params.facet){
			data.push(results.breakdown[i]);
		}
		if(data.length >= maxitems){
			break;
		}
	}

	res.render(`facetsWithArticles/charts/${req.params.template}`, {
		data: JSON.stringify(data),
		facet: req.params.facet
	});
});


// endpoints
router.get('/relatedContent', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const facet = ( req.query.facet ) ? req.query.facet : 'topics';
	let aspects = ( req.query.aspects ) ? req.query.aspects : undefined;

	if(aspects){ aspects = aspects.split(',') }

	const results = await article.getArticleRelations( days );

	res.setHeader("Content-Type", "application/json");
	res.json( results );
});

router.get('/articlesAggregation', async (req, res, next) => {
	const days           = ( req.query.days            ) ? Number(req.query.days)           : 1;
	let   aspects        = ( req.query.aspects         ) ? req.query.aspects.split(',')     : undefined;
	let   facets         = ( req.query.facets          ) ? req.query.facets.split(',')      : undefined;
	const minCorrelation = ( req.query.minCorrelation  ) ? Number(req.query.minCorrelation) : 2;
	const timeslip       = ( req.query.timeslip        ) ? Number(req.query.timeslip)       : 2;
	const payloads       = ( req.query.payloads        ) ? req.query.payloads.split(',')    : []; // default is all
	const genres         = ( req.query.genres          ) ? req.query.genres.split(',')      : []; // default is all

	const results = await article.getArticlesAggregation( days, facets, aspects, minCorrelation, timeslip ); // days = 1, facets = defaultFacets, aspects = defaultAspects, minCorrelation=2, timeslip

	if (genres.length > 0) {
		const aggregationsByGenre = {};
		genres.forEach( genre => {
			const genreCsv = `genre:genre:${genre}`;
			aggregationsByGenre[genreCsv] = results.aggregationsByGenre[genreCsv];
		});
		results.aggregationsByGenre = aggregationsByGenre;
	}

	if (payloads.length > 0) {
		Object.keys(results.aggregationsByGenre).forEach( genreCsv => {
			const genreData = {};
			payloads.forEach( payload => {
				genreData[payload] = results.aggregationsByGenre[genreCsv][payload];
			});
			results.aggregationsByGenre[genreCsv] = genreData;
		});
	}

	res.json( results );
});

router.get('/aggregations/:template', async (req, res, next) => {
	const template = req.params.template;

	const days           = ( req.query.days            ) ? Number(req.query.days)           : 1;
	const minCorrelation = ( req.query.minCorrelation  ) ? Number(req.query.minCorrelation) : 2;
	const timeslip       = ( req.query.timeslip        ) ? Number(req.query.timeslip)       : 0;
	let   aspects        = undefined;
	let   facets         = undefined;

	const results = await article.getArticlesAggregation( days, facets, aspects, minCorrelation, timeslip ); // days = 1, facets = defaultFacets, aspects = defaultAspects, minCorrelation=2, timeslip
	const genreNewsStuff = results.aggregationsByGenre['genre:genre:News'];
	const correlationAnalysis = genreNewsStuff.correlationAnalysis;
	const correlationAnalysisBubblingUnder = genreNewsStuff.correlationAnalysisBubblingUnder;

	const metadataKeyPairsForCorrelationAnalysis = [ // lifted from fetchContent:aggregateArticles
		['primaryTheme', 'topics'],
		['primaryTheme', 'regions'],
		['people', 'people'],
		['regions', 'regions'],
		['organisations', 'organisations'],
	];

	const groupings = [];

	// ensure we have placeholders for al the expected groupings
	// and flesh out any items that have been found (by adding an item to the pair)
	metadataKeyPairsForCorrelationAnalysis.forEach( metadataKeyAndTaxonomy => {
		const metadataKey = metadataKeyAndTaxonomy[0];
		const taxonomy    = metadataKeyAndTaxonomy[1];

		if (! correlationAnalysis.hasOwnProperty(metadataKey)) {
			correlationAnalysis[meatadataKey]={};
		}

		if (! correlationAnalysis.primaryTheme.hasOwnProperty(taxonomy)) {
			correlationAnalysis.primaryTheme[taxonomy]={};
		}

		// loop over each name/count pair, flesh out articles details
		correlationAnalysis[metadataKey][taxonomy].forEach(nameAndCount => {
			const name = nameAndCount[0];
			const csv = [metadataKey,taxonomy,name].join(':');
			// debug(`facetsWithArticles: /aggregations/:template csv=${csv}`);
			const articlesDetails = genreNewsStuff.articlesByMetadataCsv[csv].map(uuid => {
				const article = genreNewsStuff.articlesByUuid[uuid];
				return {
					uuid,
					article,
					title : article.title.title,
				};
			});

			nameAndCount.push(articlesDetails);
		})

		groupings.push( {
			metadataKey,
			taxonomy,
			'topNames' : correlationAnalysis[metadataKey][taxonomy],
			'namesBubblingUnder' : correlationAnalysisBubblingUnder[metadataKey][taxonomy],
		} );
	})

	res.render(`facetsWithArticles/aggregations/${template}`, {
		data: correlationAnalysis,
		groupings,
		params: {
			days,
			minCorrelation,
			timeslip,
		}
	});
});



module.exports = router;
