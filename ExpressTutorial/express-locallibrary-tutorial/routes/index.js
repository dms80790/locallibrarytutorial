var express = require('express');
var router = express.Router();

/* GET home page. */
//index is /views/index.pug
//title is template variable
router.get('/', function(req, res) {
  res.redirect('/catalog');
});

module.exports = router;
