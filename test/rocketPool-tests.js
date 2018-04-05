// OS methods
const os = require('os');
import { printTitle, assertThrows, printEvent, soliditySha3 } from './utils';
import { RocketUser, RocketNode, RocketPool, RocketPoolMini, RocketSettings, Casper} from './artifacts';

// Import modular tests & scenarios
import { scenarioIncrementEpochAndDynasty } from './casper/casper-scenarios';
import rocketStorageTests from './rocket-storage/rocket-storage-tests';
import casperTests from './casper/casper-tests';
import { rocketNodeRegistrationTests, rocketNodeRemovalTests1, rocketNodeRemovalTests2 } from './rocket-node/rocket-node-tests';
import { rocketPartnerAPIRegistrationTests, rocketPartnerAPIDepositTests1, rocketPartnerAPIDepositTests2, rocketPartnerAPIWithdrawalTests, rocketPartnerAPIRemovalTests, rocketPartnerAPIDepositTests3 } from './rocket-partner-api/rocket-partner-api-tests';
import { rocketUserDepositTests1, rocketUserWithdrawalAddressTests, rocketUserDepositTests2, rocketUserWithdrawalTests1, rocketUserWithdrawalTests2 } from './rocket-user/rocket-user-tests';
import { rocketDepositTests1, rocketDepositTests2, rocketDepositTests3 } from './rocket-deposit/rocket-deposit-tests';
import rocketVaultAdminTests from './rocket-vault/rocket-vault-admin-tests';
import rocketVaultAccountTests from './rocket-vault/rocket-vault-account-tests';
import rocketUpgradeTests from './rocket-upgrade/rocket-upgrade-tests';

const displayEvents = false;

// Display events triggered during the tests
if (displayEvents) {
  RocketPool.deployed().then(rocketPool => {
    const eventWatch = rocketPool
      .allEvents({
        fromBlock: 0,
        toBlock: 'latest',
      })
      .watch((error, result) => {
        // This will catch all events, regardless of how they originated.
        if (error == null) {
          // Print the event
          printEvent('rocket', result, '\x1b[33m%s\x1b[0m:');
          // Listen for new pool events too
          if (result.event == 'PoolCreated') {
            // Get an instance of that pool
            const miniPool = RocketPoolMini.at(result.args._address);
            // Watch for events in minipools also as with the main contract
            const poolEventWatch = miniPool
              .allEvents({
                fromBlock: 0,
                toBlock: 'latest',
              })
              .watch((error, result) => {
                // This will catch all pool events, regardless of how they originated.
                if (error == null) {
                  printEvent('minipool', result, '\x1b[32m%s\x1b[0m');
                }
              });
          }
        }
      });
  });
}

