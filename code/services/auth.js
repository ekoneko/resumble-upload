var cacheService = require('./cache.js');
var appService = require('./app.js');
var crypto = require('crypto');
var querystring = require('querystring');

var getAppId = function (req) {
    var appid = req.get('X-' + process.env.HEADPRE + '-appid');
    return +appid;
}

var getToken = function (req) {
    var token = req.get('X-' + process.env.HEADPRE + '-token');
    return token;
}

var getSign = function (req) {
    var sign = req.get('X-' + process.env.HEADPRE + '-sign');
    return sign;
}

var getTime = function (req) {
    var time = req.get('X-' + process.env.HEADPRE + '-time');
    return +time;
}

var createToken = function (req, res) {
    return new Promise(function (resolve, reject) {
        var appid = getAppId(req),
            token;

        appService.find(appid)
            .then(function (data) {
                if (!data) return reject('app not exists');
                token = tokenGenerator(appid);
                return cacheService.set(token, data, 1800)
            })
            .then(function () {
                resolve(token);
            })
            .catch(reject)
            
    })
}

var verifySign = function (req, res) {
    return new Promise(function (resolve, reject) {
        var appid = getAppId(req),
            sign = getSign(req),
            time = getTime(req),
            hmac;

        if (!time || (Date.now - time) > 3e5) return reject('time not match');
        if (appid === NaN || !sign) return reject('verify sign failed');
        appService.find(appid)
            .then(function (data) {
                var string;
                if (!data) return reject('app not exists');
                hmac = crypto.createHmac('sha1', data.secret);
                string = querystring.stringify({"appid": appid, "url": req.url, "time": time});
                sign === hmac.update(string).digest('hex') ? resolve() : reject('sign error');
            })
            .catch(reject);
    });
}

var auth = function (req, res, next) {
    var promise = new Promise(function (resolve, reject) {
        var appid = getAppId(req),
            token = getToken(req);

        if (!appid || !token) return reject('auth failed');

        return cacheService.get(token)
            .then(function (data) {
                +data.id === appid ? resolve() : reject();
            })
            .catch(reject);
    });
    promise.then(next).catch(function (err) {
        res.status(403);
        res.send(typeof err === 'string' ? err : 'auth failed');
    })
}

var tokenGenerator = function (appid) {
    return appid + ':' + ((Date.now() + Math.random())*10000).toString(36).slice(2)
}

module.exports = auth;
module.exports.createToken = createToken;
module.exports.verifySign = verifySign;