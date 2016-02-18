var base = require('./base.js');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var FormData = require('form-data');
var assert = require('chai').assert;

describe('upload', () => {
    var token;

    var signFile = (filePath, fileState) => {
        var hash = crypto.createHash('md5');
        var sign = [];
        buffer = new Buffer(100);
        fs.readSync(fs.openSync(filePath, 'r'), buffer, 0, 100, 0)
        sign = [
            fileState.size,
            fileState.mtime.getTime().toString().substr(0, 10),
            crypto.createHash('md5').update(buffer).digest('hex')
            // Math.random().toString(36).substr(2, 6)
        ]
        return sign.join('-') + path.extname(filePath)
    }

    before((done) => {
        base.tokenGenerator()
            .then((res) => {
                token = res.token;
                done();
            })
            .catch((err) => {
                throw err;
            });
    })

    it('upload', (done) => {
        var headers = {}, formData;
        var filePath = path.resolve(__dirname, 'tiny.dat');
        var chunksize = 1048576;
        headers['X-' + process.env.HEADPRE + '-appid'] = 0;
        headers['X-' + process.env.HEADPRE + '-token'] = token;

        var fState = fs.statSync(filePath)
        var sign = signFile(filePath, fState);

        formData = new FormData();
        formData.append('filesize', fState.size);
        formData.append('filename', path.basename(filePath));
        formData.append('filesign', sign);
        formData.append('offset', 0);
        formData.append('chunksize', chunksize);
        formData.append('data', fs.createReadStream(filePath));

        formData.submit({
            host: '127.0.0.1',
            port: 3000,
            path: '/upload',
            headers: headers
        }, function (err, res) {
            var data = '';
            if (err) throw err;
            res.on('data', function (chunk) {
                data += chunk;
            })
            res.on('end', function () {
                console.log(data)
                if (res.statusCode === 200) {
                    return done()
                }
                throw 'statuscode not 200'
            })
        })
    })

    // it('upload-resume', (done) => {
    //     var headers = {}, formData;
    //     var filePath = path.resolve(__dirname, 'big.dat');
    //     var chunksize = 1048576;
    //     headers['X-' + process.env.HEADPRE + '-appid'] = 0;
    //     headers['X-' + process.env.HEADPRE + '-token'] = token;

    //     var fState = fs.statSync(filePath)
    //     var sign = signFile(filePath, fState);
})