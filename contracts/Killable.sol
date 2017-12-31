pragma solidity ^0.4.4;

contract Killable {

	address owner;
	bool outOfOrder;

	function Killer()
	public
	{
		owner = msg.sender;
	}

	modifier onlyIfRunning {
		require( !outOfOrder );
		_;
	}

	function turnOff()
		returns (bool success)
	{
		require( msg.sender == owner );
		outOfOrder = true;
		return true;
	}


	function turnOn()
		returns (bool success)
	{
		require( msg.sender == owner );
		outOfOrder = false;
		return true;
	}


}
