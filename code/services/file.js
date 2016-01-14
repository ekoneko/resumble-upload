var path = require('path');
var fs = require('fs');
var md5 = require('MD5');
var uint8 = require('uint8');
var chunkSize = 10485760;
var db = require('./db.js').getInstance();
var mkdirp = require('mkdirp');
var commonConfig = require(path.join(process.cwd(), 'configs', 'common'));
var _ = require('underscore');
var redis = require('./cache.js');

/**
 * @key id
 * @param file
 * @param time  // last search time
 * @param data  // row
 */
var cacheStack = {};

/**
 * get md5 and filesize
 */
// this.getInfo = function (filePath) {
//     return new Promise(function (resolve, reject) {
//         var spark = new SparkMD5.ArrayBuffer();
//         openFile(filePath)
//             .then(readFileChunk)
//             .then(function (param) {
//                 resolve({
//                     md5: param.md5,
//                     size: stats.size
//                 });
//                 fs.close(fd);
//             })
//             .catch(function (err) {
//                 throw err;
//             });
//     });
// }

this.writeFile = function (destPath, srcPath, size) {
    var buffer = new Buffer(size);
    return Promise.all([
        openFile(destPath, 'a'),
        openFile(srcPath, 'r')
    ]).then(function (res) {
        var destFd = res[0],
            srcFd = res[1];

        return new Promise(function (resolve, reject) {
            fs.read(srcFd, buffer, 0, size, 0, function (err, bytesRead, buffer) {
                if (err) {
                    return reject(err);
                }
                fs.write(destFd, buffer, 0, size, function (err, written, buffer) {
                    fs.close(srcFd, function () {
                        setTimeout(function () {
                            try {
                                fs.existsSync(srcPath) && fs.unlink(srcPath);
                            } catch (e) {
                                console.error('Delete file ' + srcPath + ' error!')
                            }
                        }, 100);
                    });
                    fs.closeSync(destFd);
                    if (err) {
                        return reject(err);
                    }
                    resolve();
                });
            });
        });
    });
}

this.create = function (data) {
    var row, ext;
    return new Promise(function (resolve, reject) {
        var date = new Date();
        var realPath = path.join(date.getFullYear().toString(), date.getMonth() + 1 + '-' + date.getDate());

        mkdirp(path.join(commonConfig.tmpDir, realPath), function (err) {
            if (err) {
                reject('create dir failed');
            }
            data.path = '';
            db.model('file').create(data).then(function (res) {
                if (!res || !res.dataValues) {
                    return reject('create failed');
                }
                row = res.dataValues;
                row.path = path.join(realPath, md5(res.id + data.file)) + path.extname(data.file);

                return db.model('file').update({
                    path: row.path
                }, {
                    where: {id: row.id},
                    limit: 1
                });
            }).then(function () {
                return redis.set(row.id, {
                    file: row.file,
                    time: Date.now(),
                    data: row
                });
            }).then(function () {
                resolve(row);
            })
        });
    });
}

this.findOne = function (where) {
    return new Promise(function (resolve, reject) {
        db.model('file').findOne({
            where: where
        }).then(function (res) {
            if (!res || !res.dataValues) {
                return reject('no match file');
            }
            resolve(res.dataValues);
        })
    });
}

this.queryUploadProgress = function (id, file) {
    return new Promise(function (resolve, reject) {
        redis.get(id).then(function (row) {
            if (!row) {
                module.exports.findOne({id: id, file: file}).then(function (data, rejected) {
                    if (rejected) {
                        return reject(rejected);
                    }
                    row = {
                        file: file,
                        time: Date.now(),
                        data: data
                    };
                    redis.set(id, row).then(function () {
                        resolve(row.data);
                    });
                });
                return;
            }
            if (row.file !== file) {
                return reject('no match file');
            }
            row.time = Date.now()
            redis.set(id, row);
            resolve(row.data);
        });
    });
}

this.update = function (data, where) {
    return new Promise(function (resolve, reject) {
        db.model('file').update(data, {
            where: where,
            limit: 1
        }).then(function (res) {
            resolve();
        })
    });
}

this.updateCache = function (data, id) {
    return new Promise(function (resolve, reject) {
        redis.get(id).then(function (row) {
            if (!row) {
                return reject('cache not found');
            }
            row.data.uploadsize = data.uploadsize;
            row.time = Date.now();
            redis.set(id, row).then(function () {
                if (+row.data.uploadsize === +row.data.filesize) {
                    finishUpload(id);
                }
                resolve(row.data);
            }).catch(function (err) {
                reject(err);
            })
        });
    });
}

this.restoreCacheStack = function (id) {
    return new Promise(function () {
        var data;
        redis.get(id).then(function (row) {
            if (!row) {
                return resolve();
            }
            module.exports.update({
                uploadsize: row.data.uploadsize,
                path: row.data.path
            }, {
                id: id
            }).then(function () {
                redis.remove(id);
                resolve();
            });
        });
    });
}

this.destroy = function (id) {
    return new Promise(function (resolve, reject) {
        db.model('file').destroy({
            where: {id: id}
        });
    });
}

/**
 * 每次 register 时检测缓存中的内容在数据库中是否存在
 */
this.checkDatabase = function (row) {
    return new Promise(function (resolve, reject) {
        module.exports.findOne({id: row.id}).then(function (data) {
            (!data || !data.dataValues) ? resolve() : resolve(row);
        }).catch(function (err) {
            resolve();
        });
    });
}

/**
 * 将上传内容置为空
 */
this.reset = function (fid, path) {
    var promises = [];
    promises.push(module.exports.updateCache({
        uploadsize: 0
    }, fid));
    path && promises.push(deleteFile(path));
    return Promise.all(promises);
}

function openFile (filePath, flag) {
    flag = flag || 'r';
    return new Promise(function(resolve, reject) {
        fs.open(filePath, flag, function (err, fd) {
            if (err) {
                return reject(err);
            }
            resolve(fd);
        })
    });
}

function getFileState (fd) {
    return new Promise(function(resolve, reject) {
        fs.fstat(fd, function (err, stats) {
            if (err) {
                return reject(err);
            }
            resolve(stats);
        });
    });
}

function finishUpload (id) {
    return new Promise(function (resolve, reject) {
        redis.get(id).then(function (row) {
            var parsePath = path.parse(row.data.path);
            var destPath = path.join(commonConfig.storgeDir, parsePath.dir);
            var srcPath = path.join(commonConfig.tmpDir, parsePath.dir);

            mkdirp(destPath, function (err) {
                if (err) {
                    return reject(err);
                }
                fs.rename(
                    path.join(srcPath, parsePath.base),
                    path.join(destPath, parsePath.base),
                    function (err) {
                        if (err) {
                            return reject(err);
                        }
                        module.exports.restoreCacheStack(id);
                        resolve();
                    }
                );
            });
        });
    });
}

function deleteFile (filePath) {
    return new Promise(function (resolve, reject) {
        fs.unlink(filePath, function (err) {
            resolve();
        });
    });
}