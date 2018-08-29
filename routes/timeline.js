const express = require("express");
const router = express.Router();
const timelineService = require("../lib/timelineService");

router.get("/", (req, res, next) => {
  res.render("timeline/index");
});

router.get("/latestData", async (req, res, next) => {
  try {
    const data = await timelineService.constructJSON();
    res.setHeader("Content-Type", "application/json");
    res.json(JSON.stringify(data));
  } catch (error) {
    throw new Error(error);
  }
});

module.exports = router;
