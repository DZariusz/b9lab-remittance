pragma solidity ^0.4.11;


import "./Killable.sol";


// v1.1
// 2018-03-03
contract Withdrawable is Killable {

    mapping (address => uint256) private balances;

    event LogAddBalance(address a, uint256 added);

    function withdraw()
        public
        onlyIfRunning
        returns (bool success)
    {
        require( balances[msg.sender]>0 );

        uint256 b = balances[msg.sender];
        balances[msg.sender] = 0;

        msg.sender.transfer( b );

        return true;
    }

    function addBalance(address a, uint256 b)
        internal
    {
        balances[a] += b;
        LogAddBalance(a, b);
    }

    function getBalance(address a)
        public
        constant
        returns (uint256)
    {
        return balances[a];
    }


}
