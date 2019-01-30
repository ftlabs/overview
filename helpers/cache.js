const debug = require('debug')('bin:lib:cache');

let CACHE = {};

function clearAll() {
	CACHE = {};
	debug(`cache.clearAll`);
}

function clear(key) {
	debug(`cache.clear: key`);
	return delete CACHE[key];
}

function set(key, value) {
	if (!CACHE.hasOwnProperty(key)) {
		CACHE[key] = value;
	} 

	return CACHE[key];
}

function get(key) {
	let value = undefined;
	if (!CACHE.hasOwnProperty(key)) {
		debug(`cache.get: miss: key=${key}`);
	} else {
		value = CACHE[key];
	}

	return value;
}

module.exports = {
	set,
	get,
	clearAll,
	clear
};
