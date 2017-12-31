var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {

    var instance;

    var ME = accounts[0];
    var Alice = accounts[1];
    var Bob = accounts[2];
    var Carol = accounts[3];

    var pass = 'pass-send-via-email' + Math.random();
    var str = web3.toHex(pass) + Bob.replace('0x', '');
    var id = web3.sha3( str,  {encoding: 'hex'} );

    var val = web3.toWei(1, 'ether');
    var gasUsedForDeploy;
    var carolStartBalance;



    //console.log('pass: ', pass);
    //console.log('ID: ', id);


  it("should throw, when not enough founds for commission fee", function() {
    return Remittance.deployed().then(function (_instance) {

        instance = _instance;
        instance.createTransfer.sendTransaction(id, Carol, {value: 1}).then(_success => {
            assert.isOk(false, 'did not throw');
        }).catch (e => {
            //PASS
            //console.log('catch for not enough founds - PASS');
        });

    });
  });



  it("should be able to create transfer", function() {

        return Remittance.deployed().then(_instance => {

            return instance.createTransfer.sendTransaction(id, Carol, {from: Alice, value: val});

        }).then(_success => {

            assert.isOk(_success, "Something wrong with `createTransfer()`");
            assert.isOk(web3.eth.getTransactionReceipt( _success ), "Something wrong with `createTransfer()`");


        });

  });

  it("should NOT able to withdraw before deadline", function() {


        return Remittance.deployed().then(_instance => {

            return instance.withdraw.sendTransaction(id, {from: Alice});

        }).then(_a => {
              assert.isOk(false, 'Alice can\'t withdraw before deadline.');
        }).catch(e => {
          //PASS
            //console.log('catch for Alice withdraw throw - PASS');
        });

  }); // */


  it("should have transfer with id="+id+" with some founds on it ", function() {


        return Remittance.deployed().then(_instance => {

            gasUsedForDeploy = instance.contract.gasUsedForDeploy();
            transfer = instance.contract.transfers(id);

            //console.log( transfer );
            assert.isBelow(transfer[2].toNumber(), val, 'after apply commission, transfer amount should be less than send value');
            assert.isAbove(transfer[2].toNumber(), 0, 'amount should be above 0');

        });

  });


  it("should give back ether for exchange when valid pass provided", function() {


        return Remittance.deployed().then(_instance => {

            carolStartBalance = web3.eth.getBalance(Carol);
            return instance.exchangeWithdraw.sendTransaction(pass, Bob, {from: Carol});


        }).then(_success => {

            assert.isAbove(web3.eth.getBalance(Carol).toNumber(), carolStartBalance.toNumber(), 'Carol should be able to withdraw founds for exchange');
            assert.isAbove(web3.eth.getBalance(instance.contract.address).toNumber(), 0, 'ME (contract) should have commission');

        });

  });




    it("should NOT able to create another transfer with the same PASS", function() {

        return Remittance.deployed().then(_instance => {

            return instance.createTransfer.sendTransaction(id, Carol, {from: Alice, value: val});

        }).then(_success => {

            assert.isTrue(false, "should throw because we used the same pass`");


        }).catch(_e => {
            //PASS
        });

    });


});
