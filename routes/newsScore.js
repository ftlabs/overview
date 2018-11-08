const express = require("express");
const article = require("../modules/article");
const router = express.Router();
const { lanternApiRequest } = require("../lib/lanternService");

router.get("/data", async (req, res, next) => {
  const daysAgo = req.query.daysAgo;
  getData(results => {
    res.json(results);
  }, daysAgo);
});

router.get("/firstIteration", async (req, res, next) => {
  // let daysAgo = req.query.daysAgo;
  console.log('day 2')
  const resultsday2 = await getData(34);
  const scoredResultsday2 = calculateScore(resultsday2);
  function compare(a, b) {
    if (a.newsScore > b.newsScore) return -1;
    if (a.newsScore < b.newsScore) return 1;
    return 0;
  }
  let orderedResultsday2 = scoredResultsday2.sort(compare)
  orderedResultsday2.forEach(result => {
    result.newsScore = Number.parseFloat(result.newsScore).toFixed(2)
  });

  // let daysAgo = req.query.daysAgo;
  console.log('day 1')

  const resultsday1 = await getData(35);
  const scoredResultsday1 = calculateScore(resultsday1);
  let orderedResultsday1 = scoredResultsday1.sort(compare)
  orderedResultsday1.forEach(result => {
    result.newsScore = Number.parseFloat(result.newsScore).toFixed(2)
  });


  res.render("newsScore/firstIteration", {
    results2: orderedResultsday2,
    results1: orderedResultsday1
  });
});

router.get("/secondIteration", async (req, res, next) => {
  const daysAgo = req.query.daysAgo;
  const results = await getData(daysAgo);
  res.render("newsScore/secondIteration", {
    results: calculateScore(results),
    iteration: "secondIteration"
  });
});

async function getData(daysAgo = 34) {
  let results = await article.getArticlesAggregationWithListHistory(
    1,
    undefined,
    undefined,
    undefined,
    daysAgo
  );

  const aggregationsByGenre = results.aggregationsByGenre["genre:genre:News"];

  const primaryTheme = aggregationsByGenre.correlationAnalysis.primaryTheme;

  const people = aggregationsByGenre.correlationAnalysis.people;

  const regions = aggregationsByGenre.correlationAnalysis.regions;

  const organisations = aggregationsByGenre.correlationAnalysis.organisations;

  const themes = { primaryTheme, people, regions, organisations };

  let content = [];
  Object.keys(themes).forEach(topTheme => {
    Object.keys(themes[topTheme]).forEach(facet => {
      themes[topTheme][facet].forEach(theme => {
        const articles =
          aggregationsByGenre.articlesByMetadataCsv[
            `${topTheme}:${facet}:${theme[0]}`
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
  });

  content.forEach(themeObject => {
    themeObject.articles = themeObject.articles.map(uuid => {
      const listData = results.listHistoryProcessed.listHistory[0].filter(
        listHistory => listHistory.content_id === uuid
      );
      return { uuid, listData };
    });
  });

  const result = await Promise.all(
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
  );
  return result;
}

function calculateScore(results) {
  return results
    .map(themeObject => {
      let themeSum = 0;
      if (!themeObject.articles) {
        themeObject.articles = [];
      }
      themeObject.articles.forEach(article => {
        function compare(a, b) {
          if (a.position < b.position) return -1;
          if (a.position > b.position) return 1;
          return 0;
        }
        // assigns positions to any that were not on homepage
        if (article.listData.length === 0) {
          article.listData = [{ position: 18 }];
        } else {
          article.listData = article.listData.sort(compare);
        }
        // applies score
        listPos = article.listData[0].position;
        lpScore = 100 - (100 * listPos) / 20;
        viewCount = article.pageViews;
        vScore = viewCount / 500;
        totalArticleScore = vScore + lpScore;
        themeSum += totalArticleScore;
      });

      newsScore = {
        theme: themeObject.theme,
        newsScore: Math.round(themeSum * 100) / 100
      };
      return newsScore;
    })
    .filter(score => score.theme !== "UK" && score.theme !== "US");
}

module.exports = router;
