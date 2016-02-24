var fs = require('fs');
var path = require('path');
var router = require('express').Router();
var requireDir = require('require-dir');
var controllers = requireDir('./controllers');
var multipartMiddleware = require('connect-multiparty')();
var nodeModulesPath = path.resolve('node_modules');

router.get('/', function(req, res, next) {
  res.send(403);
});
router.get('/node_modules/*', function (req, res, next) {
    var file = path.resolve('.', req.url.replace(/^\//, ''));
    if (file.indexOf(nodeModulesPath) === 0) {
        if (fs.existsSync(file)) {
            return res.sendFile(file);
        }
    }
    next();
});
router.get('/ping', controllers.test.ping);
router.get('/token/create', controllers.auth.createtoken);
router.post('/upload', controllers.auth.auth, multipartMiddleware, controllers.file.upload);

module.exports = router;
