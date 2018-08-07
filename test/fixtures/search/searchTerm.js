const original = { queryString: 'John Dalli' };

const constraints = {
	...original,
	constraints: ['TEST', 'TEST2']
};

const resultContext = {
	...original,
	maxResults: 11,
	offset: 1
};

module.exports = {
	original,
	constraints,
	resultContext
};
