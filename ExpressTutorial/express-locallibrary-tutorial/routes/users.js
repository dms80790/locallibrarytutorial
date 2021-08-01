var express = require('express');
var router = express.Router();

//route defines a callback function that will be called whenever an HTTP GET request
//with the matching pattern is detected
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/cool', function(req, res, next){
  res.send('You\'re so cool');
})

module.exports = router;
