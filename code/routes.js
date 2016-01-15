var router = require('express').Router();
var requireDir = require('require-dir');
var _ = require('underscore');
var controllers = requireDir('./controllers');
var auth = require('./services/auth.js');
var multipartMiddleware = require('connect-multiparty')();

router.get('/', function(req, res, next) {
  res.send(403);
});

router.get('/ping', controllers.test.ping);
router.get('/token', controllers.auth.token);
router.all('/upload', auth, multipartMiddleware, controllers.file.upload);

module.exports = router;
