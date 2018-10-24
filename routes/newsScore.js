const express = require("express");
const article = require("../modules/article");
const router = express.Router();
const { lanternApiRequest } = require("../lib/lanternService");

router.get("/", async (req, res, next) => {
  let results = await article.getArticlesAggregationWithListHistory(
    1,
    undefined,
    undefined,
    undefined,
    30
  );

  const aggregationsByGenre = results.aggregationsByGenre["genre:genre:News"];

  const correlationAnalysis =
    aggregationsByGenre.correlationAnalysis.primaryTheme;

  let content = [];

  Object.keys(correlationAnalysis).forEach(facet => {
    correlationAnalysis[facet].forEach(theme => {
      const articles =
        aggregationsByGenre.articlesByMetadataCsv[
          `primaryTheme:${facet}:${theme[0]}`
        ];
      content = [
        ...content,
        {
          theme: theme[0],
          articles,
          score: theme[1]
        }
      ];
    });
  });

  content.forEach(themeObject => {
    themeObject.articles = themeObject.articles.map(uuid => {
      const listData = results.listHistoryProcessed.listHistory[0].filter(
        listHistory => listHistory.content_id === uuid
      );
      return { uuid, listData };
    });
  });

  content.forEach(async themeObject => {
    const uuidList = themeObject.articles.map(articleData => {
      return articleData.uuid;
    });

    const queryStringEarly = {
      uuids: uuidList,
      timespan: "4320h"
    };

    let articleRankings = await lanternApiRequest(
      "articles/ranking",
      queryStringEarly,
      "POST"
    );

    articleRankings = JSON.parse(articleRankings);

    themeObject.articles = themeObject.articles.map(article => {
      let newArticleObject = {};
      articleRankings["articles_ranking"].forEach(articleRanking => {
        if (articleRanking.article_uuid === article.uuid) {
          newArticleObject = {
            ...article,
            pageViews: articleRanking.page_view_count
          };
        }
      });
      return newArticleObject;
    });
    content = { ...content, themeObject };
  });
  res.json(content);
});

module.exports = router;
