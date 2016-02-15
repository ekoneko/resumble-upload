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
    var fileInfo, fileExt, task;

    fileExt = path.extname(req.body.filename);
    
    res.set('Access-Control-Allow-Origin', '*');
    fileInfo = {
        filesize: +req.body.filesize,
        filename: req.body.filename,
        filesign: req.body.filesign,
        offset: +req.body.offset,
        chunksize: +req.body.chunksize
    }
    if (fileInfo.offset === 0 && fileInfo.filesize < fileInfo.chunksize && process.env.TINYSTORGE) {
        task = fileService.writeFile(path.resolve(process.env.TINYSTORGE, getTinyFileName()) + fileExt, req.files.data.path);
    } else {
        task = fileInfo.offset === 0 ? fileService.create(fileInfo) : fileService.find(fileInfo);
        task.then(function (data) {
            return fileService.writeFile(path.resolve(process.env.TMPDIR, data.path), req.files.data.path);
        })
    }
    task.then(function () {

    })
    // req.files.data.path
    res.send('success');
}