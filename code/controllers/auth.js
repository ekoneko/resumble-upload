var authService = require('../services/auth.js');

this.token = function (req, res, next) {
    var token;
    authService.verifySign(req, res)
        .then(function () {
            return authService.createToken();
        })
        .then(function (token) {
            res.send({
                token: token,
                expire: Date.now() + 18e5
            });
        })
        .catch(function (err) {
            res.status(500);
            res.send(typeof err === 'string' ? err : 'create token error');
        })
}