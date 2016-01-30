var base = require('./base.js');
var assert = require('chai').assert;

describe('auth', () => {
    var token, expire;
    before((done) => {
        base.tokenGenerator()
            .then((res) => {
                token = res.token;
                expire = +res.expire;
                done();
            })
            .catch((err) => {
                throw err;
            });;
    })

    it('create token',() => {
        assert.isNotNull(token);
        assert.isTrue(expire > Date.now());
    });

    it('no token request', (done) => {
        var headers = {};
        
        base.request({
            method: 'POST',
            host: '127.0.0.1',
            port: process.env.PORT,
            path: '/upload',
            headers: headers
        }).then((data) => {
            if (data === 'auth failed') {
                return done();
            }
            throw data
        }).catch((err) => {
            console.error(err)
            throw err;
        })
    })

    it('error token request', (done) => {
        var headers = {};
        headers['X-' + process.env.HEADPRE + '-appid'] = 0;
        headers['X-' + process.env.HEADPRE + '-token'] = 'abcdef';
        
        base.request({
            method: 'POST',
            host: '127.0.0.1',
            port: process.env.PORT,
            path: '/upload',
            headers: headers
        }).then((data) => {
            if (data === 'auth failed') {
                return done();
            }
            throw data
        }).catch((err) => {
            console.error(err)
            throw err;
        })
    })
});