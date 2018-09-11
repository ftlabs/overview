const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	const results = await article.getArticleRelations( 1, req.params.facet );
	res.render("hierarchicalEdgeBundling", {
		data: JSON.stringify(results)
	});
});


// endpoints



module.exports = router;
