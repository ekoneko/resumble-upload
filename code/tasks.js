var path = require('path');
var redis = require('redis');
var fileService = require('./services/file.js');
var cacheClient;

var redisInit = function () {
    var configs = require(path.join(process.cwd(), 'configs', 'redis'));
    return new Promise(function (resolve, reject) {
        cacheClient = redis.createClient(configs.port, configs.host, configs.options);
        resolve();
    });
}

var checkVersion = function () {
    return new Promise(function (resolve, reject) {
        cacheClient.info(function (err, data) {
            var match, version
            if (err) return reject(err);
            match = data.match(/\sredis_version:([\w\.]+)/);
            if (!match) return reject('get redis version failed');
            version = Number(match[1].split('.').slice(0, 2).join('.'))
            version < 2.8 ? reject('redis version lower than 2.8') : resolve();
        });
    });
}

var configure = function () {
    return new Promise(function (resolve, reject) {
        cacheClient.config('get', 'notify-keyspace-events', function (err, data) {
            var keySpaceEvents;
            if (err) return reject(err);
            keySpaceEvents = data.length ? data[1] : '';
            if (keySpaceEvents.indexOf('K') === -1) {
                keySpaceEvents += 'K';
            }
            if (keySpaceEvents.indexOf('A') === -1 || keySpaceEvents.indexOf('x') === -1) {
                keySpaceEvents += 'x';
            }
            cacheClient.config('set', 'notify-keyspace-events', keySpaceEvents, function (err) {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

var subscribe = function () {
    var subscribePrefix = '__keyspace@' + (process.env.REDISDB || 0) + '__:' + process.env.REDISPREFIX;
    cacheClient.on('pmessage', function (channel, key, method) {
        var sign;
        if (channel !== subscribePrefix + '*') return;
        if (method !== 'expired') return;
        sign = key.replace(subscribePrefix, '');
        fileService.updateUploadSize(sign);
    });
    cacheClient.psubscribe(subscribePrefix + '*')
}

redisInit()
.then(checkVersion)
.then(configure)
.then(subscribe)
.catch(function (err) {
    throw err;
    process.exit();
})