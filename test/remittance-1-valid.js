var Remittance = artifacts.require("./Remittance.sol");


const txCheck = require("../util/txcheck.js");
const txEvents = require("../util/txEvents.js");



contract('Remittance', function(accounts) {

    var instance, _tx, _ev, id;

    var ME = accounts[0];
    var Alice = accounts[1];
    var Bob = accounts[2];
    var Carol = accounts[3];


    var gasUsedForDeploy;
    var carolStartBalance;


    var pass = 'pass-send-via-email';

    var val, transferFee, commissionFee, fees;

    var startTime = Date.now();


    beforeEach("create new Remittance instance", async () => {

        console.log('///////////////////////////-NEW-//////////////////////////////////////');

        instance = await Remittance.new({from: ME});
        id = await instance.hash.call(pass, Bob, Carol);
        transferFee = await instance.calculateFee.call();
        commissionFee = await instance.commissionFee.call();


        fees = transferFee.plus(commissionFee).toNumber();


        val = parseInt(web3.toWei(10, 'kwei')) + fees;


        console.log('Total fees:', web3.fromWei(fees, 'ether'), 'ETH');
        console.log('Val to send:', web3.fromWei(val, 'ether'), 'ETH');
        //var g =  await instance.gasUsedForDeploy.call();
        //console.log('gasUsedForDeploy:', g.toNumber());
        //console.log('gas price:', web3.eth.gasPrice.toNumber());

    });




    it("should be able to create transfer", async () => {

        _tx = await instance.createTransfer(id, startTime, Carol, {from: Alice, value: val});
        txCheck(_tx);

        _ev = txEvents(_tx);
        var a = _ev['LogCreatedTransfer']['_amount'];
        assert.isAbove(a.toNumber(), 0, 'transfer amount should be above 0');
        assert.equal(a.plus(transferFee).toNumber(), val, 'amount + fee should be equal to val ');

        var b = await instance.transfers.call(id);
        assert.equal(b[2].toNumber(), a.toNumber(), 'should have amount on blockchain');

    });



    it("should give back ether for exchange when valid pass provided", async () => {

        _tx = await instance.createTransfer(id, startTime, Carol, {from: Alice, value: val});
        txCheck(_tx);



        carolStartBalance = await web3.eth.getBalance(Carol);


        _tx = await instance.exchangeWithdraw(pass, Bob, 2, {from: Carol, gasPrice: 1});
        txCheck(_tx);

        var t = await instance.transfers.call(id);
        assert.equal(t[1], Carol, 'Carol should be set as exchanger');

        _ev = txEvents(_tx, 1);
        var ex = _ev['LogExchangeWithdraw']['_exchangeAmount'].toNumber();
        var c1 = _ev['LogExchangeWithdraw']['_commission'].toNumber();
        assert.equal(c1, commissionFee.toNumber(), 'should have the same value');

        var c2 = await instance.commissions.call();
        assert.equal(fees, c2.toNumber(), 'ME (contract) should get both fees');

        assert.equal(t[2].toNumber(), 0, 'should be 0 after withdraw');

        var CarolNew = await web3.eth.getBalance(Carol);

        assert.equal(CarolNew.toNumber(), carolStartBalance.minus(_tx.receipt.gasUsed).plus(ex).toNumber(), 'Carol should have be able to withdraw founds for exchange');




    });




});
