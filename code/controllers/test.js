this.ping = function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send('pong');
}
this.auth = function () {
    require('../services/auth.js').verifySign(req, res)
        .then(function () {
            // 
        })
}