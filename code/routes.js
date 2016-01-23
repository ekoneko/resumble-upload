var path = require('path');
var router = require('express').Router();
var requireDir = require('require-dir');
var _ = require('underscore');
var controllers = requireDir('./controllers');
var auth = require('./services/auth.js');
var multipartMiddleware = require('connect-multiparty')();
var nodeModulesPath = path.resolve('node_modules');

router.get('/', function(req, res, next) {
  res.send(403);
});
router.get('/node_modules/*', function (req, res, next) {
    var file = path.resolve('.', req.url.replace(/^\//, ''));
    console.log([file, nodeModulesPath])
    if (file.indexOf(nodeModulesPath) === 0) {
        res.sendFile(file);
    } else {
        next();
    }
});
router.get('/ping', controllers.test.ping);
router.get('/test/auth', controllers.test.auth);
router.get('/token', controllers.auth.token);
router.all('/upload', auth, multipartMiddleware, controllers.file.upload);

module.exports = router;
