var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var commonConfig = require(path.join(process.cwd(), 'configs', 'common'));
var _ = require('underscore');
var cache = require('./cache.js');
var db = require('./db.js');

var openFile = function (filePath, flag) {
    flag = flag || 'r';
    return new Promise(function (resolve, reject) {
        fs.open(filePath, flag, function (err, fd) {
            if (err) return reject(err);
            resolve(fd);
        })
    })
}

this.create = function (fileInfo) {
    // 
}

this.find = function (fileInfo) {
    // 
}

this.writeFile = function (destPath, srcPath, size) {
    return new Promise(function (resolve, reject) {
        var pathInfo = path.parse(destPath);
        mkdirp(pathInfo.dir, function (err) {
            err ? reject(err) : resolve();
        })
    }).then(function () {
        return Promise.all([
            openFile(destPath, 'w'),
            openFile(srcPath)
        ]);
    }).then(function (resolved) {
        var destFd = resolved[0],
            srcFd = resolved[1],
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
    })
}

this.checkVerify = function (filePath, size) {
    return new Promise(function (resolve, reject) {
        fs.stat(filePath, function (err, stats) {
            if (err) return reject(err);
            stats.size === size ? resolve() : resolve(stats.size)
        })
    })
}