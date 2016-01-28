var authService = require('../services/auth.js');

this.createtoken = function (req, res, next) {
    var token;
    authService.verifySign(req, res)
        .then(function () {
            return authService.createToken(req, res);
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