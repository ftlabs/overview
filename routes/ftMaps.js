const express = require('express');
const router = express.Router();
const articleList = require('../modules/article');

// paths
router.get('/', async (req, res, next) => {
	res.render("ftMaps");
});

router.get('/view', async (req, res, next) => {
	res.render("ftMaps/view",);
});

module.exports = router;
