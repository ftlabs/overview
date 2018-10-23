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

function search(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	return fetchContent.search(params);
}

function searchDeeper(params={}){
	params['includeCapi'] = true;
	if (! params.hasOwnProperty('capiUnaspects')) {
		params['capiUnaspects'] = ['bodyXML'];
	}
	const maxDepth = (params.hasOwnProperty('maxDepth')) ? params['maxDepth'] : 2;
	return fetchContent.searchDeeper(params,maxDepth);
}

module.exports = {
	search,
	searchDeeper
};
