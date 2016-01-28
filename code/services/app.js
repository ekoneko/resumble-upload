var db = require('./db.js').getInstance();

this.create = function (name) {
    var secret = Math.random().toString(36).slice(2, 18);
    return db.model('app').create({
        name: name,
        secret: secret
    });
}

this.find = function (id) {
    // TODO: cache
    if (id === 0) {
        return new Promise(function (resolve, reject) {
            resolve({
                id: 0,
                name: 'test',
                secret: '123456'
            })
        });
    }
    return db.model('app').findOne({
        where: {
            id: id
        }
    }).then(function (res) {
        return res ? res.dataValues : undefined;
    });
}