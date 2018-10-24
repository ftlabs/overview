const express = require("express");
const request = require("request");
const { lanternApiRequest } = require("../lib/lanternService");

const router = express.Router();

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

  const results = await lanternApiRequest("topArticles", queryString, res);

  res.json(JSON.parse(results));
});

router.get("/article-metadata/:uuid", async (req, res, next) => {
  const queryString = {
    uuid: req.params.uuid
  };

  const results = await lanternApiRequest("metadata/article", queryString);

  res.json(JSON.parse(results));
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

  const results = await lanternApiRequest("search", queryString);

  res.json(JSON.parse(results));
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

  const results = await lanternApiRequest("realtime", queryString);

  res.json(JSON.parse(results));
});

router.get("/pageViews", async (req, res, next) => {
  const queryString = {
    uuids: req.query.uuids.split(","),
    timespan: "3h"
  };

  const results = await lanternApiRequest(
    "articles/ranking",
    queryString,
    "POST"
  );

  res.json(JSON.parse(results));
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

  const results = await lanternApiRequest("topViews", queryString);

  res.json(JSON.parse(results));
});

module.exports = router;
