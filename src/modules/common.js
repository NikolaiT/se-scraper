function log(config, loglevel, msg = null, cb = null) {
    if (typeof loglevel != "number") {
        throw Error('loglevel must be numeric.');
    }

    if (loglevel <= config.debug_level) {
        if (msg) {
            if (typeof msg == 'object') {
                console.dir(msg, {depth: null, colors: false});
            } else {
                console.log('[i] ' + msg);
            }
        } else if (cb) {
            cb();
        }
    }
}

module.exports = {
    log: log,
};