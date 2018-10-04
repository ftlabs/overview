const listService = require("./listService");
const fetchContent = require("./fetchContent");

async function constructJSON() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    0,
    7
  );
  //   console.log(listData);
  listData = listData[0];
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

async function getArticleData(listData) {
  try {
    const results = await Promise.all(
      listData.map(element => fetchContent.getArticle(element.content_id))
    );
    return results;
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
    const linkWithoutHTTP = link.apiUrl.split("://")[1];
    return linkWithoutHTTP
      .replace("api.ft.com/content/", "")
      .replace("api.ft.com/things/", "");
  }

  return undefined;
}

function createArticleObject(rawArticleData) {
  let articleData = {};
  rawArticleData.forEach(article => {
    if (article.webUrl) {
      articleData[article.webUrl.split("/").pop()] = article;
    }
  });
  return articleData;
}

function annotationCount(articleData) {
  let annotationsCount = [];
  articleData.forEach(article => {
    if (article.annotations) {
      article.annotations.forEach(annotation => {
        if (
          annotationsCount.find(
            existingAnnotation =>
              existingAnnotation.name === annotation.prefLabel
          )
        ) {
          annotationsCount = annotationsCount.map(
            existingAnnotation =>
              existingAnnotation.name === annotation.prefLabel
                ? {
                    name: existingAnnotation.name,
                    count: existingAnnotation.count + 1,
                    articles: [...existingAnnotation.articles, article]
                  }
                : existingAnnotation
          );
        } else {
          annotationsCount = [
            ...annotationsCount,
            { name: annotation.prefLabel, count: 1, articles: [article] }
          ];
        }
      });
    }
  });
  return annotationsCount.sort((a, b) => a.count - b.count).reverse();
}

async function constructTopicJSON(topics) {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    [0, 1, 2],
    12
  );
  listData = listData[0];
  let articleData = await getArticleData(listData);
  let annotationsCount = annotationCount(articleData);
  annotationsCount = annotationsCount.filter(annotation =>
    topics.includes(annotation.name)
  );
}

async function simpleJSON() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    [0, 1, 2],
    2
  );
  listData = listData[0];
  let articleData = await getArticleData(listData);
  return articleData.map((article, index) => {
    publishHour = new Date(article.firstPublishedDate).getHours();
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

    article.image = article.mainImage
      ? formatImageUrl(article.mainImage.members[0], 800)
      : process.env.FT_LOGO;
    return article;
  });
}

module.exports = { constructJSON, constructTopicJSON, simpleJSON };
