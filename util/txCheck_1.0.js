"use strict";


module.exports = function check(_tx) {

    assert.isTrue(_tx['tx']!='', 'There should be transaction address');
    assert.isTrue(_tx['receipt']['transactionHash']!='', 'should have transaction receipt and tx hash');

};