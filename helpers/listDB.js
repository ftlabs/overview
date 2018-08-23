const lists = JSON.parse(process.env.LIST_IDS);

function getId(sectionName) {
  const list = lists[sectionName];
  if (list) return list;
  throw new Error("list ID does not exist in env variable");
}

module.exports = { getId };
