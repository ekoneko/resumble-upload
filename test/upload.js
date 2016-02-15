var base = require('./base.js');
var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var FormData = require('form-data');

describe('upload', () => {
    var token;

    /*var signFile = () => {
        var deferred = new $.Deferred();
        var spark = new SparkMD5.ArrayBuffer();
        var ext = file.files[0].name.split('.').pop();
        var size = 20971520;

        var fileReader = new FileReader();
        fileReader.onload = function (e) {
            var md5;
            spark.append(e.target.result);
            md5 = spark.end();
            spark = null;
            self._fileSign = [
                self._fileSize,
                file.files[0].lastModified,
                SparkMD5.hash(file.files[0].name),
                md5
            ].join('-');
            self._fileSign += ext ? ('.' + ext) : '';
            deferred.resolve();
        }
        fileReader.onerror = function (err) {
            deferred.reject(err);
        }

        ext = ext.length > 4 ? '' : ext;
        size = Math.min(size, self._fileSize);
        fileReader.readAsArrayBuffer(file.files[0].slice(0, size));
        return deferred.promise();
    }*/

    var signFile = (filePath, fileState) => {
        var hash = crypto.createHash('md5');
        var sign = [];
        buffer = new Buffer(100);
        fs.readSync(fs.openSync(filePath, 'r'), buffer, 0, 100, 0)
        sign = [
            fileState.size,
            fileState.mtime.getTime().toString().substr(0, 10),
            crypto.createHash('md5').update(buffer).digest('hex'),
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
            });;
    })

    it('upload', (done) => {
        var headers = {}, formData;
        var filePath = path.resolve(__dirname, 'data.jpg');
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


        base.request({
            method: 'POST',
            host: '127.0.0.1',
            port: process.env.PORT,
            path: '/upload',
            headers: headers
        }, null, formData).then((data) => {
            done();
        }).catch((err) => {
            throw err;
        })
    })
})