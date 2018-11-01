const express = require("express");
const article = require("../modules/article");
const router = express.Router();

router.get("/", async (req, res, next) => {
  res.render("aggregatedMetadataExperiments/index");
});

router.get("/simple", async (req, res, next) => {
  const content = await structureData(req);
  res.render("aggregatedMetadataExperiments/simple", {
    content
  });
});

router.get("/grid", async (req, res, next) => {
  const content = await structureData(req);
  res.render("aggregatedMetadataExperiments/grid", {
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
  const days = req.query.days ? Number(req.query.days) : 1;
  let aspects = req.query.aspects ? req.query.aspects.split(",") : undefined;
  let facets = req.query.facets ? req.query.facets.split(",") : undefined;
  const minCorrelation = req.query.minCorrelation
    ? Number(req.query.minCorrelation)
    : 2;
  const timeslip = req.query.timeslip ? Number(req.query.timeslip) : 2;
  const payloads = req.query.payloads ? req.query.payloads.split(",") : []; // default is all
  const genres = req.query.genres ? req.query.genres.split(",") : []; // default is all

  if (aspects) {
    aspects = aspects.split(",");
  }

  let results = await article.getArticlesAggregation(
    days,
    facets,
    aspects,
    minCorrelation,
    timeslip
  ); // days = 1, facets = defaultFacets, aspects = defaultAspects, minCorrelation=2, timeslip

  results = results.aggregationsByGenre["genre:genre:News"];

  //   maybe add people
  const correlationAnalysis = results.correlationAnalysis.primaryTheme;
  let content = [];
  Object.keys(correlationAnalysis).forEach(facet => {
    correlationAnalysis[facet].forEach(theme => {
      const articles = getArticleData(
        results.articlesByMetadataCsv[`primaryTheme:${facet}:${theme[0]}`],
        results
      );

      const metadata = metadataCount(articles);
      const metadataCloud = getMetadataCloud(metadata);
      content = [
        ...content,
        {
          name: theme[0],
          nameNoSpaces: theme[0].replace(" ", "-").replace("&", "and"),
          size: `${theme[1] * 100}px`,
          score: theme[1],
          articles,
          metadata,
          metadataCloud
        }
      ];
    });
  });

  return content;
}

function getArticleData(articleUUIDs, results) {
  return articleUUIDs.map(uuid => results.articlesByUuid[uuid]);
}

function metadataCount(articles) {
  const validTagSections = ["people", "organisations"];
  let count = [];
  articles.forEach(article => {
    validTagSections.forEach(tagSections => {
      const section = article.metadata[tagSections];
      if (section) {
        section.forEach(tag => {
          const newTag = tag.term.name;
          if (count.find(existingTag => existingTag.name === newTag)) {
            count = count.map(existingTag => {
              if (existingTag.name === newTag) {
                return { name: existingTag.name, count: existingTag.count + 1 };
              } else {
                return existingTag;
              }
            });
          } else {
            count = [...count, { name: newTag, count: 1, text: newTag }];
          }
        });
      }
    });
  });
  count = count.map(element => {
    element.count = String(element.count);
    return element;
  });
  return count;
}
function getMetadataCloud(metadata) {
  return metadata.reduce((accumulator, currentValue) => {
    let newValue = "";
    for (let i = 0; i < currentValue.count; i++) {
      newValue = newValue + ` ${currentValue.name}`;
    }
    return accumulator + ` ${newValue}`;
  }, "");
}
module.exports = router;
