const debug = require('debug')('bin:lib:cache');

let CACHE = {};

function clearAll() {
	CACHE = {};
	debug(`cache.clearAll`);
}

function get(key, valueFn) {
	if (!CACHE.hasOwnProperty(key)) {
		debug(`cache.get: miss: key=${key}`);
		const value = valueFn();
		CACHE[key] = value;
	} else {
		debug(`cache.get: hit: key=${key}`);
	}

	return CACHE[key];
}

module.exports = {
	get,
	clearAll
};
