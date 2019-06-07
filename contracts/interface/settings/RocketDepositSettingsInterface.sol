pragma solidity 0.5.8;


// Our deposit and withdrawals interface
contract RocketDepositSettingsInterface {
    // Getters
    function getDepositAllowed() public view returns (bool);
    function getDepositChunkSize() public view returns (uint256);
    function getDepositMin() public view returns (uint256);
    function getDepositMax() public view returns (uint256);
    function getChunkAssignMax() public view returns (uint256);
    function getDepositQueueSizeMax() public view returns (uint256);
    function getRefundDepositAllowed() public view returns (bool);
    function getCurrentDepositMax(string memory _durationID) public returns (uint256);
    function getStakingWithdrawalAllowed() public view returns (bool);
    function getWithdrawalAllowed() public view returns (bool);
    function getStakingWithdrawalFeePerc() public view returns (uint256);
}
