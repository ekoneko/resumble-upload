var cacheService = require('./cache.js');
var appService = require('./app.js');
var crypto = require('crypto');

var getAppId = function () {
    var appid = req.get('X-' + process.env.HEADPRE + '-appid');
    return +appid;
}

var getToken = function () {
    var token = req.get('X-' + process.env.HEADPRE + '-token');
    return token;
}

var getSign = function () {
    var token = req.get('X-' + process.env.HEADPRE + '-sign');
    return token;
}

var getTime = function () {
    var time = req.get('X-' + process.env.HEADPRE + '-time');
    return time;
}

var createToken = function () {
    return new Promise(function (resolve, reject) {
        var appid = getAppId(),
            token;
        
        if (!appid) return reject('app not exists');

        appService.get(appid)
            .then(function (data) {
                if (!data) return reject('app not exists');
                token = 'token:' + appid + ':' + md5(Date.now()) + Math.random().toString(36).slice(2);
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
        var appid = getAppId(),
            sign = getSign();

        if (!appid || !sign) return reject('verify sign failed');
        appService.get(appid)
            .then(function (data) {
                if (!data) return reject('app not exists');
                sign === appid + getTime() + data.secret
            })
            .catch(reject);
    });
}

var auth = function (req, res, next) {
    var promise = new Promise(function (resolve, reject) {
        var appid = getAppId(),
            token = getToken();

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

var tokenGenerator = function (data, secret) {
    // 
}

module.exports = auth;
module.exports.createToken = createToken;
