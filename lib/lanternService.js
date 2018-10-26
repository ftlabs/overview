const request = require("request-promise");

const LANTERN_API_URL = "https://api-lantern.ft.com";

const LANTERN_API_KEY = process.env.LANTERN_API_KEY;

function lanternApiRequest(apiMethod, queryString, method = "GET") {
  const options = {
    method: method,
    url: `${LANTERN_API_URL}/${apiMethod}`,
    qs: queryString,
    headers: {
      "x-api-key": LANTERN_API_KEY
    }
  };

  return request(options);
}

module.exports = { lanternApiRequest };
