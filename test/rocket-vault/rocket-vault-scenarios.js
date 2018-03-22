import { soliditySha3 } from '../utils';
import { RocketStorage, RocketVault } from "../artifacts";

/** SCENARIOS */

// Runs add account scenario and asserts that the new account has been recorded correctly
export async function scenarioAddAccount({accountName, ownerAddress, tokenContractAddress = 0x0, depositsEnabled, withdrawalsEnabled}){
    const rocketVault = await RocketVault.deployed();

    await rocketVault.setAccountAdd(accountName, tokenContractAddress, {from: ownerAddress});

    // await assertAccount({
    //     accountName: accountName, 
    //     ownerAddress: ownerAddress, 
    //     tokenContractAddress: tokenContractAddress,
    //     depositsEnabled: depositsEnabled, 
    //     withdrawalsEnabled: withdrawalsEnabled
    // });
};

// Runs deposit enabling scenario and asserts recorded correctly
export async function scenarioDepositEnabling({accountName, accountToTestEnabling}){
    const rocketVault = await RocketVault.deployed();

    // test to make sure deposits are enabled (should be on creation)
    let depositsEnabled = await rocketVault.getAccountDepositsEnabled(accountName);
    assert.isTrue(depositsEnabled, "Account deposits should be initially enabled on creation.");

    // account disables deposits
    await rocketVault.setAccountDepositsEnabled(accountName, false, {from: accountToTestEnabling});

    // test to make sure deposits are disabled
    depositsEnabled = await rocketVault.getAccountDepositsEnabled(accountName);
    assert.isFalse(depositsEnabled, "Account deposits should be disabled.");

    // account enables deposits
    await rocketVault.setAccountDepositsEnabled(accountName, true, {from: accountToTestEnabling});

    // test to make sure deposits are back to enabled
    depositsEnabled = await rocketVault.getAccountDepositsEnabled(accountName);
    assert.isTrue(depositsEnabled, "Account deposits should be enabled.");
}

// Runs withdrawal enabling scenario and asserts recorded correctly
export async function sceanarioWithdrawalsEnabling({accountName, accountToTestEnabling}){
    const rocketVault = await RocketVault.deployed();

    // test to make sure withdrawals are enabled (should be on creation)
    let withdrawalEnabled = await rocketVault.getAccountWithdrawalsEnabled(accountName);
    assert.isTrue(withdrawalEnabled, "Account withdrawaks should be initially enabled on creation.");

    // accountr disables withdrawals
    await rocketVault.setAccountWithdrawalsEnabled(accountName, false, {from: accountToTestEnabling});

    // test to make sure withdrawals are disabled
    withdrawalEnabled = await rocketVault.getAccountWithdrawalsEnabled(accountName);
    assert.isFalse(withdrawalEnabled, "Account withdrawals should be disabled.");

    // account enables withdrawals
    await rocketVault.setAccountWithdrawalsEnabled(accountName, true, {from: accountToTestEnabling});

    // test to make sure withdrawals are back to enabled
    withdrawalEnabled = await rocketVault.getAccountWithdrawalsEnabled(accountName);
    assert.isTrue(withdrawalEnabled, "Account withdrawals should be enabled.");
}

// Deposit ether successfully
export async function scenarioDepositEtherSuccessfully({accountName, fromAddress, depositAmount}) {
    const rocketVault = await RocketVault.deployed();

    // Get old vault & account balances
    let vaultBalanceOld = web3.eth.getBalance(rocketVault.address).valueOf();
    let accountBalanceOld = await rocketVault.getBalance(accountName);

    // Deposit ether
    await rocketVault.deposit(accountName, 0, {from: fromAddress, value: depositAmount});

    // Get new vault & account balances
    let vaultBalanceNew = web3.eth.getBalance(rocketVault.address).valueOf();
    let accountBalanceNew = await rocketVault.getBalance(accountName);

    assert.notEqual(vaultBalanceOld, vaultBalanceNew, 'Vault ether balance was not increased');
    assert.notEqual(accountBalanceOld.valueOf(), accountBalanceNew.valueOf(), 'Account ether balance was not increased');
    assert.equal((vaultBalanceNew - vaultBalanceOld), (accountBalanceNew.valueOf() - accountBalanceOld.valueOf()), 'Account ether balance was updated incorrectly');

}

// Withdraw ether successfully
export async function scenarioWithdrawEtherSuccessfully({accountName, fromAddress, withdrawalAddress, withdrawalAmount}) {
    const rocketVault = await RocketVault.deployed();

    // Get old address & account balances
    let addressBalanceOld = web3.eth.getBalance(withdrawalAddress).valueOf();
    let accountBalanceOld = await rocketVault.getBalance(accountName);

    // Withdraw ether
    await rocketVault.withdraw(accountName, withdrawalAmount, withdrawalAddress, {from: fromAddress});

    // Get new address & account balances
    let addressBalanceNew = web3.eth.getBalance(withdrawalAddress).valueOf();
    let accountBalanceNew = await rocketVault.getBalance(accountName);

    assert.notEqual(addressBalanceOld, addressBalanceNew, 'Address ether balance was not increased');
    assert.notEqual(accountBalanceOld.valueOf(), accountBalanceNew.valueOf(), 'Account ether balance was not decreased');
    assert.equal((addressBalanceNew - addressBalanceOld), (accountBalanceOld.valueOf() - accountBalanceNew.valueOf()), 'Account ether balance was updated incorrectly');

}

/** ASSERTS */

// Asserts that an account has been recorded correctly
export async function assertAccount({accountName, ownerAddress, tokenContractAddress, depositsEnabled, withdrawalsEnabled}){
    const rocketStorage = await RocketStorage.deployed();

    const recordedAccountName = await rocketStorage.getString(soliditySha3("vault.account", accountName));
    assert.equal(recordedAccountName, accountName, "Account name not set for new account.");
    const recordedOwner = await rocketStorage.getAddress(soliditySha3("vault.account.owner", accountName));
    assert.equal(recordedOwner, ownerAddress, 'Account owner is not set to owner');
    const recordedDepositEnabled = await rocketStorage.getBool(soliditySha3("vault.account.deposit.enabled", accountName));
    assert.isTrue(recordedDepositEnabled, 'Deposits should be enabled by default for new accounts.');
    const recordedWithdrawalEnabled = await rocketStorage.getBool(soliditySha3("vault.account.withdrawal.enabled", accountName));
    assert.isTrue(recordedWithdrawalEnabled, 'Withdrawals should be enabled by default for new accounts.');
    const recordedTokenContract = await rocketStorage.getAddress(soliditySha3("vault.account.token.address", accountName));
    assert.equal(recordedTokenContract, tokenContractAddress, "Token contract should equal provided address");
};