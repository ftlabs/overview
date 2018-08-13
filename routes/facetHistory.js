const express = require('express');
const router = express.Router();
const Facet = require('../modules/Facet');
const Time = require('../helpers/Time');


router.get('/', async (req, res, next) => {
	res.render("facethistory");
});

router.get('/1', async (req, res, next) => {
	res.render("facethistory/one");
});


/**
 * Returns numerical facet history for the selected time period.
 *
 * @string 	facet 			facet type to query [topic, organisation, people] matching id facet auto included e.g. people & peopleId 
 * @string 	period 			time period to query [minutes, hours, days]
 * @integer interval 		quantity of the time period to query [1, 10]
 * @integer numInterval 	number of intervals [1, 10]
 * @integer maxFacets 		number of facets to retrun results for [0, 100]
 *
 * @example url
 * http://localhost:8000/facetHistory/topics/day/1/5/10
 * Quering the topic history of the past 5 days, 1 day intervals and limit returned top facets to 10
 * 
 */
  
router.get('/:facet/:period/:interval/:numInterval/:maxFacets', async (req, res, next) => {

	const MAX_FACETS			= 100;
	const MAX_INTERVAL			= 10;
	const MAX_INTERVAL_NUM		= 10;

	try {
		const searchFacet		= req.params.facet;
		const searchPeriod		= req.params.period;
		const intervaledFacets 	= [];
		const recentTopFacets	= [];
		const facetHistory		= {};

		let numInterval			= (req.params.interval > MAX_INTERVAL ? MAX_INTERVAL : req.params.interval);
		let numIntervals		= (req.params.numInterval > MAX_INTERVAL_NUM ? MAX_INTERVAL_NUM : req.params.numInterval);
		let numFacetItems		= (req.params.maxFacets > MAX_FACETS ? MAX_FACETS : req.params.maxFacets);
		let fullDateTime		= Time.getDatetimeRange(searchPeriod, (numInterval * numIntervals), 0);
		let resultFacets		= {
			description : "Returns metrics for facet numbers over the time period specificed in the params of the query",
			requestParams : {
				facet : searchFacet,
				period : searchPeriod,
				interval : numInterval,
				numInterval : numIntervals,
				maxFacets : numFacetItems,
			},
			datetimeRange : {
				start : fullDateTime.first,
				end : fullDateTime.next,
			}
		};

		const searches = createDateTimeRangeQueryStrings(searchPeriod, numInterval, numIntervals, searchFacet);
		const queryResults = await Facet.searchBySequence(searches);


		// get facet elements for all returned days
		queryResults.forEach(result => {
			let facet = result.sapiObj.results[0].facets;

			facet.forEach( facetElement => {
				if(facetElement.name === searchFacet){
					intervaledFacets.push( facetElement.facetElements );
				}
			});
		});


		// get most recent segement of top facets
		if(numFacetItems >= intervaledFacets[0].length){
			numFacetItems = intervaledFacets[0].length;
		}

		for (var i = 0; i < numFacetItems; i++) {
			let facet = intervaledFacets[0][i];

			if(facet.hasOwnProperty('name')){
				recentTopFacets.push(facet.name);
			}
		}


		// find the numbers for each of today's top facet elements
		recentTopFacets.forEach( topFacet => {
			facetHistory[topFacet] = [];

			intervaledFacets.forEach( day => {
				const facetValue = day.filter(item => item.name == topFacet);

				if(facetValue[0] !== undefined && facetValue[0].hasOwnProperty('count')){
					facetHistory[topFacet].push(facetValue[0].count);
				} else {
					facetHistory[topFacet].push(0);
				}
			});
		});


		resultFacets[searchFacet] = facetHistory;
		res.json(resultFacets);

	} catch (err) {
		console.log('err: ' + err);
	}
});

function createDateTimeRangeQueryStrings(period, numInterval, numIntervals, searchFacet){
	let queries = [];
	for (let i = 0; i <= numIntervals; i++) {
		queries.push( createFacetQueryString(period, numInterval, searchFacet, i) );
	}
	return queries; 
}

function createFacetQueryString(period, invterval, facetName, offset){

	if( facetName === "topics" || facetName === "people" || facetName === "organisations" ){
		const datetimeRange = Time.getDatetimeRange(period, invterval, offset);

		return query = {
			"queryString": `lastPublishDateTime:>${datetimeRange.next} AND lastPublishDateTime:<${datetimeRange.first}`,
			"maxResults" : 1,
			"facets" : {
				"names" : [facetName, facetName + "Id"],
				"maxElements" : -1
			}
		};	
	}

	console.log("createFacetQueryString: Incorrect facetName passed");
	return "";
}


module.exports = router;
