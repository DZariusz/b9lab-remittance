pragma solidity ^0.4.11;

library ExchangeLib {


	function convert(uint amount, uint conversionRate)
		constant
		returns (uint convertedAmount)
	{
		return amount * conversionRate;
	}
}
