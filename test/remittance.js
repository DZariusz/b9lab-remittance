var Remittance = artifacts.require("./Remittance.sol");

contract('Remittance', function(accounts) {

    var instance;

    var ME = accounts[0];
    var Alice = accounts[1];
    var Bob = accounts[2];
    var Carol = accounts[3];

    var pass = web3.sha3('pass-send-via-email');
    var bobSha = web3.sha3( Bob, {encoding: 'hex'} );
    var str = pass + bobSha.replace('0x', '');
    var id = web3.sha3( str, {encoding: 'hex'} );




  it("should NOT be able to get ether, when no transaction present", function() {
    return Remittance.deployed().then(function (instance) {


        instance.exchangeWithdraw.sendTransaction(pass, Bob, {from: Carol}).then(_success => {
            assert.isNotOk(false, 'not cool');
        }).catch (e => {
            //PASS
        });

    });
  });

  it("should throw, when not enough founds for commission fee", function() {
    return Remittance.deployed().then(function (instance) {

        instance.createTransfer.sendTransaction(pass, bobSha, {value: 1}).then(_success => {
            assert.isNotOk(false, 'did not throw');
        }).catch (e => {
            //PASS
        });

    });
  });




  it("should be able to accept transfer and give back ether for exchange when valid pass provided", function() {

        var val = web3.toWei(1, 'ether');
        var gasUsedForDeploy;
        var myStartBalance = web3.eth.getBalance(ME);
        var carolStartBalance = web3.eth.getBalance(Carol);

        var transfer;

        return Remittance.deployed().then(_instance => {

            instance = _instance;
            return instance.createTransfer.sendTransaction(pass, bobSha, {from: Alice, value: val});

        }).then(_success => {

            return instance.transfers.call(id);

        }).then(_transfer => {

            transfer = _transfer;
            //console.log('transfer: ', transfer);

            assert.isBelow(transfer[2].toNumber(), val, 'after apply commission, transfer amount should be less than send value');

            return instance.gasUsedForDeploy.call();

        }).then(_gasUsedForDeploy => {

          gasUsedForDeploy = _gasUsedForDeploy;

          return instance.withdraw.sendTransaction(pass, Bob, {from: Alice});

        }).then(_a => {
              assert.isNotOk(false, 'Alice can\'t withdraw before deadline.');
        }).catch(e => {
          //PASS
          return instance.withdraw.sendTransaction(pass, Bob, {from: Bob});
        }).then( _v => {
          assert.isNotOk(false, 'Bob can\'t withdraw even if he knew pass somehow.');
        }).catch( e => {
          //PASS
            return instance.withdraw.sendTransaction(pass, Bob, {from: Carol});
        }).then(_v => {
          assert.isNotOk(false, 'Carol should use `exchangeWithdraw`, not this.');
        }).catch( e => {
            //PASS

            return instance.exchangeWithdraw.sendTransaction(pass, Bob, {from: Carol});


        }).then(_success => {


            assert.isAbove(web3.eth.getBalance(Carol).toNumber(), carolStartBalance.toNumber(), 'Carol should be able to withdraw founds for exchange');
            assert.isAbove(web3.eth.getBalance(instance.contract.address).toNumber(), 0, 'ME should get commission');

            

        /*}).catch(e => {
            console.log(e); // */
        });

  });

});