// Start the tests
contract('RocketPool', accounts => {
  // Excessive? Yeah probably :)
  console.log('\n');
  console.log('______           _        _    ______           _ ');
  console.log('| ___ \\         | |      | |   | ___ \\         | |');
  console.log('| |_/ /___   ___| | _____| |_  | |_/ /__   ___ | |');
  console.log('|    // _ \\ / __| |/ / _ \\ __| |  __/ _ \\ / _ \\| |');
  console.log('| |\\ \\ (_) | (__|   <  __/ |_  | | | (_) | (_) | |');
  console.log('\\_| \\_\\___/ \\___|_|\\_\\___|\\__| \\_|  \\___/ \\___/|_|');

  // The owner
  const owner = web3.eth.coinbase;

  // Rocket Pool settings
  // Deposit gas has to cover potential minipool contract creation, will often be much cheaper
  const rocketDepositGas = 4800000;
  const rocketWithdrawalGas = 1450000;

  // Node accounts and gas settings
  const nodeFirst = accounts[8];
  const nodeFirstProviderID = 'aws';
  const nodeFirstSubnetID = 'nvirginia';
  const nodeFirstInstanceID = 'i-1234567890abcdef5';
  const nodeFirstRegionID = 'usa-east';
  const nodeSecond = accounts[9];
  const nodeSecondProviderID = 'rackspace';
  const nodeSecondSubnetID = 'ohio';
  const nodeSecondInstanceID = '4325';
  const nodeSecondRegionID = 'usa-east';
  const nodeRegisterGas = 1600000;
  const nodeCheckinGas = 950000;

  // UPDATE: The first version of Casper wont use the validation code, just the address of the validator, will keep this in for now in case it changes in the future
  // Bytes - Set the node validation code (EVM bytecode, serving as a sort of public key that will be used to verify blocks and other consensus messages signed by it - just an example below)
  // (converted to Bytes32 until Solidity allows passing of variable length types (bytes, string) between contracts - https://github.com/ethereum/EIPs/pull/211 )
  // const nodeFirstValidationCode = web3.sha3('PUSH1 0 CALLDATALOAD SLOAD NOT PUSH1 9 JUMPI STOP JUMPDEST PUSH1 32 CALLDATALOAD PUSH1 0 CALLDATALOAD SSTORE');
  // Bytes32 - Node value provided for the casper deposit function should be the result of computing a long chain of hashes (TODO: this will need work in the future when its defined better)
  // const nodeFirstRandao = '0x9c22ff5f21f0b81b113e63f7db6da94fedef11b2119b4088b89664fb9a3cb658';

  // User accounts
  const userFirst = accounts[1];
  const userSecond = accounts[2];
  const userSecondBackupAddress = accounts[4];
  const userThird = accounts[3];

  // Mocks partner accounts
  const partnerFirst = accounts[5];
  const partnerFirstName = 'Coinbase';
  const partnerFirstUserAccount = accounts[6];
  const partnerSecond = accounts[7];
  const partnerSecondName = 'MEW';
  const partnerRegisterGas = 200000;

  // TODO: the state of these minipools is shared (no test isolation)
  // should be fixed so each test has an isolated pool
  // Minipools
  let miniPools = {};

  // Contracts
  let rocketSettings;
  let rocketUser;
  let rocketNode;
  let rocketDeposit;
  let rocketPool;
  let casper;

  beforeEach(async () => {
    rocketSettings = await RocketSettings.deployed();
    rocketUser = await RocketUser.deployed();
    rocketNode = await RocketNode.deployed();
    rocketPool = await RocketPool.deployed();
    casper = await Casper.deployed();
  });

  rocketStorageTests({
    owner,
    accounts,
  });

  casperTests({
    owner,
    accounts,
  });

  rocketNodeRegistrationTests({
    owner,
    accounts,
    nodeFirst,
    nodeFirstProviderID,
    nodeFirstSubnetID,
    nodeFirstInstanceID,
    nodeFirstRegionID,
    nodeSecond,
    nodeSecondProviderID,
    nodeSecondSubnetID,
    nodeSecondInstanceID,
    nodeSecondRegionID,
    nodeRegisterGas,
  });

  rocketPartnerAPIRegistrationTests({
    owner,
    accounts,
    userFirst,
    partnerFirst,
    partnerFirstName,
    partnerSecond,
    partnerSecondName,
    partnerRegisterGas
  });

  rocketPartnerAPIDepositTests1({
    owner,
    accounts,
    userSecond,
    userThird,
    partnerFirst,
    partnerFirstUserAccount,
    rocketDepositGas
  });

  rocketUserDepositTests1({
    owner,
    accounts,
    userFirst,
    userSecond,
    miniPools,
    rocketDepositGas,
  });

  rocketUserWithdrawalAddressTests({
    owner,
    accounts,
    userSecond,
    userSecondBackupAddress,
    miniPools,
  });

  rocketPartnerAPIDepositTests2({
    owner,
    accounts,
    partnerFirst,
    partnerFirstUserAccount,
    rocketDepositGas,
  });

  rocketPartnerAPIWithdrawalTests({
    owner,
    accounts,
    partnerFirst,
    partnerFirstUserAccount,
    rocketWithdrawalGas,
  });

  rocketUserDepositTests2({
    owner,
    accounts,
    userThird,
    miniPools,
    rocketDepositGas,
  });

  rocketDepositTests1({
    owner,
    accounts,
    userThird,
    miniPools,
  });

  describe('Node Checkins', async () => {

    // Node performs first checkin, no pools should be launched yet
    it(
      printTitle(
        'nodeFirst',
        'first node performs checkin, no minipool awaiting launch should not be launched yet as the countdown has not passed for either'
      ),
      async () => {
        // Our average load is determined by average load / CPU cores since it is relative to how many cores there are in a system
        // Also Solidity doesn't deal with decimals atm, so convert to a whole wei number for the load
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');
        // Checkin now
        const result = await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeFirst, gas: nodeCheckinGas });

        const log = result.logs.find(({ event }) => event == 'NodeCheckin');
        assert.notEqual(log, undefined); // Check that an event was logged

        const nodeAddress = log.args._nodeAddress.valueOf();
        const loadAverage = log.args.loadAverage.valueOf();

        const poolCount = await rocketPool.getPoolsFilterWithNodeCount.call(nodeAddress).valueOf();

        assert.equal(nodeAddress, nodeFirst, 'Node address doesn not match');
        assert.notEqual(loadAverage, 0, 'Load average is not correct');
        assert.equal(poolCount, 0, 'Pool count is not correct');
      }
    );

    // Node performs second checkin, sets the launch time for minipools to 0 so that the first awaiting minipool is launched
    it(
      printTitle(
        'nodeFirst',
        'first node performs second checkin, 1 of the 2 minipools awaiting launch should be launched as countdown is set to 0 and balance sent to Casper'
      ),
      async () => {
        // Our average load is determined by average load / CPU cores since it is relative to how many cores there are in a system
        // Also Solidity doesn't deal with decimals atm, so convert to a whole number for the load
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        // Set our pool launch timer to 0 setting so that will trigger its launch now rather than waiting for it to naturally pass - only an owner operation
        await rocketSettings.setMiniPoolCountDownTime(0, { from: web3.eth.coinbase, gas: 500000 });

        // Launching multiple pools at once can consume a lot of gas, estimate it first
        const gasEstimate = await rocketNode.nodeCheckin.estimateGas(averageLoad15mins, { from: nodeFirst });
        // Checkin now
        const result = await rocketNode.nodeCheckin(averageLoad15mins, {
          from: nodeFirst,
          gas: parseInt(gasEstimate) + 100000,
        });

        const log = result.logs.find(({ event }) => event == 'NodeCheckin');
        assert.notEqual(log, undefined); // Check that an event was logged

        const nodeAddress = log.args._nodeAddress;
        const loadAverage = log.args.loadAverage;

        // Check that the first minipool contract has been attached to the node
        const minipoolsAttached = await rocketPool.getPoolsFilterWithNode.call(nodeFirst).valueOf();
        // Get the balance, should be 0 as the Ether has been sent to Casper for staking
        const minipoolBalance = web3.eth.getBalance(miniPools.first.address).valueOf();
        const minipoolStatus = await miniPools.first.getStatus.call().valueOf();
        // Check its a validator in Casper
        const casperValidatorIndex = await casper.get_validator_indexes.call(miniPools.first.address).valueOf();
        const casperValidatorDynastyStart = await casper.get_validators__dynasty_start.call(casperValidatorIndex).valueOf();

        assert.equal(nodeAddress, nodeFirst, 'Node address does not match');
        assert.equal(loadAverage, averageLoad15mins, 'Load average does not match');
        assert.equal(minipoolsAttached.length, 1, 'Invalid number of minipools');
        assert.equal(minipoolsAttached[0], miniPools.first.address, 'Invalid minipool address');
        assert.equal(minipoolBalance, 0, 'Invalid minipool balance');
        assert.equal(casperValidatorIndex.valueOf(), 1, 'Invalid validator index');
        assert.equal(casperValidatorDynastyStart, 3, 'Invalid validator dynasty');
      }
    );

    // Simulate Caspers epoch and dynasty changing for the second deposit
    it(printTitle('casper', 'simulate Caspers epoch and dynasty changing for the second deposit'), async () => {
      await scenarioIncrementEpochAndDynasty({increment: ['e','e','d','e','d'], fromAddress: owner});
    });

    // Node performs second checkin, sets the launch time for minipools to 0 so that the second awaiting minipool is launched
    it(
      printTitle(
        'nodeSecond',
        'second node performs first checkin, 2 of the 2 minipools awaiting launch should be launched as countdown is set to 0 and balance sent to Casper'
      ),
      async () => {
        // Our average load is determined by average load / CPU cores since it is relative to how many cores there are in a system
        // Also Solidity doesn't deal with decimals atm, so convert to a whole number for the load
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        await rocketSettings.setMiniPoolCountDownTime(0, { from: web3.eth.coinbase, gas: 500000 });

        // Launching multiple pools at once can consume a lot of gas, estimate it first
        const gasEstimate = await rocketNode.nodeCheckin.estimateGas(averageLoad15mins, { from: nodeSecond });

        // Checkin now
        const result = await rocketNode.nodeCheckin(averageLoad15mins, {
          from: nodeSecond,
          gas: parseInt(gasEstimate) + 100000,
        });

        const log = result.logs.find(({ event }) => event == 'NodeCheckin');
        assert.notEqual(log, undefined); // Check that an event was logged

        const nodeAddress = log.args._nodeAddress;
        const loadAverage = log.args.loadAverage;

        // Check that the first minipool contract has been attached to the node
        const minipoolsAttached = await rocketPool.getPoolsFilterWithNode.call(nodeSecond).valueOf();
        const minipoolBalance = web3.eth.getBalance(miniPools.second.address).valueOf();
        const minipoolStatus = await miniPools.second.getStatus.call().valueOf();
        // Check its a validator in Casper
        const casperValidatorIndex = await casper.get_validator_indexes.call(miniPools.second.address).valueOf();
        const casperValidatorDynastyStart = await casper.get_validators__dynasty_start.call(casperValidatorIndex).valueOf();

        assert.equal(nodeAddress, nodeSecond, 'Node address does not match');
        assert.equal(loadAverage, averageLoad15mins, 'Load average does not match');
        assert.equal(minipoolsAttached.length, 1, 'Invalid number of minipools');
        assert.equal(minipoolsAttached[0], miniPools.second.address, 'Invalid minipool address');
        assert.equal(minipoolBalance, 0, 'Invalid minipool balance');
        assert.equal(minipoolStatus, 2, 'Invalid minipool status');
        assert.equal(casperValidatorIndex, 2, 'Invalid validator index');
        assert.equal(casperValidatorDynastyStart, 5, 'Invalid validator dynasty');
      }
    );

  });

  rocketDepositTests2({
    owner,
    accounts,
    userFirst,
    userThird,
    miniPools,
  });

  rocketUserWithdrawalTests1({
    owner,
    accounts,
    userFirst,
    miniPools,
    rocketWithdrawalGas,
  });

  describe('Node Checkins & Minipool Updates', async () => {

    // Node performs checkin
    it(
      printTitle(
        'nodeFirst',
        'first node performs another checkin, first minipool currently staking should remain staking on it'
      ),
      async () => {
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');
        await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeFirst, gas: nodeCheckinGas });

        // Status = 2? Still staking
        const miniPoolStatus = await miniPools.first.getStatus.call().valueOf();
        // Get the balance, should be 0 as the Ether has been sent to Casper for staking
        const miniPoolBalance = web3.eth.getBalance(miniPools.first.address).valueOf();

        assert.equal(miniPoolStatus, 2, 'Invalid minipool status');
        assert.equal(miniPoolBalance, 0, 'Invalid minipool balance');
      }
    );

    // Update first minipool
    it(printTitle('---------', 'first minipool has staking duration set to 0'), async () => {
      // Set the minipool staking duration to 0 for testing so it will attempt to request withdrawal from Casper
      await rocketPool.setPoolStakingDuration(miniPools.first.address, 0, { from: owner, gas: 150000 });
      // TODO: check pool staking duration, dummy test for now
    });

    // Update second minipool
    it(printTitle('---------', 'second minipool has staking duration set to 0'), async () => {
      // Set the minipool staking duration to 0 for testing so it will attempt to request withdrawal from Casper
      await rocketPool.setPoolStakingDuration(miniPools.second.address, 0, { from: owner, gas: 150000 });
      // TODO: check pool staking duration, dummy test for now
    });

    // Simulate Caspers epoch and dynasty changing to allow withdrawals
    it(printTitle('casper', 'simulate Caspers epoch and dynasty changing to allow withdrawals'), async () => {
      await scenarioIncrementEpochAndDynasty({increment: ['e','e','d'], fromAddress: owner});
    });


    // Node performs checkin
    it(
      printTitle(
        'nodeFirst',
        'first node performs another checkin after both minipools have staking duration set to 0. Only minipool attached to first node will signal logged out from Casper.'
      ),
      async () => {
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        // Checkin now
        await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeFirst, gas: nodeCheckinGas });

        // Status = 3? Awaiting withdrawal from Casper
        const miniPoolStatusFirst = await miniPools.first.getStatus.call().valueOf();
        const miniPoolStatusSecond = await miniPools.second.getStatus.call().valueOf();

        assert.equal(miniPoolStatusFirst, 3, 'First minipool invalid status');
        assert.equal(miniPoolStatusSecond, 2, 'Second minipool invalid status');
      }
    );

    // Node performs checkin
    it(
      printTitle(
        'nodeSecond',
        'second node performs another checkin after both minipools have staking duration set to 0. Only minipool attached to second node will signal logged out from Casper.'
      ),
      async () => {
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        // Checkin now
        await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeSecond, gas: nodeCheckinGas });

        const miniPoolStatusFirst = await miniPools.first.getStatus.call().valueOf();
        const miniPoolStatusSecond = await miniPools.second.getStatus.call().valueOf();

        assert.equal(miniPoolStatusFirst, 3, 'First minipool invalid status');
        assert.equal(miniPoolStatusSecond, 3, 'Second minipool invalid status');
      }
    );

    // Simulate Caspers epoch and dynasty changing for the second deposit
    it(printTitle('casper', 'simulate Caspers epoch and dynasty incrementing to allow first minipool validator to withdraw'), async () => {
      await scenarioIncrementEpochAndDynasty({increment: ['e','e','d','e','d','e','d','e','e'], fromAddress: owner});
    });

    // Node performs checkin
    it(
      printTitle(
        'nodeFirst',
        'first node performs another checkin and first minipool to change status and request actual deposit withdrawal from Casper'
      ),
      async () => {
        // Our average load (simplified) is determined by average load / CPU cores since it is relative to how many cores there are in a system
        // Also Solidity doesn't deal with decimals atm, so convert to a whole wei number for the load
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        // Checkin now
        await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeFirst, gas: 950000 });

        // Check the status of the first pool
        const miniPoolStatusFirst = await miniPools.first.getStatus.call();
        // Get the balance, should be 0 as the Ether has been sent to Casper for staking
        const miniPoolBalanceFirst = web3.eth.getBalance(miniPools.first.address);
        // Check the status of the second pool
        const miniPoolStatusSecond = await miniPools.second.getStatus.call();
        // Get the balance, should be 0 as the Ether has been sent to Casper for staking
        const miniPoolBalanceSecond = web3.eth.getBalance(miniPools.second.address);

        assert.equal(miniPoolStatusFirst.valueOf(), 4, 'Invalid first minipool status');
        assert.isTrue(miniPoolBalanceFirst.valueOf() > 0, 'Invalid first minipool balance');
        assert.equal(miniPoolStatusSecond.valueOf(), 3, 'Invalid second minipool status');
        assert.equal(miniPoolBalanceSecond.valueOf(), 0, 'Invalid second minipool balance');
      }
    );


    // Node performs checkin
    it(
      printTitle(
        'nodeFirst',
        'first node performs another checkin and second minipool requests deposit from Casper, receives it then closes the pool as all users have withdrawn deposit as tokens'
      ),
      async () => {
        // Our average load (simplified) is determined by average load / CPU cores since it is relative to how many cores there are in a system
        // Also Solidity doesn't deal with decimals atm, so convert to a whole wei number for the load
        const averageLoad15mins = web3.toWei(os.loadavg()[2] / os.cpus().length, 'ether');

        // Checkin now
        await rocketNode.nodeCheckin(averageLoad15mins, { from: nodeFirst, gas: 950000 });

        // Status = 4? Received deposit from casper + rewards
        const miniPoolStatusFirst = await miniPools.first.getStatus.call().valueOf();
        // Get the balance, should be 0 as the Ether has been sent to Casper for staking
        const miniPoolBalanceFirst = web3.eth.getBalance(miniPools.first.address).valueOf();

        // Second minipool should have closed and it's balance is 0 as all users have withdrawn ether as RPD tokens
        const miniPoolBalanceSecond = web3.eth.getBalance(miniPools.second.address).valueOf();

        assert.equal(miniPoolStatusFirst, 4, 'Invalid first minipool status');
        assert.isTrue(miniPoolBalanceFirst > 0, 'Invalid first minipool balance');
        assert.equal(miniPoolBalanceSecond, 0, 'Invalid second minipool balance');
      }
    );

  });

  rocketDepositTests3({
    owner,
    accounts,
    userFirst,
  });

  rocketNodeRemovalTests1({
    owner,
    accounts,
    nodeFirst,
  });

  rocketUserWithdrawalTests2({
    owner,
    accounts,
    userFirst,
    userSecond,
    userSecondBackupAddress,
    miniPools,
    rocketWithdrawalGas,
  });

  rocketNodeRemovalTests2({
    owner,
    accounts,
    nodeFirst,
  });

  rocketPartnerAPIRemovalTests({
    owner,
    accounts,
    partnerFirst,
    partnerSecond,
  });

  rocketPartnerAPIDepositTests3({
    owner,
    accounts,
    partnerFirst,
    partnerFirstUserAccount,
    rocketDepositGas
  });

  rocketVaultAdminTests({
    owner,
    accounts,
  });

  rocketVaultAccountTests({
    owner,
    accounts,
  });

  rocketUpgradeTests({
    owner,
    accounts,
  });

});
