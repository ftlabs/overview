const listService = require("./listService");
const fetchContent = require("./fetchContent");

async function getData() {
  let listData = await listService.positionData(
    "uk-homepage-top-stories",
    [0, 1, 2, 3],
    3
  );
  listData = listData[0];

  let articleData = await getArticleData(listData);

  articleData = articleData.map((article, index) => {
    article.image = article.mainImage
      ? formatImageUrl(article.mainImage.members[0], 800)
      : process.env.FT_LOGO;
    return article;
  });

  return articleData;
}

async function getArticleData(listData) {
  try {
    const results = await Promise.all(
      listData.map(element => fetchContent.getArticle(element.content_id))
    );
    return results.map(result => {
      const listPositionData = listData.find(listItem => {
        return (
          listItem.content_id ===
          result.id.split("/")[result.id.split("/").length - 1]
        );
      });

      return { ...result, position: listPositionData.position };
    });
  } catch (error) {
    throw new Error(error);
  }
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

module.exports = { getData };
