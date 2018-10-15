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

router.get("/hexagon", async (req, res, next) => {
  const content = await structureData(req);
  res.render("aggregatedMetadataExperiments/hexagon", {
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

      content = [
        ...content,
        {
          name: theme[0],
          size: `${theme[1] * 100}px`,
          score: theme[1],
          articles,
          metadata
        }
      ];
    });
  });

  console.log(JSON.stringify(content));
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
            count = [...count, { name: newTag, count: 1 }];
          }
        });
      }
    });
  });
  return count;
}

module.exports = router;
