var authService = require('../services/auth.js');
var appService = require('../services/app.js');

this.createtoken = function (req, res, next) {
    var token;
    authService.verifySign(req, appService.find)
        .then(function () {
            return authService.createToken(req, appService.find);
        })
        .then(function (token) {
            res.send({
                token: token,
                expire: Date.now() + 18e5
            });
        })
        .catch(function (err) {
            console.error(err);
            res.status(500);
            res.send(typeof err === 'string' ? err : 'create token error');
        })
}

this.auth = function (req, res, next) {
    authService.auth(req)
        .then(function (data) {
            req.access = data;
            next();
        })
        .catch(function (err) {
            res.status(403);
            res.send(typeof err === 'string' ? err : 'auth failed');
        });
}