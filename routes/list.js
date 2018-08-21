const express = require("express");
const router = express.Router();
const listService = require("../lib/listService");

router.get("/", (req, res, next) => {
  res.render("list");
});

router.get("/overDuration/:list", async (req, res, next) => {
  try {
    const data = await listService.overDuration(
      req.params.list,
      req.query.days
    );
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (error) {
    throw error;
  }
});

router.get("/article/:contentId", async (req, res, next) => {
  try {
    const data = await listService.articleData(req.params.contentId);
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (error) {
    throw error;
  }
});

router.get("/position/:list", async (req, res, next) => {
  try {
    const data = await listService.positionData(
      req.params.list,
      req.query.position,
      req.query.days
    );
    res.setHeader("Content-Type", "application/json");
    res.json(data);
  } catch (error) {
    throw error;
  }
});

module.exports = router;
