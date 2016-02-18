require('date-format-lite');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var commonConfig = require(path.join(process.cwd(), 'configs', 'common'));
var _ = require('underscore');
var cache = require('./cache.js');
var db = require('./db.js').getInstance();

/**
 * @key sign
 * @param file
 * @param time  // last search time
 * @param data  // row
 */
var cacheStack = {};

var openFile = function (filePath, flag) {
    flag = flag || 'r';
    return new Promise(function (resolve, reject) {
        fs.open(filePath, flag, function (err, fd) {
            if (err) return reject(err);
            resolve(fd);
        })
    })
}

this.create = function (fileInfo, appid) {
    return db.model('file').create({
        appid: appid,
        file: fileInfo.filesign,
        filemd5: '',
        filesize: fileInfo.filesize,
        uploadsize: 0,
        path: path.join((new Date()).format('YYYY/MM/DD'), path.basename(fileInfo.filesign)),
        comment: fileInfo.comment || '',
    }).then(function (res) {
        return res ? res.dataValues : undefined;
    })
}

this.find = function (fileInfo) {

    return db.model('file').findOne({
        where: {file: fileInfo.filesign}
    }).then(function (res) {
        return res ? res.dataValues : undefined;
    });
}

this.update = function (data, id) {
    return db.model('file').update(data, {
        where: {id: id},
        limit: 1
    });
}

this.writeFile = function (destPath, srcPath) {
    return new Promise(function (resolve, reject) {
        var pathInfo = path.parse(destPath);
        mkdirp(pathInfo.dir, function (err) {
            err ? reject(err) : resolve();
        })
    }).then(function () {
        return Promise.all([
            openFile(destPath, 'a'),
            openFile(srcPath)
        ]);
    }).then(function (resolved) {
        var destFd = resolved[0],
            srcFd = resolved[1],
            size, buffer;

        size = fs.fstatSync(srcFd).size;
        buffer = new Buffer(size);

        return new Promise(function (resolve, reject) {
            fs.read(srcFd, buffer, 0, size, 0, function (err, bytesRead, buffer) {
                if (err) return reject(err);
                fs.write(destFd, buffer, 0, size, function (err, written, buffer) {
                    fs.close(srcFd, function () {
                        setTimeout(function () {
                            try {
                                fs.existsSync(srcPath) && fs.unlink(srcPath);
                            } catch (e) {
                                console.error('Delete file ' + srcPath + ' error!')
                            }
                        }, 10);
                    });
                    fs.closeSync(destFd);
                    err ? reject(err) : resolve();
                });
            });
        });
    });
}

this.moveFile = function (destPath, srcPath) {
    return new Promise(function (resolve, reject) {
        var pathInfo = path.parse(destPath);
        mkdirp(pathInfo.dir, function (err) {
            if (err) reject(err)
            fs.rename(srcPath, destPath, function (err) {
                err ? reject(err) : resolve();
            });
        })
    })
}

this.countSize = function (filePath) {
    return new Promise(function (resolve, reject) {
        if (!fs.existsSync(filePath)) return resolve(0);
        fs.stat(filePath, function (err, stats) {
            if (err) return reject(err);
            resolve(stats.size)
        })
    })
}