pragma solidity ^0.4.11;

import "./ExchangeLib.sol";
import "./Killable.sol";


contract Remittance is Killable {

    uint public gasUsedForDeploy; //this is how much was used for deploy

    uint deadline = 1 days;

    uint256 public commissionFee = 20000;
    uint256 public commissions;


    struct TransferData {
        address sender;       //creator of the transfer eg. Alice
        address exchanger;    //eg. Carol
        uint amount;
        uint deadlineDate;  //after this date Alice can withdraw
        bool usedPass;
    }

    //the KEY of the structure will be hash: keccak256(pass + Bob_address)
    mapping(bytes32 => TransferData) public transfers;


    function() public {}

    function Remittance()
    public
    {
        owner = msg.sender;
        //this is gas used for deploy + constructor
        gasUsedForDeploy = block.gaslimit - msg.gas;
    }




    /// @return uint commision fee for make transfer
    function calculateFee()
        public
        constant
        returns (uint256 fee)
    {
        // I want fee that is half of deploing cost
        return gasUsedForDeploy / 2 * tx.gasprice;

    }


    event LogCreatedTransfer(address _sender, bytes32 _id, int _amount);

    // @param id bytes32 should be keccak256(pass + Bob address + exchanger address)
    // @param startTime uint timestamp when transfer is created
    // @param exchanger address who can exchange the founds
    function createTransfer(bytes32 id, uint256 startTime, address exchanger)
        public
        payable
        onlyIfRunning
        returns (bool success)
    {

        require( !transfers[ id ].usedPass );
        require( startTime > 0);
        require( exchanger != 0);

        //do you have enough for both fees?
        uint256 fee = calculateFee();
        require(msg.value > fee + commissionFee);

        commissions += fee;

        transfers[ id ].usedPass = true;
        transfers[ id ].amount = msg.value - fee;
        transfers[ id ].sender = msg.sender;
        transfers[ id ].exchanger = exchanger;
        transfers[ id ].deadlineDate = startTime + deadline;

        //LogCreatedTransfer(msg.sender, id, transfers[ id ].amount);
        LogCreatedTransfer(msg.sender, id, int(msg.value - fee));


        return true;

    }


    event LogExchangeWithdraw(address _exchanger, uint _exchangeAmount, uint _commission);

    // this function is for Carol/exchanger only
    //
    // @param pass that was send by email
    // @param bob address works like second pass, but here its to confirm, which payment to withdraw
    function exchangeWithdraw (string pass, address bob, uint8 conversionRate)
        public
        onlyIfRunning
        returns (bool success)
    {

        bytes32 id = keccak256( pass, bob, msg.sender );
        
        //throw if no data
        //require( transfers[ id ].amount != 0 );
        require( msg.sender == transfers[ id ].exchanger );



        // I assume, that we should send Carol all the amount,
        // but she needs to know how much give to Bob eg. base on event

        commissions += commissionFee;
        uint256 exchange = ExchangeLib.convert(transfers[ id ].amount - commissionFee, conversionRate);

        transfers[ id ].amount -= commissionFee;

        LogExchangeWithdraw(msg.sender, exchange, commissionFee);

        return doTransfer(id);
    }

    // this is only for creator of the transfer, so he can get money after deadline
    //
    /// @param id bytes32 should be keccak(pass + recipient + exchanger)
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
        require( transfers[ id ].deadlineDate <= now );

        return doTransfer(id);

    }


    event LogTransfer(address _recipient, uint256 _amount);

    // this is final step for both public withdraw functions
    function doTransfer (bytes32 id)
    private
    returns (bool success)
    {
        //this should be checked already before call this function
        //require( transfers[ id ].amount != 0 );

        uint256 a = transfers[ id ].amount;
        transfers[ id ].amount = 0;

        //send ether to user who will exchange
        msg.sender.transfer( a );

        //in order to safe gass, I can remove `delete`, since I will be checking only `.amount` anyway
        //delete transfers[ id ];

        LogTransfer(msg.sender, a);

        return true;
    }




    event LogTurnOff(bool _outOfOrder);


    function hash(string pass, address Bob, address exchanger)
    public constant returns (bytes32)
    {
        return keccak256(pass, Bob, exchanger);
    }


    event LogGetCommissions(address _receiver, uint _amount);

    function getCommissions()
        public
        onlyIfRunning
        returns (bool success)
    {
        require( msg.sender == owner );
        require( commissions > 0 );

        uint c = commissions;
        commissions = 0;

        msg.sender.transfer( c );

        LogGetCommissions(msg.sender, c);

        return true;
    }

}
