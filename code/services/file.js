require('date-format-lite');
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var commonConfig = require(path.join(process.cwd(), 'configs', 'common'));
var _ = require('underscore');
var cache = require('./cache.js');
var db = require('./db.js').getInstance();

var cacheExpireTime = 600;

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
        var data = res ? res.dataValues : undefined;
        if (data) {
            return cache.set(fileInfo.filesign, data, cacheExpireTime).then(function () {
                return data;
            });
        }
    })
}

this.find = function (fileInfo) {
    return cache.get(fileInfo.filesign).then(function (data) {
        if (!data) {
            return db.model('file').findOne({
                where: {file: fileInfo.filesign}
            }).then(function (res) {
                data = res ? res.dataValues : undefined;
                if (data) {
                    return cache.set(fileInfo.filesign, data, cacheExpireTime);
                }
            }).then(function () {
                return data;
            });
        }
        return data;
    })
    
}

this.update = function (updateData, fileInfo) {
    var data;
    return cache.get(fileInfo.filesign).then(function (cacheData) {
        if (!cacheData) return;
        data = _.extend(cacheData, updateData);
        if (updateData.uploadsize && data.uploadsize >= data.filesize) {
            return Promise.all([
                db.model('file').update(data, {
                    where: {id: data.id},
                    limit: 1
                }),
                cache.remove(fileInfo.filesign)
            ]);
        } else {
            return cache.set(fileInfo.filesign, data, cacheExpireTime);
        }
    }).then(function () {
        return data;
    });
}

this.updateUploadSize = function (sign) {
    db.model('file').findOne({
        where: {file: sign}
    }).then(function (row) {
        var uploadSize, filePath = path.resolve(process.env.TEMPDIR, row.dataValues.path);
        if (!fs.existsSync(filePath)) return;
        uploadSize = fs.lstatSync(filePath).size;
        return row.set('uploadsize', uploadSize).save();
    })
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