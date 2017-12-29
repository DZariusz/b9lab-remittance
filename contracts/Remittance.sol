pragma solidity ^0.4.11;

import "./ExchangeLib.sol";

contract Remittance {

    uint public gasUsedForDeploy; //this is how much was used for deploy

    address owner;
    uint deadline = 1 days;


    bool outOfOrder = false;

    struct TransferData {
        address sender;     //creator of the transfer eg. Alice
        uint amount;
        uint deadlineDate;  //after this date Alice can withdraw
    }

    //the KEY of the structure will be hash  -> keccak256(pass + recipient_address) => struct
    //this solution has issue:
    //we either cant do multiple transactions for the same key
    //OR we need to combine them, but we should keep it narrow so.. it is narrow :)
    mapping(bytes32 => TransferData) public transfers;

    modifier onlyIfRunning {
        require( !outOfOrder );
        _;
    }



    function() public {}

    function Remittance()
    public
    {
        owner = msg.sender;
        //this is gas used for deploy + constructor
        gasUsedForDeploy = block.gaslimit - msg.gas;
    }


    function turnOff()
    public
    onlyIfRunning
    returns (bool)
    {
        assert( msg.sender == owner );
        outOfOrder = true;
        LogTurnOff( outOfOrder );
        return true;
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


    /**
     * Alice create a transfer and he pa
     */
    /// @param id should be keccak256(pass + recipient)
    function createTransfer(bytes32 id)
        public
        payable
        onlyIfRunning
        returns (bool success)
    {
        //do not allow new transaction if old one is pending
        require( transfers[ id ].amount == 0);

        transfers[ id ].amount = calculateTransferValue();
        transfers[ id ].sender = msg.sender;
        transfers[ id ].deadlineDate = now + deadline; //i know this will be base on block time

        LogCreatedTransfer(msg.sender, id, transfers[ id ].amount);



        return true;

    }



    function doTransfer (bytes32 id, address toWhom)
        private
        returns (bool success)
    {
        //this should be checked already
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


    /// @param pass bytes32 that was send by email
    /// @param recipient address works like second pass, but here its to confirm, which payment to withdraw
    function exchangeWithdraw (string pass, address recipient)
        public
        onlyIfRunning
        returns (bool success)
    {

        bytes32 id = keccak256( pass, recipient );
        
        //throw if no data
        require( transfers[ id ].amount != 0 );


        //sender need to use `withdraw()`
        require( transfers[ id ].sender != msg.sender  );

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

    event LogCreatedTransfer(address _sender, bytes32 _id, uint _amount);
    event LogTransfer(address _recipient, uint _amount);
    event LogExchangeWithdraw(uint _exchangeAmount, uint _commission);
    event LogTurnOff(bool _outOfOrder);

}
