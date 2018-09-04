const express = require('express');
const router = express.Router();


// paths
router.get('/', async (req, res, next) => {
	res.render("heartbeat");
});

router.get('/one', async (req, res, next) => {
	res.render("heartbeat/one");
});

// endpoints



module.exports = router;
