pragma solidity ^0.4.11;

import "./ExchangeLib.sol";
import "./Killable.sol";


contract Remittance is Killable {

    uint public gasUsedForDeploy; //this is how much was used for deploy

    uint deadline = 1 days;


    struct TransferData {
        address sender;       //creator of the transfer eg. Alice
        address exchanger;    //eg. Carol
        uint amount;
        uint deadlineDate;  //after this date Alice can withdraw
    }

    //the KEY of the structure will be hash: keccak256(pass + Bob_address)
    mapping(bytes32 => TransferData) public transfers;

    mapping(bytes32 => bool) public usedPass;


    function() public {}

    function Remittance()
    public
    {
        owner = msg.sender;
        //this is gas used for deploy + constructor
        gasUsedForDeploy = block.gaslimit - msg.gas;
    }



    /// @return transfer value = msg.value - commission
    function calculateTransferValue()
        private
        returns (uint valueToTransfer)
    {
        // I want fee that is half of deploing cost
        uint ownerCommissionPrice = gasUsedForDeploy * tx.gasprice * 5 / 10;

        //do you have enough for fee?
        require(msg.value > ownerCommissionPrice);

        return msg.value - ownerCommissionPrice;
    }


    /// @param id should be keccak256(pass + Bob address)
    function createTransfer(bytes32 id, address exchanger)
        public
        payable
        onlyIfRunning
        returns (bool success)
    {
        //do not allow new transaction if old one is pending
        require( !usedPass[ id ] );
        require( transfers[ id ].amount == 0);
        require( exchanger != 0);

        transfers[ id ].amount = calculateTransferValue();
        transfers[ id ].sender = msg.sender;
        transfers[ id ].exchanger = exchanger;
        transfers[ id ].deadlineDate = now + deadline; //i know this will be base on block time

        LogCreatedTransfer(msg.sender, exchanger, id, transfers[ id ].amount);



        return true;

    }



    /// @param pass bytes32 that was send by email
    /// @param bob address works like second pass, but here its to confirm, which payment to withdraw
    function exchangeWithdraw (string pass, address bob)
        public
        onlyIfRunning
        returns (bool success)
    {

        bytes32 id = keccak256( pass, bob );
        
        //throw if no data
        require( transfers[ id ].amount != 0 );
        require( msg.sender == transfers[ id ].exchanger );

        usedPass[ id ] = true;

        //I assume, that we should send Carol all the amount, but she needs to know how much give to Bob and how much is commission
        var (exchange, commission) = ExchangeLib.convert(transfers[ id ].amount, 3, 1);
        LogExchangeWithdraw(exchange, commission);

        return doTransfer(id, msg.sender);
    }

    /// @param id should be keccak(pass + recipient)
    function withdraw(bytes32 id)
        public
        onlyIfRunning
        returns (bool success)
    {

        //throw if no data
        require( transfers[ id ].amount != 0 );

        //only creator of transfer can withdraw its funds
        require( transfers[ id ].sender == msg.sender );
        //and only after deadline
        require( transfers[ id ].deadlineDate < now );

        return doTransfer(id, msg.sender);

    }


    function doTransfer (bytes32 id, address toWhom)
    private
    returns (bool success)
    {
        //this should be checked already before call this function
        //require( transfers[ id ].amount != 0 );

        uint a = transfers[ id ].amount;
        transfers[ id ].amount = 0;

        //send ether to user who will exchange
        toWhom.transfer( a );

        //in order to safe gass, I can remove `delete`, since I will be checking only `.amount` anyway
        //delete transfers[ id ];

        LogTransfer(toWhom, a);

        return true;
    }

    event LogCreatedTransfer(address _sender, address _exchanger, bytes32 _id, uint _amount);
    event LogTransfer(address _recipient, uint _amount);
    event LogExchangeWithdraw(uint _exchangeAmount, uint _commission);
    event LogTurnOff(bool _outOfOrder);

}
