const express = require("express");
const router = express.Router();
const listService = require("../lib/listService");

router.get("/", (req, res, next) => {
  res.render("timeline/index");
});

router.get("/latestData", async (req, res, next) => {
  try {
    const data = await listService.positionData(
      "uk-homepage-top-stories",
      0,
      7
    );
    res.setHeader("Content-Type", "application/json");
    res.json(JSON.stringify(json));
  } catch (error) {
    console.error(error);
    //   do error stuff
  }
});

const json = {
  title: {
    text: {
      headline: "The week that was"
    }
  },
  events: [
    {
      media: {
        url: "{{ static_url }}/img/examples/houston/family.jpg",
        caption:
          "Houston's mother and Gospel singer, Cissy Houston (left) and cousin Dionne Warwick.",
        credit:
          "Cissy Houston photo:<a href='http://www.flickr.com/photos/11447043@N00/418180903/'>Tom Marcello</a><br/><a href='http://commons.wikimedia.org/wiki/File%3ADionne_Warwick_television_special_1969.JPG'>Dionne Warwick: CBS Television via Wikimedia Commons</a>"
      },
      start_date: {
        month: "8",
        day: "9",
        year: "1963"
      },
      text: {
        headline: "A Musical Heritage",
        text:
          "<p>Born in New Jersey on August 9th, 1963, Houston grew up surrounded by the music business. Her mother is gospel singer Cissy Houston and her cousins are Dee Dee and Dionne Warwick.</p>"
      }
    }
  ]
};

module.exports = router;
