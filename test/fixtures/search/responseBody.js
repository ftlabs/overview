const original = {
	queryString: 'John Dalli',
	queryContext: { curations: ['ARTICLES', 'BLOGS'] },
	resultContext: {
		maxResults: '10',
		offset: '0',
		aspects: ['title', 'lifecycle', 'location'],
		sortOrder: 'DESC',
		sortField: 'lastPublishDateTime',
		facets: { names: ['people', 'organisations', 'topics'], maxElements: -1 }
	}
};

const constraints = JSON.stringify({
	...original,
	queryString: '"John Dalli" and TEST and TEST2'
});

const resultContext = JSON.stringify({
	...original,
	resultContext: {
		...original.resultContext,
		maxResults: '11',
		offset: '1'
	}
});

module.exports = {
	constraints,
	resultContext,
	original
};
