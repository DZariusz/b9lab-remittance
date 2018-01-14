pragma solidity ^0.4.11;

contract Killable {

	address owner;
	bool public outOfOrder;

	function Killer()
	public
	{
		owner = msg.sender;
	}

	modifier onlyIfRunning {
		require( !outOfOrder );
		_;
	}


	event LogTurnOff(bool _outOfOrder);

	function turnOff()
		returns (bool success)
	{
		require( msg.sender == owner );
		outOfOrder = true;
		LogTurnOff(true);
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
