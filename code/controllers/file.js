var path = require('path');
require('date-format-lite');
var fileService = require('../services/file.js');

/**
 * generator a filename for tiny file
 */
var getTinyFileName = function () {
    var result, date = new Date();

    result = date.format('YYYY/MM/DD/hhmmssSS');
    result += Math.random().toString(36).substr(2, 6);
    return result;
}

/**
 * upload file
 */
this.upload = function (req, res, next) {
    var cacheService = require('../services/cache.js');

    var fileInfo, fileExt, task, destPath, destUrl, offset, error = '';

    fileExt = path.extname(req.body.filename);

    res.set('Access-Control-Allow-Origin', '*');
    fileInfo = {
        filesize: +req.body.filesize,
        filename: req.body.filename,
        filesign: req.body.filesign,
        offset: +req.body.offset,
        chunksize: +req.body.chunksize,
        comment: req.body.comment
    }

    if (fileInfo.offset === 0 && fileInfo.filesize < fileInfo.chunksize && process.env.TINYSTORAGEDIR) {
        /**
         * simple upload
         */
        destPath = path.resolve(process.env.TINYSTORAGEDIR, getTinyFileName()) + fileExt;
        destUrl = destPath.replace(process.env.TINYSTORAGEDIR, process.env.TINYSTORAGEURL);
        task = fileService.writeFile(destPath, req.files.data.path);
    } else {
        /**
         * upload with state storage
         */
        task = fileService.find(fileInfo).then(function (row) {
            var fileRow;
            /* if file exists and had uploaded */
            if (row && row.uploadsize === row.filesize) {
                destUrl = (process.env.STORAGEURL + row.path).replace(/\/+/g, '/');
                return
            }
            /* if file exists but not uploaded over */
            if (row && row.uploadsize !== fileInfo.offset) {
                offset = row.uploadsize;
                return;
            }
            return new Promise(function (resolve, reject) {
                /* create if not exists */
                row ? resolve(row) : fileService.create(fileInfo, req.access.id).then(function (row) {
                    resolve(row)
                });
            }).then(function (row) {
                if (!row) {
                    throw 'file not exists and create faield';
                }
                fileRow = row;
                destPath = path.resolve(process.env.TEMPDIR, fileRow.path);
                return fileService.countSize(destPath);
            }).then(function (size) {
                if (size !== fileInfo.offset) {
                    return size;
                }
                /* write file */
                return fileService.writeFile(destPath, req.files.data.path).then(function () {
                    return fileService.countSize(destPath);
                })
            }).then(function (size) {
                var tempPath;
                if (size === fileInfo.filesize) {
                    /**
                     * upload over
                     */
                    tempPath = destPath;
                    destPath = destPath.replace(process.env.TEMPDIR, '');
                    destUrl = process.env.STORAGEURL + destPath;
                    destPath = process.env.STORAGEDIR + destPath;
                    return fileService.moveFile(destPath, tempPath).then(function () {
                        return size;
                    })
                } else {
                    offset = size;
                    return size;
                }
            }).then(function (size) {
                return fileService.update({
                    uploadsize: size
                }, fileInfo);
            });
        })
    }
    task.then(function () {
        var result;
        if (!offset && !destUrl) {
            return res.send({state: false, offset: 0})
        }
        result = {state: true};
        if (offset) {
            result.offset = offset;
        } else {
            result.url = destUrl.replace(/\/+/g, '/');
        }
        res.send(result);
    }).catch(function (err) {
        console.error(err)
        res.status(500);
        if (err && err.message) err = err.message
        res.send(typeof err === 'string' ? err : 'upload failed');
    })
}
