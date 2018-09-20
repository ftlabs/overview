const express = require("express");
const router = express.Router();

router.get("/", (req, res, next) => {
  res.render("spaceUtilisation/index");
});

router.get("/latestData", async (req, res, next) => {});

module.exports = router;
