const listService = require("./listService");
const fetchContent = require("./fetchContent");

async function constructJSON() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    0,
    7
  );
  listData = listData[0];
  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  let articleData = {};

  const results = await Promise.all(
    listData.map(element => fetchContent.getArticle(element.content_id))
  );

  results.forEach(article => {
    articleData[article.webUrl.split("/").pop()] = article;
  });

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
          headline: articleData[object.content_id].title,
          text: articleData[object.content_id].standfirst
        },
        media: {
          url: articleData[object.content_id].mainImage
            ? formatImageUrl(
                articleData[object.content_id].mainImage.members[0],
                800
              )
            : process.env.FT_LOGO,
          thumbnail: formatImageUrl(
            articleData[object.content_id].mainImage.members[0],
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

function constructDateObject(date) {
  return {
    month: date.getMonth() + 1,
    day: date.getDate(),
    year: date.getFullYear(),
    hour: date.getHours(),
    minute: date.getMinutes()
  };
}

function formatImageUrl(url, size) {
  const isUPPImage = checkUrl(url.binaryUrl);
  let format;

  if (isUPPImage) {
    const uuid = extractUUID(url);
    format = `${process.env.IMAGE_SERVICE_URL}${
      process.env.REPLACE_IMG_URL
    }${uuid}`;
  } else {
    format = `${process.env.IMAGE_SERVICE_URL}${encodeURIComponent(
      url.binaryUrl
    )}`;
  }
  return format.concat(`?source=ftlabs&width=${size}`);
}

function checkUrl(url) {
  const ftcmsImageRegex = /^https?:\/\/(?:(?:www\.)?ft\.com\/cms|im\.ft-static\.com\/content\/images|com\.ft\.imagepublish\.(?:prod|upp-prod-eu|upp-prod-us)\.s3\.amazonaws\.com|prod-upp-image-read\.ft\.com)\/([a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12})/g;
  return ftcmsImageRegex.test(url);
}

function extractUUID(link) {
  if (link !== undefined) {
    return link.apiUrl
      .replace("http://api.ft.com/content/", "")
      .replace("http://api.ft.com/things/", "");
  }

  return undefined;
}

function constructTopicJSON() {}

module.exports = { constructJSON };
