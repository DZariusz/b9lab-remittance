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

  it("should NOT be able to get ether, when no transaction present", function() {
    return Remittance.deployed().then(function (instance) {


        instance.exchangeWithdraw.sendTransaction(pass, Bob, {from: Carol}).then(_success => {
            assert.isNotOk(false, 'not cool');
        }).catch (e => {
            //PASS
            //console.log('catch for no transfer - PASS');
        });

    });
  });

  it("should throw, when not enough founds for commission fee", function() {
    return Remittance.deployed().then(function (instance) {

        instance.createTransfer.sendTransaction(id, {value: 1}).then(_success => {
            assert.isOk(false, 'did not throw');
        }).catch (e => {
            //PASS
            //console.log('catch for not enough founds - PASS');
        });

    });
  });




  it("should be able to create transfer", function() {



        return Remittance.deployed().then(_instance => {

            instance = _instance;
            return instance.createTransfer.sendTransaction(id, {from: Alice, value: val});

        }).then(_success => {

            assert.isOk(web3.eth.getTransactionReceipt( _success ), "Something wrong with `createTransfer()`");
            return instance.gasUsedForDeploy.call();

        }).then(_gasUsedForDeploy => {

          gasUsedForDeploy = _gasUsedForDeploy;

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

            return instance.transfers.call(id);

        }).then(_transfer => {

            assert.isBelow(_transfer[1].toNumber(), val, 'after apply commission, transfer amount should be less than send value');
            assert.isAbove(_transfer[1].toNumber(), 0, 'amount should be above 0');

        /*}).catch(e => {
            console.log(e); // */
        });

  });

  it("should give back ether for exchange when valid pass provided", function() {



        return Remittance.deployed().then(_instance => {

            carolStartBalance = web3.eth.getBalance(Carol);
            return instance.exchangeWithdraw.sendTransaction(pass, Bob, {from: Carol});


        }).then(_success => {

            assert.isAbove(web3.eth.getBalance(Carol).toNumber(), carolStartBalance.toNumber(), 'Carol should be able to withdraw founds for exchange');
            assert.isAbove(web3.eth.getBalance(instance.contract.address).toNumber(), 0, 'ME (contract) should get commission');



        /*}).catch(e => {
            console.log(e); // */
        });

  });


});
