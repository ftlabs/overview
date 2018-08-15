const fetchContent = require('../lib/fetchContent');
const directly = require('../helpers/directly');
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
	const params = {};
	params.queryString = searchTerm;
	return fetchContent.search(params);
}

function getByUuid(uuid) {
	return fetchContent.getArticle(uuid);
}

module.exports = {
	searchByParams,
	searchByParamsDeep,
	searchByTerm,
	searchBySequence,
	getByUuid
};
