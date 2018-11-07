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
		debug(`cache.set: new key: key=${key}`);
		CACHE[key] = value;
	} else {
		debug(`cache.set: existing key: key=${key}`);
	}

	return CACHE[key];
}

function get(key) {
	let value = undefined;
	if (!CACHE.hasOwnProperty(key)) {
		debug(`cache.get: miss: key=${key}`);
	} else {
		debug(`cache.get: hit: key=${key}`);
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
