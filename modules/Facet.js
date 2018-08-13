const fetchContent = require('../lib/fetchContent');
const directly = require('../helpers/directly');
const CAPI_CONCURRENCE = process.env.hasOwnProperty('CAPI_CONCURRENCE')
	? process.env.CAPI_CONCURRENCE
	: 4;

function searchBySequence(searches){
	return fetchContent.searchSequence(searches);
}


module.exports = {
	searchBySequence
};
