pragma solidity ^0.4.11;

import "./SafeMath.sol";
import "./Killable.sol";



contract Remittance is Killable {


    struct TransferData {
        uint256 amount;
        uint256 deadlineBlock;  //after this block number, Alice can withdraw
        address sender;       //creator of the transfer eg. Alice
        bool done;
    }

    mapping (address => uint256) public balances;


    uint256 public commissionFee;


    //the KEY of the structure will be hash: keccak256(email pass + sms pass + Bob_address)
    mapping(bytes32 => TransferData) public transfers;

    event LogAddBalance(address a, uint256 added);
    event LogCommissionFee(uint256 fee);
    event LogCreatedTransfer(bytes32 id, address sender, uint256 amount);
    event LogDoExchange(bytes32 id, uint256 exchangedAmount);
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

        require( transfers[ id ].sender == 0 );

        uint256 cf = commissionFee;
        //do you have enough for fee?
        require(msg.value > cf);

        //fee for create transfer
        balances[owner] += cf;

        transfers[ id ].amount = msg.value - cf;
        transfers[ id ].sender = msg.sender;
        transfers[ id ].deadlineBlock = block.number + deadline;

        LogAddBalance(owner, cf);
        LogCreatedTransfer(id, msg.sender, msg.value - cf);


        return true;

    }




    // this function is for Carol/exchanger
    //
    function doExchange(string emailPass, string smsPass, address bob)
    public
    onlyIfRunning
    returns (bool success)
    {

        bytes32 id = hash(emailPass, smsPass, bob);
        require( !transfers[ id ].done );
        require( transfers[ id ].sender != 0 );

        transfers[ id ].done = true;

        uint256 amount = transfers[ id ].amount;

        //send coins to carol
        msg.sender.transfer(amount);

        LogDoExchange(id, amount);

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

        msg.sender.transfer(a);

        LogCancelTransfer(id, a);

        return true;

    }




    function hash(string p1, string p2, address b)
    public constant returns (bytes32)
    {
        return keccak256(p1, p2, b);
    }




}