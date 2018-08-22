'use strict';

const fetchContent = require('../lib/fetchContent');
const directly = require('../helpers/directly');
const CAPI_CONCURRENCE = process.env.hasOwnProperty('CAPI_CONCURRENCE')
	? process.env.CAPI_CONCURRENCE
	: 4;

function searchBySequence(searches){
	return fetchContent.searchSequence(searches);
}

function searchForFacetHistory(params){
	return fetchContent.searchFacetHistory(params);
}

module.exports = {
	searchBySequence,
	searchForFacetHistory
};
