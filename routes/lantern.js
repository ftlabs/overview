const express = require("express");
const request = require("request");
const router = express.Router();

const LANTERN_API_URL = "https://api-lantern.ft.com";

const LANTERN_API_KEY = process.env.LANTERN_API_KEY;

router.get("/", (req, res, next) => {
  res.render("lantern");
});

router.get("/top-articles/:days", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  dateFrom.setDate(dateTo.getDate() - req.params.days);

  const queryString = {
    dateFrom,
    dateTo,
    size: "100"
  };

  lanternApiRequest("topArticles", queryString, res);
});

router.get("/article-metadata/:uuid", async (req, res, next) => {
  const queryString = {
    uuid: req.params.uuid
  };

  lanternApiRequest("metadata/article", queryString, res);
});

router.get("/search/:term", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.query.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);

  const queryString = {
    dateFrom,
    dateTo,
    term: req.params.term
  };

  lanternApiRequest("search", queryString, res);
});

router.get("/section-or-topic/:sectionOrTopic", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.query.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);

  const queryString = {
    dateFrom,
    dateTo,
    section: req.params.sectionOrTopic
  };

  lanternApiRequest("realtime", queryString, res);
});

router.get("/top-views/:days", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.params.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);
  const queryString = {
    dateFrom,
    dateTo,
    size: req.query.size ? req.query.size : 5
  };

  lanternApiRequest("topViews", queryString, res);
});

function lanternApiRequest(apiMethod, queryString, res) {
  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/${apiMethod}`,
    qs: queryString,
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
}

module.exports = router;
