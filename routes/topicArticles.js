const express = require('express');
const router = express.Router();
const article = require('../modules/article');


// paths
router.get('/', async (req, res, next) => {
	res.render("topicArticles");
});

// endpoints
router.get('/q', async (req, res, next) => {
	res.setHeader("Content-Type", "application/json");
	res.json( {} );
});



module.exports = router;
