"use strict";


module.exports = function Event(_tx, _print, _event) {


    if (typeof _event == 'undefined') _event = false;
    if (typeof _print == 'undefined') _print = false;

    let i = 0,
        obj = {},
        log;


    // We can loop through result.logs to see if we triggered the event.
    for (; i < _tx.logs.length; i++) {


        log = _tx.logs[i];
        obj[log.event] = log.args;


        if (_event && log.event == _event) {
            obj = log.args;
        } else if (!_event) {
            obj[log.event] = log.args;
        }


        if (_print) {
            console.log("\nEvent: >>", log.event, '<<');
            console.log(log.args);
            console.log('_____________________________');
        }

    }

    return obj;

};