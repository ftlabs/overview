const express = require("express");
const router = express.Router();

router.get("/hexagon", (req, res, next) => {
  res.render("spaceUtilisation/hexagon");
});

module.exports = router;
