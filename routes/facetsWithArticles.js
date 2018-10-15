const express = require('express');
const router = express.Router();
const article = require('../modules/article');
const arrs = require('../helpers/array');


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

router.get('/articlesAggregation/visual_1', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	const genreNews = results.aggregationsByGenre['genre:genre:News'];
	const topics = genreNews.correlationAnalysis.primaryTheme.topics;
	let data = topics.map(topic => { return { name: topic[0] }; } );

	data.forEach(topic => {
		const articlesIDs = genreNews.articlesByMetadataCsv[`primaryTheme:topics:${topic.name}`];

		topic['articles'] = articlesIDs.map(article => {
			return genreNews.articlesByUuid[article];
		});

		topic['articles'] = topic['articles'].splice(0,2);
	});

	data = data.splice(0,3);

	res.render("facetsWithArticles/articlesAggregation/visual_1", {
		data: data,
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

//what is sections:sections:New Issues

//where name is found and articles count over 3?
//pass parameter to up the relevance filter from 2 to 3?


router.get('/articlesAggregation/visual_3', async (req, res, next) => {
	const days = ( req.query.days ) ? req.query.days : 1;
	const results = await article.getArticlesAggregation( days );

	const genreNews = results.aggregationsByGenre['genre:genre:News'];
	const people = genreNews.correlationAnalysis.people.people;

	let data = people.map(person => { return { name: person[0] }; } );
	data.forEach(people => {
		/*
		 * Get articles
		 */
		const articlesIDs = genreNews.articlesByMetadataCsv[`people:people:${people.name}`];

		people['articles'] = articlesIDs.map(article => {
			return genreNews.articlesByUuid[article];
		});

		people['articles'] = people['articles'].splice(0,3);


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
		let topPerson, topSection, topTopic = "";

		people['facets'].forEach(facet => {
			let facetSplit = facet.name.split(':');
			if( facetSplit[0] === 'people' && facetSplit[1] === 'people' && topPerson === "" ){
				topPerson = facetSplit[2]; 
			}
			if( facetSplit[0] === 'sections' && facetSplit[1] === 'sections' && topSection === "" ){
				topSection = facetSplit[2]; 
			}
			if( facetSplit[0] === 'topics' && facetSplit[1] === 'topics' && topTopic === "" ){
				topTopic = facetSplit[2]; 
			}
		});

		people['selectedFacets'] = {
			person: topPerson,
			section: topSection,
			topic: topTopic
		}
	});

	res.render("facetsWithArticles/articlesAggregation/visual_3", {
		data: data
	} );
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
	const days = ( req.query.days ) ? req.query.days : 1;
	const facet = ( req.query.facet ) ? req.query.facet : 'topics';
	let aspects = ( req.query.aspects ) ? req.query.aspects : undefined;

	if(aspects){ aspects = aspects.split(',') }

	const results = await article.getArticlesAggregation( days );
	res.json( results );
});





module.exports = router;
