const fetchContent = require('../lib/fetchContent');
const directly = require('../helpers/directly');
const time = require('../helpers/time');
const CAPI_CONCURRENCE = process.env.hasOwnProperty('CAPI_CONCURRENCE')
	? process.env.CAPI_CONCURRENCE
	: 4;

function searchByParams(params){
	return fetchContent.search(params);
}

function searchByParamsDeep(params, depth){
	return fetchContent.searchDeeper(params, depth);
}

function searchBySequence(searches){
	return fetchContent.searchSequence(searches);
}

function searchByTerm(searchTerm) {
	return fetchContent.search( { queryString: searchTerm } );
}

function getByUuid(uuid){
	return fetchContent.getArticle(uuid);
}

function getDaysOfRecentArticles(days = 1, aspects = [], facets = []){
	return fetchContent.getRecentArticles(days, aspects, facets);
}


module.exports = {
	searchByParams,
	searchByParamsDeep,
	searchByTerm,
	searchBySequence,
	getByUuid,
	getDaysOfRecentArticles
};
