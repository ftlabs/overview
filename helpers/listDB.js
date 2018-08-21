const lists = require("../listIds");

function getId(sectionName) {
  return lists[sectionName];
}

module.exports = { getId };
