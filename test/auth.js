var env = require('node-env-file');
env('.env');
var http = require('http');
var crypto = require('crypto');
var querystring = require('querystring');
var assert = require('chai').assert;

describe('auth', () => {
    var token;
    before((done) => {
        var data = '';
        var headers = {};
        var path = '/token/create';
        var appid = 0, sercet = '123456', time = Date.now(), sign;
        var hmac = crypto.createHmac('sha1', sercet);
        sign = hmac.update(querystring.stringify({appid: appid, url: path, time:time})).digest('hex');
        headers['X-' + process.env.HEADPRE + '-appid'] = appid;
        headers['X-' + process.env.HEADPRE + '-sign'] = sign;
        headers['X-' + process.env.HEADPRE + '-time'] = time;
        var req = http.request({
            host: '127.0.0.1',
            port: process.env.PORT,
            path: path,
            headers: headers
        }, (res) => {
            res.on('data', (chunk) => {
                data += chunk
            })
            res.on('end', () => {
                var dataDecode;
                try {
                    dataDecode = JSON.parse(data);
                } catch (e) {
                    throw (data)
                }
                if (dataDecode && dataDecode.token) {
                    token = dataDecode.token;
                    done();
                } else {
                    throw (data)
                }
            })
        })
        .on('error', (e) => {
            throw e
        })
        req.end()
    })

    it('token',() => {
        assert.isNotNull(token)
    });
});
