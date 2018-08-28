const listService = require("./listService");
const fetchContent = require("./fetchContent");

async function constructJSON() {
  let data = await listService.positionData("uk-homepage-top-stories", 0, 7);
  data = data[0];
  let startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  let articleData = {};

  const results = await Promise.all(
    data.map(element => fetchContent.getArticle(element.content_id))
  );

  results.forEach(article => {
    articleData[article.webUrl.split("/").pop()] = article;
  });

  return {
    start_date: {
      month: startDate.getMonth().toString(),
      day: startDate.getDate().toString(),
      year: startDate.getFullYear().toString()
    },
    title: {
      text: {
        headline: "The week that was"
      }
    },
    events: data.map(object => {
      const date = new Date(object.entry_timestamp.value);
      const exitDate = new Date(object.entry_timestamp.value);

      return {
        start_date: {
          month: date.getMonth(),
          day: date.getDate(),
          year: date.getFullYear(),
          hour: date.getHours(),
          minute: date.getMinutes()
        },
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
    })
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

module.exports = { constructJSON };
