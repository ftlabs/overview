const express = require("express");
const article = require("../modules/article");
const router = express.Router();
const { lanternApiRequest } = require("../lib/lanternService");

router.get("/firstIteration", async (req, res, next) => {
  getData(results => {
    results.forEach(themeObject => {
      let themeSum = 0;
      themeObject.articles.forEach(article => {
        function compare(a,b) {
          if (a.position < b.position)
            return -1;
          if (a.position > b.position)
            return 1;
          return 0;
        };
        console.log(article.listData.sort(compare));
        // this now needs to be stored in themeObject.articles
        // if there is no list data, assign the info that article.listData.position = 19
        // listPos = themeObject.articles[0].position gets the top position it has ever been in 
        // lpScore = 100 - (100 * listPos/19)
        // viewCount = article.pageViews
        // vScore = 100 * viewCount/500,000
        // return totalArticleScore = vScore + lpScore
      // themeSum += totalArticleScore

      //then just needs an object { theme: blah, themeSum: 63 }
      });

    });

    res.json(results);
  });
});

router.get("/secondIteration", async (req, res, next) => {
  getData(results => res.json(results));
});

async function getData(cb) {
  let results = await article.getArticlesAggregationWithListHistory(
    1,
    undefined,
    undefined,
    undefined,
    50
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

  Promise.all(
    content.map(async themeObject => {
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
      return themeObject;
    })
  ).then(cb);
}

module.exports = router;
