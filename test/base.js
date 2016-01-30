var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var env = require('node-env-file');
env('.env');

var tokenGenerator = () => {
    var headers = {};
    var path = '/token/create';
    var appid = 0, sercet = '123456', time = Date.now(), sign;
    var hmac = crypto.createHmac('sha1', sercet);
    sign = hmac.update(querystring.stringify({appid: appid, url: path, time:time})).digest('hex');
    headers['X-' + process.env.HEADPRE + '-appid'] = appid;
    headers['X-' + process.env.HEADPRE + '-sign'] = sign;
    headers['X-' + process.env.HEADPRE + '-time'] = time;
    return request({
        host: '127.0.0.1',
        port: process.env.PORT,
        path: path,
        headers: headers
    }).then(function (data) {
        return new Promise(function (resolve, reject) {
            var dataDecode;
            try {
                dataDecode = JSON.parse(data);
            } catch (e) {
                return reject(data)
            }
            if (dataDecode && dataDecode.token) {
                return resolve(dataDecode);
            } else {
                return reject(data)
            }
        })
    })
}

var request = (options, postData, formData) => {
    return new Promise(function (resolve, reject) {
        var data = '';
        var req = http.request(options, (res) => {
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(data)
            })
        });
        req.on('error', reject);
        if (formData) {
            formData.pipe(req);
        }
        if (postData) {
            req.write(postData);
        }
        req.end();
    })
}

module.exports.tokenGenerator = tokenGenerator;
module.exports.request = request;