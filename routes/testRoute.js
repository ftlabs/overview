const express = require('express');
const router = express.Router();

router.get('/', (req, res, next) => {
  console.log('PATH:: testRoute root');
  res.render("/searchAndContentExperiments/basic3");
});

module.exports = router;
