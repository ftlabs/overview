const listService = require("./listService");
const fetchContent = require("./fetchContent");
const { formatImageUrl } = require("../helpers/image");

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

module.exports = { getData };
