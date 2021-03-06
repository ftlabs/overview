const BigQuery = require("@google-cloud/bigquery");
const listDBHelper = require("../helpers/listDB");
const debug = require('debug')('lib:listService');

const bigQuery = new BigQuery({
  projectId: "ft-labs",
  keyFilename: "keyfile.json"
});

function constructQuery({ listId, contentId, dateFrom, dateTo, position }) {
  const query = `SELECT * FROM \`ft-data.articles.view_content_list_position\` WHERE ${constructWhere(
    listId,
    contentId,
    position
  )} ${constructBetween(dateFrom, dateTo)} LIMIT 1000`;
  return query;
}

function constructWhere(listId, contentId, position = undefined) {
  if (Array.isArray(position)) {
    const positions = position.reduce((fullString, currentPosition, index) => {
      return (
        fullString + `${index === 0 ? "" : " OR"} position=${currentPosition}`
      );
    }, "");
    return `list_id='${listId}' AND (${positions})`;
  }
  if (position !== undefined) {
    return `list_id='${listId}' AND position=${position}`;
  }
  if (listId) return `list_id='${listId}'`;
  if (contentId) return `content_id='${contentId}'`;
  return "";
}

function constructBetween(dateFrom, dateTo) {
  if (!dateFrom || !dateTo) return "";
  return `AND entry_timestamp BETWEEN ${JSON.stringify(
    dateFrom
  )} AND ${JSON.stringify(dateTo)}`;
}

function overDuration(list, days) {
  const dateFrom = new Date();
  let dateTo = new Date();
  dateFrom.setDate(dateTo.getDate() - days);
  return bigQuery.query({
    query: constructQuery({
      listId: listDBHelper.getId(list),
      dateFrom,
      dateTo
    })
  });
}

function overRange(list, daysAgoFrom, daysAgoTo) {
  const dateNow  = new Date();
  const dateFrom = new Date();
  const dateTo   = new Date();
  dateFrom.setDate(dateNow.getDate() - daysAgoFrom);
  dateTo  .setDate(dateNow.getDate() - daysAgoTo  );
  debug(`listService.overRange: list=${list}, daysAgoFrom=${daysAgoFrom}, daysAgoTo=${daysAgoTo}, dateFrom=${dateFrom}, dateTo=${dateTo}`);
  return bigQuery.query({
    query: constructQuery({
      listId: listDBHelper.getId(list),
      dateFrom,
      dateTo
    })
  });
}

function articleData(contentId) {
  return bigQuery.query({
    query: constructQuery({
      contentId
    })
  });
}

function positionData(
  list = "uk-homepage-top-stories",
  position = [0, 1, 2, 3, 4, 5],
  days = 1
) {
  let dateFrom;
  let dateTo;
  const date = new Date();
  const daysForFullResults = 3
  const latestHour = 24
  const latestMinute = 59
  const latestSecond = 59
  const daysToAddForQuery = 2

  days = parseInt(days) + daysToAddForQuery;

  dateFrom = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - days
  );
  dateTo = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - daysForFullResults,
    latestHour,
    latestMinute,
    latestSecond
  );

  return bigQuery.query({
    query: constructQuery({
      listId: listDBHelper.getId(list),
      position,
      dateFrom,
      dateTo
    })
  }).then(data => {
    let listData = data[0];
    return listData;
  });
}

module.exports = {
  overDuration,
  articleData,
  positionData,
  overRange,
};
