require('babel-core/register')
var assert = require('chai').assert;
var baseUrl = process.env.URL;

describe('auth', function() {
    var headers = new Headers;
    headers.append()
    it('token',function(done) {
        fetch(baseUrl + '/test/auth', {
            method: "GET",
            // headers: headers
        }).then(done)
    });
});