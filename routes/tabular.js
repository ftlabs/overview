const express = require('express');
const router = express.Router();

// paths
router.get('/', async (req, res, next) => {
	return res.render("tabular", {
		data: null
	});
});


module.exports = router;
