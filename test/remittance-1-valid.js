const Remittance = artifacts.require("./Remittance.sol");

const txCheck = require("../util/txcheck_1.0.js");
const txEvents = require("../util/txEvents_1.1.js");


const helper = require("../util/callFunctions");

const Promise = require('bluebird');


if (typeof web3.eth.getBlockPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}



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
        amount = fee.add(web3.toWei(0.1, 'ether'));
        assert.isAbove(amount.minus(fee).toString(10), 0, 'amount should be enough for fees');


        helper.setInstance(instance);
        helper.setAmount(amount.toString(10));


    });


    it("should give owner the fee", async () => {

        let balance1 = await instance.balances.call(owner);
        await helper.createTransfer(alice, id, 1, amount);
        let balance2 = await instance.balances.call(owner);

        assert.equal(balance2.minus(balance1).toString(10), fee.toString(10), 'invalid owner balance');


    });

    it("should ALLOW to do Exchange", async () => {

        await helper.createTransfer(alice, id, 1, amount);

        let balance1 = await web3.eth.getBalancePromise(carol);

        result = await helper.doExchange(carol, emailPass, smsPass, bob);

        let balance2 = await web3.eth.getBalancePromise(carol);


        assert.equal(amount.minus(fee).minus(result['exchangedAmount']).toNumber(), 0, 'invalid amount');

        assert.isAbove(balance2.minus(balance1).toString(10), 0, 'carol balance2 should be higher than balance1');
        //should be below because carol used some gas for transaction
        assert.isBelow(balance2.minus(balance1).minus(result['exchangedAmount']).toString(10), 0, 'invalid balance on carol address');


    });


    it("should ALLOW to cancel", async () => {

        await helper.createTransfer(alice, id, 1, amount);

        let balance1 = await web3.eth.getBalancePromise(alice);

        //generate next block, so we  can cancel - this one should throw
        await helper.cancelTransfer(alice, id, true);

        //now we can cancel
        await helper.cancelTransfer(alice, id);

        let balance2 = await web3.eth.getBalancePromise(alice);

        assert.isAbove(balance2.minus(balance1).toString(10), 0, 'alice balance2 invalid');
        assert.isBelow(balance2.minus(balance1).minus(amount).plus(fee).toString(10), 0, 'invalid balance on alice address');


    });




});





