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

  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/topArticles`,
    qs: {
      dateFrom,
      dateTo,
      size: "100"
    },
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
});

router.get("/article-metadata/:uuid", async (req, res, next) => {
  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/metadata/article`,
    qs: {
      uuid: req.params.uuid
    },
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
});

router.get("/search/:term", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.query.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);

  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/search`,
    qs: {
      dateFrom,
      dateTo,
      term: req.params.term
    },
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
});

router.get("/section-or-topic/:sectionOrTopic", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.query.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);

  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/realtime`,
    qs: {
      dateFrom,
      dateTo,
      section: req.params.sectionOrTopic
    },
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
});

router.get("/top-views/:days", async (req, res, next) => {
  const dateFrom = new Date();
  let dateTo = new Date();
  let days = req.params.days;
  if (!days) {
    days = 1;
  }
  dateFrom.setDate(dateTo.getDate() - days);

  const options = {
    method: "GET",
    url: `${LANTERN_API_URL}/topViews`,
    qs: {
      dateFrom,
      dateTo,
      size: req.query.size ? req.query.size : 5
    },
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  request(options, function(error, response, body) {
    if (error) throw new Error(error);

    res.setHeader("Content-Type", "application/json");
    res.json(JSON.parse(body));
  });
});

module.exports = router;
