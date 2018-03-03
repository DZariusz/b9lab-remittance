const Remittance = artifacts.require("./Remittance.sol");

const txCheck = require("../util/txcheck_1.0.js");
const txEvents = require("../util/txEvents_1.1.js");


const helper = require("../util/callFunctions");
/*
const Promise = require('bluebird');


if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
} // */



contract('Remittance', function(accounts) {

    let instance;

    let  owner = accounts[0];
    let  alice = accounts[4];
    let  bob = accounts[5];
    let  carol = accounts[6];

    let  emailPass = 'pass-send-via-email' + Math.random();
    let  smsPass = 'pass-send-via-sms' + Math.random();

    let id, fee, amount, result;

    beforeEach("create new Remittance instance", async () => {


        instance = await Remittance.new({from: owner});

        id = await instance.hash.call(emailPass, smsPass, bob);
        fee = await instance.commissionFee.call();
        assert.isAbove(fee.toString(10), 0, 'we need commissions fee');

        //amount should be enough for fees
        amount = fee.add(fee).add(web3.toWei(10, 'kwei'));
        console.log(amount.toString(10));
        assert.isAbove(amount.toString(10), fee.toString(10), 'amount should be enough for fees');


        helper.setInstance(instance);
        helper.setAmount(amount.toString(10));


    });


    it("should give owner the fee", async () => {

        let balance1 = await instance.getBalance.call(owner);
        await helper.createTransfer(alice, id, 1, amount);
        let balance2 = await instance.getBalance.call(owner);

        assert.equal(balance2.minus(balance1).toString(10), fee.toString(10), 'invalid fee');


    });

    it("should ALLOW to do Exchange", async () => {

        await helper.createTransfer(alice, id, 1, amount);

        let balance1 = await instance.getBalance.call(carol);
        let ownerBalance1 = await instance.getBalance.call(owner);

        result = await helper.doExchange(carol, emailPass, smsPass, bob, 3);

        let balance2 = await instance.getBalance.call(carol);
        let ownerBalance2 = await instance.getBalance.call(owner);

        assert.equal(balance2.minus(balance1).toString(10), amount.minus(fee).minus(fee).toString(10), 'invalid balance on carol address');

        assert.equal(ownerBalance2.minus(ownerBalance1).toString(10), fee.toString(10), 'invalid balance on owner address');


    });


    it("should ALLOW to cancel", async () => {

        await helper.createTransfer(alice, id, 1, amount);

        let balance1 = await instance.getBalance.call(alice);

        //generate block number
        await helper.cancelTransfer(alice, id, true);
        //now we can cancel
        await helper.cancelTransfer(alice, id);

        let balance2 = await instance.getBalance.call(alice);


        assert.equal(balance2.minus(balance1).toString(10), amount.minus(fee).toString(10), 'invalid balance on alice address');


    });




});





