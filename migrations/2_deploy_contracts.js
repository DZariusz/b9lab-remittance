var Remittance = artifacts.require("./Remittance.sol");
var ExchangeLib = artifacts.require("./ExchangeLib.sol");

module.exports = function(deployer) {
    deployer.deploy(ExchangeLib);
    deployer.link(ExchangeLib, Remittance);
    deployer.deploy(Remittance);
};
