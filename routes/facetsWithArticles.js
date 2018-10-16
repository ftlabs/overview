const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const arrs = require('../helpers/array');
const debug = require('debug')('views:facetsWithArticles');


/*
 * Paths
 */
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

router.get('/articlesAggregation/visual_1', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	res.render("facetsWithArticles/articlesAggregation/visual_1", {
		data: topTopicFilter(results),
		days: days
	} );
});

router.get('/articlesAggregation/visual_2', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	const genreNews = results.aggregationsByGenre['genre:genre:News'];
	const topics = genreNews.correlationAnalysis.primaryTheme.topics;
	const reversedTopics = topics.reverse();

	let data = reversedTopics.map((topic, index) => {
		return {
			name: topic[0],
			count: (index + 1),
		};
	});

	res.render("facetsWithArticles/articlesAggregation/visual_2", {
		data: data.reverse()
	} );
});

router.get('/articlesAggregation/visual_3', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );
	
	res.render("facetsWithArticles/articlesAggregation/visual_3", {
		data: topPeopleFilter(results, 3)
	} );
});

router.get('/articlesAggregation/visual_4', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	res.render("facetsWithArticles/articlesAggregation/visual_4", {
		data: topPeopleFilter(results, 3, 1),
		days: days
	} );
});

router.get('/articlesAggregation/visual_5', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	res.render("facetsWithArticles/articlesAggregation/visual_5", {
		data: topTopicFilter(results, 10, 10),
		days: days
	} );
});

router.get('/articlesAggregation/visual_6', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );
	const genreNews = results.aggregationsByGenre['genre:genre:News'];

	let flatArr = [];

	const topics = genreNews.correlationAnalysis.primaryTheme.topics;
	topics.forEach(topic => {
		flatArr.push({
			title: topic[0],
			count: topic[1],
			type: 'topic'
		});
	});

	const people = genreNews.correlationAnalysis.people.people;
	people.forEach(person => {
		flatArr.push({
			title: person[0],
			count: person[1],
			type: 'people'
		});
	});

	const organisations = genreNews.correlationAnalysis.organisations.organisations;
	organisations.forEach(orgs => {
		flatArr.push({
			title: orgs[0],
			count: orgs[1],
			type: 'organisation'
		});
	});

	flatArr = arrs.sortArray(flatArr, 'count');
	flatArr = flatArr.splice(0, 5);

	flatArr.forEach((item, i) => {
		item['link'] = urlSafeName(item['title']);
		item['position'] = i + 1;
	});

	res.render("facetsWithArticles/articlesAggregation/visual_6", {
		data: { items: flatArr },
		days: days
	} );
});

router.get('/articlesAggregation/visual_7', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );
	const genreNews = results.aggregationsByGenre['genre:genre:News'];

	const topics = genreNews.correlationAnalysis.primaryTheme.topics;
	let left = topics.map((topic, i) => {
		return {
			title: topic[0],
			count: topic[1],
			index: i + 1
		};
	});

	const people = genreNews.correlationAnalysis.people.people;
	let right = people.map((person, i) => {
		return {
			title: person[0],
			count: person[1],
			index: i + 1
		};
	});
	right = right.splice(0, left.length);

	res.render("facetsWithArticles/articlesAggregation/visual_7", {
		left: left,
		right: right,
		days: days
	} );
});


/*
 * Endpoints
 */
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

	// ensure we have placeholders for all the expected groupings
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
				const images = article.images;
				const imageUrl = (images.length > 0)? images[0].url : null;
				return {
					uuid,
					article,
					title : article.title.title,
					imageUrl
				};
			});

			articlesDetails.sort( (a,b) => {
				const aPub = a.article.lifecycle.initialPublishDateTime;
				const bPub = b.article.lifecycle.initialPublishDateTime;
				if (aPub < bPub) { return 1; }
				else if (aPub > bPub) { return -1; }
				else { return 0; }
			});

			nameAndCount.push(articlesDetails);
		})

		const bubblingsNbsp = correlationAnalysisBubblingUnder[metadataKey][taxonomy].map( name => {
			return name.replace(/\s+/, '&nbsp;');
		});

		groupings.push( {
			metadataKey,
			taxonomy,
			'topNames' : correlationAnalysis[metadataKey][taxonomy],
			'namesBubblingUnder' : bubblingsNbsp,
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


/*
 * Shared functions
 */
function urlSafeName(s){
	return s.toLowerCase().replace("& ", "").replace(" ", "-");
}

function topTopicFilter(results, topicLimit = 3, articleLimit = 2){
	const genreNews = results.aggregationsByGenre['genre:genre:News'];
	const topics = genreNews.correlationAnalysis.primaryTheme.topics;
	let data = topics.map(topic => { return { name: topic[0] }; } );

	data.forEach(topic => {
		const articlesIDs = genreNews.articlesByMetadataCsv[`primaryTheme:topics:${topic.name}`];

		topic['articles'] = articlesIDs.map(article => {
			return genreNews.articlesByUuid[article];
		});

		topic['articles'] = topic['articles'].splice(0, articleLimit);

		topic['safename'] = urlSafeName(topic.name);
	});

	return data.splice(0, topicLimit);
}

function topPeopleFilter(results, peopleLimit = 3, articleLimit = 2){
	const genreNews = results.aggregationsByGenre['genre:genre:News'];

	let people = genreNews.correlationAnalysis.people.people;
	let data = people.map(person => { return { name: person[0] }; } );

	data.forEach(people => {
		/*
		 * Get articles
		 */
		const articlesIDs = genreNews.articlesByMetadataCsv[`people:people:${people.name}`];

		people['articles'] = articlesIDs.map(article => {
			return genreNews.articlesByUuid[article];
		});

		people['articles'] = people['articles'].splice(0, articleLimit);


		/*
		 * Get and rank related facets
		 */
		const facetCorrelationsCsv = genreNews.facetCorrelationsCsv;
		const entries = Object.entries(facetCorrelationsCsv);
		let peopleFacets = [];

		entries.forEach(facet => {
			Object.entries(facet[1]).forEach(f => {
				const facetSplit = f[0].split(':');
				const name = facetSplit[facetSplit.length -1];
				if( name === people.name && ( facet[0].indexOf(people.name) <= 0 ) ){
					peopleFacets.push({
						name: facet[0],
						count: f[1],
					});
				}
			});
		});

		people['facets'] = arrs.sortArray(peopleFacets, 'count');

		/*
		 * Custom selection of top ranked facets
		 */
		let topPerson = "";
		let topSection = "";
		let topTopic = "";

		people['facets'].forEach(facet => {
			let facetSplit = facet.name.split(':');
			if( facetSplit[1] === 'people' && topPerson === "" ){
				topPerson = facetSplit[2]; 
			}
			if( facetSplit[1] === 'sections' && topSection === "" ){
				topSection = facetSplit[2]; 
			}
			if( facetSplit[1] === 'topics' && topTopic === "" ){
				topTopic = facetSplit[2]; 
			}
		});

		people['selectedFacets'] = {
			person: topPerson,
			section: topSection,
			topic: topTopic
		}

		/*
		* Set spot data
		*/
		const matches = people['name'].match(/\b(\w)/g);
		people['spotData'] = matches.join('');

		/*
		* Set image - from first article
		*/
		people['image'] = '';
		people['articles'].forEach(article => {
			if(article.images[0] !== undefined && people['image'] === ""){
				people['image'] = article.images[0].url;
			}
		});

	});

	return data.splice(0, peopleLimit);
}


module.exports = router;
