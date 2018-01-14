var Remittance = artifacts.require("./Remittance.sol");

const txCheck = require("../util/txcheck.js");
const txEvents = require("../util/txEvents.js");


contract('Remittance', function(accounts) {

    var instance;

    var ME = accounts[0];
    var Alice = accounts[4];
    var Bob = accounts[5];
    var Carol = accounts[6];

    var pass = 'pass-send-via-email';

    var val, fee, commissionFee;
    var id, _tx;

    var startTime = Date.now();


    beforeEach("create new Remittance instance", async () => {


        instance = await Remittance.new({from: ME});
        id = await instance.hash.call(pass, startTime, Carol);
        fee = await instance.calculateFee.call();
        commissionFee = await instance.commissionFee.call();

        //console.log("FEE:",fee.toString());
        fee = fee.plus(commissionFee).toNumber();


        val = parseInt(web3.toWei(10, 'kwei')) + fee;


        //console.log('Fee:', web3.fromWei(fee, 'ether'), 'ETH');
        //console.log('Val to send:', web3.fromWei(val, 'ether'), 'ETH');
        //var g =  await instance.gasUsedForDeploy.call();
        //console.log('gasUsedForDeploy:', g.toNumber());
        //console.log('gas price:', web3.eth.gasPrice.toNumber());

    });


    it("should throw, when not enough founds for commission fee", async () => {


        //this should Pass, since we sent +1 more than a fee
        _tx = await instance.createTransfer(id, startTime, Carol, {value: (fee + 10), from: Alice});
        txCheck(_tx);

        var ev = txEvents(_tx);
        assert.isAbove(ev['LogCreatedTransfer']['_amount'].toNumber(), 0, 'transfer amount should be above 0');


        //need new pass
        id = await instance.hash.call(pass + '123', startTime, Carol);

        try {
            await instance.createTransfer(id, startTime, Carol, {value: fee, from: Alice});
            assert.isTrue(false, 'should throw');

        } catch (_e) {
            //PASS
            console.log('should throw, when not enough founds for commission fee - PASS');
        } // */

    });



    it("should NOT be able to withdraw before deadline", async () => {


        _tx = await instance.createTransfer(id, startTime, Carol, {value: val, from: Alice});
        txCheck(_tx);

        try {
            _tx = await instance.withdraw(id, {from: Alice});
            assert.isTrue(false, 'should throw');

        } catch (_e) {
            //PASS
            console.log('should NOT be able to withdraw before deadline - PASS');
        };

    }); // */



    it("should NOT be able to create another transfer with the same password", async () => {

        var b = await instance.transfers.call(id);
        assert.isFalse(b[4], 'pass is already in use');

        _tx = await instance.createTransfer(id, startTime, Carol, {value: val, from: Alice});
        txCheck(_tx);

        try {
            _tx = await instance.createTransfer(id, startTime, Carol, {value: val, from: Alice});
            assert.isTrue(false, 'did not throw');

        } catch (_e) {
            //PASS
            console.log('should NOT able to create another transfer with the same - PASS');
        };


    }); // */


});
