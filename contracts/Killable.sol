pragma solidity ^0.4.11;


// v 1.0
// date 2018-03-03
contract Killable {

    address owner;
    bool public outOfOrder;


    event LogStatus(bool outOfOrder);
    event LogNewOwner(address owner);


    function Killable()
    public
    {
        owner = msg.sender;
    }

    modifier onlyIfRunning {
        require( !outOfOrder );
        _;
    }

    modifier onlyForOwner {
        require(msg.sender == owner);
        _;
    }



    function turnOff()
        onlyForOwner
        returns (bool success)
    {
        outOfOrder = true;
        LogStatus(true);
        return true;
    }


    function turnOn()
        onlyForOwner
        returns (bool success)
    {
        outOfOrder = false;
        LogStatus(false);
        return true;
    }


    function newOwner(address _newOwner)
        onlyForOwner
        returns (bool success)
    {
        require( _newOwner != 0 );
        owner = _newOwner;
        LogNewOwner(_newOwner);
        return true;
    }


}
