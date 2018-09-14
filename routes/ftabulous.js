const express = require('express');
const router = express.Router();
const article = require('../modules/article');

// paths
router.get('/', async (req, res, next) => {
	const results = await article.getArticleRelations( 1 );
	res.render("ftabulous", {
		data: JSON.stringify(results)
	});
});


module.exports = router;
