const lists = JSON.parse(process.env.LIST_IDS);

function getId(sectionName) {
  return lists[sectionName];
}

module.exports = { getId };
