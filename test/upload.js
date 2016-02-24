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
            crypto.createHash('md5').update(buffer).digest('hex'),
            Math.random().toString(36).substr(2, 6)
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

    // it('upload', (done) => {
    //     var headers = {}, formData;
    //     var filePath = path.resolve(__dirname, 'tiny.dat');
    //     var chunksize = 1024 * 1024;
    //     headers['X-' + process.env.HEADPRE + '-appid'] = 0;
    //     headers['X-' + process.env.HEADPRE + '-token'] = token;
    //     
    //     if (!fs.existsSync(filePath)) {
    //       fs.writeFileSync(filePath, new Buffer(1024*512));
    //     }

    //     var fState = fs.statSync(filePath)
    //     var sign = signFile(filePath, fState);

    //     formData = new FormData();
    //     formData.append('filesize', fState.size);
    //     formData.append('filename', path.basename(filePath));
    //     formData.append('filesign', sign);
    //     formData.append('offset', 0);
    //     formData.append('chunksize', chunksize);
    //     formData.append('data', fs.createReadStream(filePath));

    //     formData.submit({
    //         host: '127.0.0.1',
    //         port: 3000,
    //         path: '/upload',
    //         headers: headers
    //     }, function (err, res) {
    //         var data = '';
    //         if (err) throw err;
    //         res.on('data', function (chunk) {
    //             data += chunk;
    //         })
    //         res.on('end', function () {
    //             console.log(data)
    //             if (res.statusCode === 200) {
    //                 return done()
    //             }
    //             throw 'statuscode not 200'
    //         })
    //     })
    // })

    it('upload-resume', (done) => {
        var headers = {};
        var filePath = path.resolve(__dirname, 'big.dat');
        var chunksize = 1024 * 1024;
        headers['X-' + process.env.HEADPRE + '-appid'] = 0;
        headers['X-' + process.env.HEADPRE + '-token'] = token;

        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, new Buffer(1024*1024*10));
        }

        var fState = fs.statSync(filePath)
        var sign = signFile(filePath, fState);
        var offset = 0;

        postData = (finish) => {
            var formData = new FormData();

            formData.append('filesize', fState.size);
            formData.append('filename', path.basename(filePath));
            formData.append('filesign', sign);
            formData.append('offset', offset);
            formData.append('chunksize', chunksize);
            formData.append('data', fs.createReadStream(filePath, {
                start: offset,
                end: Math.min(fState.size - 1, offset + chunksize)
            }));

            formData.submit({
                host: '127.0.0.1',
                port: 3000,
                path: '/upload',
                headers: headers
            }, (err, res) => {
                var data = '';
                if (err) throw err;
                res.on('data', (chunk) => {
                    data += chunk;
                })
                res.on('end', () => {
                    console.log(data)
                    return finish('');
                    // if (res.statusCode === 200) {
                    //     var dataDecode = JSON.parse(data);
                    //     if (dataDecode.url) {
                    //         return finish(dataDecode.url)
                    //     }
                    //     offset = dataDecode.offset;
                    //     postData(finish);
                    // }
                })
            })
        }

        postData(function (filePath) {
            console.log('url: ', filePath)
            done()
        })


    })
})