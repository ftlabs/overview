'use strict';

function getItem(item, key, value){
	return item.find(function (obj) { return obj[key] === value });
}

module.exports = {
	getItem,
};
