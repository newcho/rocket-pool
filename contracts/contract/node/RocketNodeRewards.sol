pragma solidity 0.6.8;

// SPDX-License-Identifier: GPL-3.0-only

import "../RocketBase.sol";
import "../../interface/node/RocketNodeRewardsInterface.sol";
import "../../lib/SafeMath.sol";

// Handles claims of node rewards
// Node rewards are taken from user fees and claimed by node operators periodically
// A portion of rewards are divided between node operators proportional to their number of active minipools
// Remaining rewards are divided between node operators proportional to their RPL security deposit staked

contract RocketNodeRewards is RocketBase, RocketNodeRewardsInterface {

    // Libs
    using SafeMath for uint;

	// Construct
    constructor(address _rocketStorageAddress) RocketBase(_rocketStorageAddress) public {
        version = 1;
    }

    // Current reward pool balance
    function getBalance() override public view returns (uint256) {
        return getUintS("reward.pool.balance");
    }
    function setBalance(uint256 _value) private {
        setUintS("reward.pool.balance", _value);
    }

    // Increase the reward pool balance by an amount
    // Only accepts calls from the ??? contract
    function increaseBalance(uint256 _amount) override external {
        setBalance(getBalance().add(_amount));
    }

    // Claim rewards for a node and transfer them to its owner address
    // Only accepts calls from registered nodes
    function claimRewards() external onlyRegisteredNode(msg.sender) {}

    // Check the current reward period and increment if due
    function updateRewardPeriod() override external {}

}
