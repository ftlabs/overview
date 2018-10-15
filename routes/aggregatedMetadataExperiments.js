const express = require("express");
const article = require("../modules/article");
const router = express.Router();

router.get("/", async (req, res, next) => {
  res.render("aggregatedMetadataExperiments/index");
});

router.get("/basic", async (req, res, next) => {
  const content = await structureData(req);
  res.render("aggregatedMetadataExperiments/index", {
    content
  });
});

router.get("/particle", async (req, res, next) => {
  const content = await structureData(req);
  res.render("aggregatedMetadataExperiments/particle", {
    content
  });
});

async function structureData(req) {
  const days = req.query.days ? req.query.days : 1;
  const facet = req.query.facet ? req.query.facet : "topics";
  let aspects = req.query.aspects ? req.query.aspects : undefined;

  if (aspects) {
    aspects = aspects.split(",");
  }

  let results = await article.getArticlesAggregation(days);
  results =
    results.aggregationsByGenre["genre:genre:News"].correlationAnalysis
      .primaryTheme;
  let content = [];
  Object.keys(results).forEach(facet => {
    results[facet].forEach(theme => {
      content = [
        ...content,
        { name: theme[0], size: `${theme[1] * 100}px`, score: theme[1] }
      ];
    });
  });
  return content;
}

module.exports = router;
