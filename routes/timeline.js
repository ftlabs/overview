const express = require("express");
const router = express.Router();
const timelineService = require("../lib/timelineService");
const listService = require("../lib/listService");

router.get("/", (req, res, next) => {
  res.render("timeline/index");
});

router.get("/simple", async (req, res, next) => {
  try {
    const data = await timelineService.simpleJSON();
    res.render("timeline/simple", { data });
  } catch (error) {
    throw new Error(error);
  }
});


router.get("/vertical", async (req, res, next) => {
  try {
    const data = await timelineService.simpleJSON();

    const bigquery = await listService.articleData('9a76b08a-c838-11e8-ba8f-ee390057b8c9');
    console.log(bigquery)

    res.render("timeline/vertical", { data });
  } catch (error) {
    throw new Error(error);
  }
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

router.get("/simpleData", async (req, res, next) => {
  try {
    const data = await timelineService.simpleJSON();
    res.setHeader("Content-Type", "application/json");
    res.json(JSON.stringify(data));
  } catch (error) {
    throw new Error(error);
  }
});

router.get("/topic", async (req, res, next) => {
  const data = await timelineService.constructTopicJSON(["Brexit"]);

  res.render("timeline/timelineTopic");
});

module.exports = router;
