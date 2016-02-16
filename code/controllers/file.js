var path = require('path');
require('date-format-lite');
var fileService = require('../services/file.js');

var getTinyFileName = function () {
    var result, date = new Date();

    result = date.format('YYYY/MM/DD/hhmmssSS');
    result += Math.random().toString(36).substr(2);
    return result;
}

this.upload = function (req, res, next) {
    var fileInfo, fileExt, task, destPath, offset;

    fileExt = path.extname(req.body.filename);
    
    res.set('Access-Control-Allow-Origin', '*');
    fileInfo = {
        filesize: +req.body.filesize,
        filename: req.body.filename,
        filesign: req.body.filesign,
        offset: +req.body.offset,
        chunksize: +req.body.chunksize
    }

    if (fileInfo.offset === 0 && fileInfo.filesize < fileInfo.chunksize && process.env.TINYSTORAGEDIR) {
        destPath = path.resolve(process.env.TINYSTORAGEDIR, getTinyFileName()) + fileExt;
        task = fileService.writeFile(destPath, req.files.data.path, fileInfo.chunksize);
    } else {
        task = fileInfo.offset === 0 ? fileService.create(fileInfo) : fileService.find(fileInfo);
        task.then(function (data) {
            destPath = path.resolve(process.env.TMPDIR, data.path);
            return fileService.checkVerify(destPath, fileInfo.offset).then(function (resolved) {
                if (resolved !== undefined) {
                    res.status(200);
                    res.send({
                        state: false,
                        offset: resolved
                    })
                    res.end();
                    throw 'file size not match'
                }
            })
        }).then(function () {
            return fileService.writeFile(destPath, req.files.data.path, fileInfo.filesize).then(function () {
                return fileService.checkVerify(destPath, fileInfo.filesize)
            }).then(function (resolved) {
                var promise;
                if (resolved === undefined) {
                    storagePath = destPath.replace(process.env.TMPDIR, process.env.STORAGEDIR);
                    promise = fileService.moveFile(storagePath, destPath);
                    destPath = storagePath;
                    return promise;
                } else {
                    offset = resolved;
                }
            })
        })
    }
    task.then(function (resolved) {
        var result = {state: true};
        offset ? result.offset = offset : result.path = destPath;
        res.send(result);
    }).catch(function (err) {
        res.status(500);
        res.send(typeof err === 'string' ? err : 'create token error');
    })
    
}