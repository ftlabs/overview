const express = require("express");
const router = express.Router();

const spaceUtilisationService = require("../lib/spaceUtilisation");

router.get("/", async (req, res, next) => {
  res.render("spaceUtilisation/index");
});

router.get("/hexagon", async (req, res, next) => {
  let articles = await spaceUtilisationService.getData();
  res.render("spaceUtilisation/hexagon", { articles });
});

router.get("/grid", async (req, res, next) => {
  let articles = await spaceUtilisationService.getData();
  articles = chunkArray(articles, 25)[0];
  res.render("spaceUtilisation/grid", { articles });
});

function chunkArray(myArray, chunk_size) {
  const index = 0;
  const arrayLength = myArray.length;
  let tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    tempArray.push(myChunk);
  }

  return tempArray;
}

module.exports = router;
