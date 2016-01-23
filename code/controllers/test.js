this.ping = function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send('pong');
}
this.auth = function (req, res, next) {
    res.render('test/auth')
    // var authService = require('../services/auth.js')
    // authService.verifySign(req, res)
    //     .then(function () {
    //         return authService.createToken(req, res)
    //     })
    //     .then(function (token) {
    //         res.send({
    //             token: token,
    //             expire: Date.now() + 18e5
    //         });
    //     })
    //     .catch(function (err) {
    //         console.error(err);
    //         res.status(500);
    //         res.send(err);
    //     })
}