var base = require('./base.js');
var fs = require('fs');
var path = require('path');
var FormData = require('form-data');

describe('upload', () => {
    var token;
    before((done) => {
        base.tokenGenerator()
            .then((res) => {
                token = res.token;
                done();
            })
            .catch((err) => {
                throw err;
            });;
    })

    it('upload', (done) => {
        var headers = {}, formData;
        var filePath = './data.jpg';
        var chunksize = 1048576;
        headers['X-' + process.env.HEADPRE + '-appid'] = 0;
        headers['X-' + process.env.HEADPRE + '-token'] = token;

        var fState = fs.statSync(filePath)

        formData = new FormData();
        formData.append('filesize', fState.size);
        formData.append('filename', path.basename(filePath));
        formData.append('filesign', '');
        formData.append('offset', 0);
        formData.append('chunksize', chunksize);
        formData.append('data', fs.createReadStream(filePath));


        base.request({
            method: 'POST',
            host: '127.0.0.1',
            port: process.env.PORT,
            path: '/upload',
            headers: headers
        }, null, formData).then((data) => {
            // 
            done();
        }).catch((err) => {
            throw err;
        })
    })
})