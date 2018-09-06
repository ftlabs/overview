const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/:facet', async (req, res, next) => {
	const results = await article.getArticlesInTopics( 1, req.params.facet );
	res.render("hierarchicalEdgeBundling", {
		data: JSON.stringify(results)
	});


	res.render("hierarchicalEdgeBundling");
});


// endpoints



module.exports = router;
