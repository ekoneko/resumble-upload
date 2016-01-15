this.ping = function (req, res, next) {
    res.set('Access-Control-Allow-Origin', '*');
    res.send('pong');
}
