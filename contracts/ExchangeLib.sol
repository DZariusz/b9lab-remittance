pragma solidity ^0.4.11;

library ExchangeLib {

	function convert(uint amount, uint conversionRate, uint commissionPercent)
	returns (uint convertedAmount, uint commission)
	{
		uint a = amount * conversionRate;
		uint c = a * commissionPercent / 100;
		return (a - c, c == 0 ? 1 : c);
	}
}
