pragma solidity ^0.4.11;

import "./ExchangeLib.sol";
import "./SafeMath.sol";

import "./Withdrawable.sol";



contract Remittance is Withdrawable {


    struct TransferData {
        uint256 amount;
        uint256 deadlineBlock;  //after this block number, Alice can withdraw
        address sender;       //creator of the transfer eg. Alice
        bool usedPass;
        bool done;
    }


    uint256 public commissionFee;


    //the KEY of the structure will be hash: keccak256(email pass + sms pass + Bob_address)
    mapping(bytes32 => TransferData) public transfers;

    event LogCommissionFee(uint256 fee);
    event LogCreatedTransfer(address sender, bytes32 id, uint256 amount);
    event LogDoExchange(bytes32 id, uint256 amount, uint256 fee, uint256 convertedAmount);
    event LogCancelTransfer(bytes32 id, uint256 amount);
    event LogTransfer(address recipient, uint256 amount);

    function() public {}

    function Remittance() public {

        //fee will be 1/100 of what deploy costs
        commissionFee = SafeMath.div(SafeMath.mul(block.gaslimit - msg.gas, tx.gasprice), 100);
        LogCommissionFee(commissionFee);
    }



    function createTransfer(bytes32 id, uint256 deadline)
        public
        payable
        onlyIfRunning
        returns (bool success)
    {

        require( !transfers[ id ].usedPass );

        uint256 cf = commissionFee;
        //do you have enough for both fees (transfer and exchange)?
        require(msg.value > 2 * cf);

        addBalance(owner, cf);

        transfers[ id ].usedPass = true;
        transfers[ id ].amount = msg.value - cf;
        transfers[ id ].sender = msg.sender;
        transfers[ id ].deadlineBlock = block.number + deadline;


        LogCreatedTransfer(msg.sender, id, msg.value - cf);


        return true;

    }




    // this function is for Carol/exchanger
    //
    function doExchange(string emailPass, string smsPass, address bob, uint8 conversionRate)
        public
        onlyIfRunning
        returns (bool success)
    {

        bytes32 id = keccak256(emailPass, smsPass, bob);
        require( !transfers[ id ].done );

        uint256 amount = transfers[ id ].amount;
        require( amount > 0 );

        addBalance(owner, commissionFee);
        addBalance(msg.sender, amount - commissionFee);
        transfers[ id ].done = true;

        //I assume, that we should send Carol the: amount - fee,
        //but she needs to know how much give to Bob eg. base on event
        //I know this might be a regular function, but I have a feeleing, this exercise was about to use externa llibrary? if not, I can change.
        uint256 convertedAmount = ExchangeLib.convert(amount - commissionFee, conversionRate);

        LogDoExchange(id, amount, commissionFee, convertedAmount);

        return true;
    }

    // this is only for creator of the transfer, so he can get money after deadline
    //
    function cancelTransfer(bytes32 id)
        public
        onlyIfRunning
        returns (bool success)
    {


        require( transfers[ id ].sender == msg.sender );
        require( transfers[ id ].deadlineBlock < block.number );
        require( !transfers[ id ].done );


        transfers[ id ].done = true;
        uint256 a = transfers[ id ].amount;
        transfers[ id ].amount = 0;

        addBalance(msg.sender, a);

        LogCancelTransfer(id, a);

        return true;

    }




    function hash(string p1, string p2, address b)
    public constant returns (bytes32)
    {
        return keccak256(p1, p2, b);
    }




}
