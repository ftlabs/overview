const fetchContent = require("../lib/fetchContent");
const directly = require("../helpers/directly");
const time = require("../helpers/time");
const CAPI_CONCURRENCE = process.env.hasOwnProperty("CAPI_CONCURRENCE")
  ? process.env.CAPI_CONCURRENCE
  : 4;
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

function searchByParams(params) {
  return fetchContent.search(params);
}

function searchByParamsDeep(params, depth) {
  return fetchContent.searchDeeper(params, depth);
}

function searchBySequence(searches) {
  return fetchContent.searchSequence(searches);
}

function searchByTerm(searchTerm) {
  return fetchContent.search({ queryString: searchTerm });
}

function getByUuid(uuid) {
  return fetchContent.getArticle(uuid);
}

function getDaysOfRecentArticles(
  days = 1,
  aspects = defaultAspects,
  facets = defaultFacets
) {
  return fetchContent.getRecentArticles(days, aspects, facets);
}

function getArticleRelations(
  days = 1,
  facets = defaultFacets,
  aspects = defaultAspects
) {
  return fetchContent.getArticleRelations(days, facets, aspects);
}

function getArticlesAggregation(
  days = 1,
  facets = defaultFacets,
  aspects = defaultAspects,
  minCorrelation = 2,
  timeslip = 1
) {
  return fetchContent.getArticlesAggregation(
    days,
    facets,
    aspects,
    minCorrelation,
    timeslip
  );
}

module.exports = {
  searchByParams,
  searchByParamsDeep,
  searchByTerm,
  searchBySequence,
  getByUuid,
  getDaysOfRecentArticles,
  getArticleRelations,
  getArticlesAggregation
};
