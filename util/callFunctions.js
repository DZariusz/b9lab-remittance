"use strict";

const txCheck = require("../util/txcheck_1.0");
const txEvents = require("../util/txEvents_1.1");

let instance;
let amount;

let _tx, _ev;


function printReturnCatch(_e, expectThrow) {
    let revert = _e.message.indexOf('revert') !== -1;


    if (typeof expectThrow =='undefined') expectThrow = false;

    if (expectThrow && revert) {
        //console.log(_e.message);
        return -1;
    }

    assert.isTrue(false, _e.message);
    console.error(_e);

    return -2;

}

module.exports = {


    setInstance: function(i) { instance = i },
    setAmount: function(a) { amount = a },


    createTransfer: async function (sender, hash, deadline, a, expectThrow) {


        try {
            _tx = await instance.createTransfer(hash, deadline, {from: sender, value: a});
        } catch (_e) {
            return printReturnCatch(_e, expectThrow);
        }

        if (expectThrow) assert.isFalse(true, 'expected to throw but did not');

        txCheck(_tx);

        return txEvents(_tx, true, 'LogCreatedTransfer');

    },


    //doExchange(string emailPass, string smsPass, address bob, uint8 conversionRate)
    doExchange: async function(sender, emailPass, smsPass, bob, expectThrow) {

        try {
            _tx = await instance.doExchange(emailPass, smsPass, bob, {from: sender});
        } catch (_e) {
            return printReturnCatch(_e, expectThrow);
        }

        if (expectThrow) assert.isFalse(true, 'expected to throw but did not');

        txCheck(_tx);
        return txEvents(_tx, true, 'LogDoExchange');



    },


    cancelTransfer: async function(sender, id, expectThrow) {

        try {
            _tx = await instance.cancelTransfer(id, {from: sender});
        } catch (_e) {
            return printReturnCatch(_e, expectThrow);
        }

        if (expectThrow) assert.isFalse(true, 'expected to throw but did not');

        txCheck(_tx);

        return txEvents(_tx, true, 'LogCancelTransfer');


    },



    getTransfer: async function(id) {
        let data = await instance.transfers(id);
        let i = 0;
        return {
            amount: data[i++],
            deadlineBlock: data[i++],
            sender: data[i++],
            usedPass: data[i++],
            done: data[i++]
        }
    }



};