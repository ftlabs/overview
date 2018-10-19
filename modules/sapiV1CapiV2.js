const fetchContent = require('../lib/fetchContent');
const directly = require('../helpers/directly');
const time = require('../helpers/time');
const CAPI_CONCURRENCE = process.env.hasOwnProperty('CAPI_CONCURRENCE') ? process.env.CAPI_CONCURRENCE : 4;
const defaultAspects = [
	"audioVisual",
	"editorial",
	"images",
	"lifecycle",
	"location",
	"master",
	"metadata",
	"nature",
	"provenance",
	"summary",
	"title"
];
const defaultFacets = [
	"organisations",
	"organisationsId",
	"people",
	"peopleId",
	"topics",
	"topicsId",
	"genre",
	"genreId"
];

function search(params){
	params['includeCapi'] = true;
	return fetchContent.search(params);
}

function searchDeeper(params, maxDepth=1){
	params['includeCapi'] = true;
	return fetchContent.searchDeeper(params,maxDepth);
}

module.exports = {
	search,
	searchDeeper
};
