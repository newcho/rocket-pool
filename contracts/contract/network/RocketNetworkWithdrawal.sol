pragma solidity 0.6.10;

// SPDX-License-Identifier: GPL-3.0-only

import "../RocketBase.sol";
import "../../interface/RocketVaultInterface.sol";
import "../../interface/deposit/RocketDepositPoolInterface.sol";
import "../../interface/minipool/RocketMinipoolManagerInterface.sol";
import "../../interface/network/RocketNetworkWithdrawalInterface.sol";
import "../../interface/settings/RocketNetworkSettingsInterface.sol";
import "../../interface/token/RocketETHTokenInterface.sol";
import "../../interface/token/RocketNodeETHTokenInterface.sol";
import "../../lib/SafeMath.sol";

// Handles network validator withdrawals

contract RocketNetworkWithdrawal is RocketBase, RocketNetworkWithdrawalInterface {

    // Libs
    using SafeMath for uint;

    // Events
    event WithdrawalReceived(address indexed from, uint256 amount, uint256 time);
    event WithdrawalProcessed(bytes32 indexed validator, address indexed minipool, uint256 nethAmount, uint256 rethAmount, uint256 time);

    // Construct
    constructor(address _rocketStorageAddress) RocketBase(_rocketStorageAddress) public {
        version = 1;
    }

    // Default payable function - for vault withdrawals
    // Only accepts calls from the RocketVault contract
    receive() external payable onlyLatestContract("rocketVault", msg.sender) {}

    // Current withdrawal pool balance
    function getBalance() override public view returns (uint256) {
        return getUintS("withdrawal.pool.balance");
    }
    function setBalance(uint256 _value) private {
        setUintS("withdrawal.pool.balance", _value);
    }

    // Get the validator withdrawal credentials
    function getWithdrawalCredentials() override public view returns (bytes memory) {
        // TODO: implement
        return hex"0000000000000000000000000000000000000000000000000000000000000000";
    }

    // Deposit a validator withdrawal from the beacon chain
    function depositWithdrawal() override external payable {
        // Check deposit amount
        require(msg.value > 0, "Invalid deposit amount");
        // Load contracts
        RocketVaultInterface rocketVault = RocketVaultInterface(getContractAddress("rocketVault"));
        // Update withdrawal pool balance
        setBalance(getBalance().add(msg.value));
        // Transfer ETH to vault
        rocketVault.depositEther{value: msg.value}();
        // Emit withdrawal received event
        emit WithdrawalReceived(msg.sender, msg.value, now);
    }

    // Process a validator withdrawal from the beacon chain
    // Only accepts calls from trusted (oracle) nodes
    function processWithdrawal(bytes calldata _validatorPubkey) external onlyTrustedNode(msg.sender) {
        // Load contracts
        RocketDepositPoolInterface rocketDepositPool = RocketDepositPoolInterface(getContractAddress("rocketDepositPool"));
        RocketETHTokenInterface rocketETHToken = RocketETHTokenInterface(getContractAddress("rocketETHToken"));
        RocketMinipoolManagerInterface rocketMinipoolManager = RocketMinipoolManagerInterface(getContractAddress("rocketMinipoolManager"));
        RocketNetworkSettingsInterface rocketNetworkSettings = RocketNetworkSettingsInterface(getContractAddress("rocketNetworkSettings"));
        RocketNodeETHTokenInterface rocketNodeETHToken = RocketNodeETHTokenInterface(getContractAddress("rocketNodeETHToken"));
        RocketVaultInterface rocketVault = RocketVaultInterface(getContractAddress("rocketVault"));
        // Check validator minipool
        address minipool = rocketMinipoolManager.getMinipoolByPubkey(_validatorPubkey);
        require(minipool != address(0x0), "Invalid minipool validator");
        // Check minipool withdrawal status
        require(rocketMinipoolManager.getMinipoolWithdrawable(minipool), "Minipool is not withdrawable");
        require(!rocketMinipoolManager.getMinipoolWithdrawalProcessed(minipool), "Withdrawal has already been processed for minipool");
        // Get withdrawal amounts
        uint256 totalAmount = rocketMinipoolManager.getMinipoolWithdrawalTotalBalance(minipool);
        uint256 nodeAmount = rocketMinipoolManager.getMinipoolWithdrawalNodeBalance(minipool);
        uint256 userAmount = totalAmount.sub(nodeAmount);
        // Check balance
        require(getBalance() >= totalAmount, "Insufficient withdrawal pool balance");
        // Set withdrawal processed status
        rocketMinipoolManager.setMinipoolWithdrawalProcessed(minipool, true);
        // Withdraw ETH from vault
        if (totalAmount > 0) {
            // Update withdrawal pool balance
            setBalance(getBalance().sub(totalAmount));
            // Withdraw
            rocketVault.withdrawEther(address(this), totalAmount);
        }
        // Transfer node balance to nETH contract
        if (nodeAmount > 0) { rocketNodeETHToken.deposit{value: nodeAmount}(); }
        // Transfer user balance to rETH contract or deposit pool
        if (userAmount > 0) {
            if (rocketETHToken.getCollateralRate() < rocketNetworkSettings.getTargetRethCollateralRate()) {
                rocketETHToken.deposit{value: userAmount}();
            } else {
                rocketDepositPool.recycleWithdrawnDeposit{value: userAmount}();
            }
        }
        // Emit withdrawal processed event
        emit WithdrawalProcessed(keccak256(abi.encodePacked(_validatorPubkey)), minipool, nodeAmount, userAmount, now);
    }

}
