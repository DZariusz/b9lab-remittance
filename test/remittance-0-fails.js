const Remittance = artifacts.require("./Remittance.sol");

const txCheck = require("../util/txcheck_1.0.js");
const txEvents = require("../util/txEvents_1.1.js");


const helper = require("../util/callFunctions");


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


        amount = fee.add(web3.toWei(10, 'kwei'));
        assert.isAbove(amount.toString(10), fee.toString(10), 'amount should be enough for fee');


        helper.setInstance(instance);
        helper.setAmount(amount.toString(10));


    });


    it("should THROW, when not enough founds for commission fee", async () => {

        await helper.createTransfer(alice, id, 1, fee, true);

    });


    it("should THROW, when the same passwords used twice", async () => {

        await helper.createTransfer(alice, id, 1, amount);
        await helper.createTransfer(alice, id, 1, amount, true);

    });



    it("should NOT be able to cancel transfer before deadline", async () => {

        await helper.createTransfer(alice, id, 10, amount);
        await helper.cancelTransfer(alice, id, true);


    });



    it("should NOT be able to exchange without correct pass", async () => {

        await helper.createTransfer(alice, id, 10, amount);
        await helper.doExchange(carol, emailPass, 'invalid-sms-pass', bob, true);


    });


});
