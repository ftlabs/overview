const express = require("express");
const router = express.Router();

const spaceUtilisationService = require("../lib/spaceUtilisation");

router.get("/hexagon", async (req, res, next) => {
  let articles = await spaceUtilisationService.getData();
  // articles = chunkArray(articles, 4);
  res.render("spaceUtilisation/hexagon", { articles });
});

function chunkArray(myArray, chunk_size) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

module.exports = router;
