var router = require('express').Router();
var requireDir = require('require-dir');
var _ = require('underscore');
var routes = requireDir('./routes');
var auth = require('./services/auth.js');
var multipartMiddleware = require('connect-multiparty')();

router.get('/', function(req, res, next) {
  res.send(403);
});

console.log(routes);

router.get('/ping', routes.test.ping);
router.all('/file/upload', multipartMiddleware, routes.file.upload);

module.exports = router;
