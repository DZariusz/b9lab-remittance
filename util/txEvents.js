"use strict";

/**
 *
 * @param _tx result of transaction
 * @param _event - name of event you are looking for
 * @param _print bool - if you want to print on the screen
 */
module.exports = function Event(_tx, _print, _event) {


    if (typeof _event == 'undefined') _event = false;

    var i = 0;
    var obj = {};


    // We can loop through result.logs to see if we triggered the Transfer event.
    for (; i < _tx.logs.length; i++) {


        var log = _tx.logs[i];
        var emit = false;

        if (!_event) emit = true;
        else if (_event && log.event == _event) {
            emit = true;
        }

        if (emit) {



                obj[log.event] = log.args;

            if (_print) {
                console.log("*****************************\nEvent: >>", log.event, '<<');
                console.log(log.args);
                console.log('_____________________________');
            }

        }
    }

    if (_print) {
        console.log("\t\t.----------------");
        console.log("\t\t| Events emitted:", i);
        console.log("\t\t`----------------");
    }

    return obj;

}