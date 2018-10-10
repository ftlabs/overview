const listService = require("./listService");
const fetchContent = require("./fetchContent");
const { formatImageUrl } = require("../helpers/image");
const { resizeImageURL } = require("../helpers/image");

async function constructJSON() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    0,
    7
  );

  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  let rawArticleData = await getArticleData(listData);
  let articleData = createArticleObject(rawArticleData);

  return {
    start_date: constructDateObject(startDate),
    title: {
      text: {
        headline: "The week that was"
      }
    },
    events: listData.map(object => {
      const entryDate = new Date(object.entry_timestamp.value);
      let event = {
        start_date: constructDateObject(entryDate),
        text: {
          headline: articleData[object.content_id].title.title,
          text: articleData[object.content_id].summary.excerpt
        },
        media: {
          url: articleData[object.content_id].images
            ? resizeImageURL(
                articleData[object.content_id].images[0].url,
                800
              )
            : process.env.FT_LOGO,
          thumbnail: resizeImageURL(
            articleData[object.content_id].images[0].url,
            200
          )
        }
      };
      if (object.exit_timestamp) {
        event.end_date = constructDateObject(
          new Date(object.exit_timestamp.value)
        );
      }
      return event;
    })
  };
}

async function getArticleData(listData) {
  try {
    const uuids = listData.map(element => element.content_id);
    const params = {
      queryString : fetchContent.constructUUIDsQuery(uuids),
      maxResults: 100,
      facets: { names: ['people', 'organisations', 'topics', 'genre'], maxElements: -1 },
      aspects : ["audioVisual", "editorial", "images", "lifecycle", "location", "master", "metadata", "nature", "provenance", "summary", "title"],
    };
    return await fetchContent.getArticles(uuids, params);
  } catch (error) {
    throw new Error(error);
  }
}

function constructDateObject(date) {
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    year: date.getFullYear(),
    hour: date.getHours(),
    minute: date.getMinutes()
  };
}

function createArticleObject(rawArticleData) {
  let articleData = {};
  rawArticleData.forEach(article => {
    if (article.id) {
      articleData[article.id] = article;
    }
  });
  return articleData;
}

async function simpleJSON() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    [0, 1, 2],
    2
  );
  let articleData = await getArticleData(listData);
  return articleData.map((article, index) => {
    publishHour = new Date(article.lifecycle.initialPublishDateTime).getHours();
    if (publishHour > 12) {
      publishHour = `${publishHour - 12}pm`;
    } else {
      publishHour = `${publishHour}am`;
    }
    article.formatedDate = publishHour;

    if (index === 0) {
      article.firstArticle = true;
    } else {
      article.firstArticle = false;
    }

    article.image = article.images[0].url
      ? resizeImageURL(article.images[0].url, 800)
      : process.env.FT_LOGO;
    return article;
  });
}

module.exports = {
  constructJSON,
  simpleJSON
};
