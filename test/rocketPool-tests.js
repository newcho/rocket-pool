import { printEvent } from './utils';
import { RocketPool, RocketPoolMini} from './artifacts';

// Import modular tests & scenarios
import rocketStorageTests from './rocket-storage/rocket-storage-tests';
import casperTests from './casper/casper-tests';
import { rocketNodeRegistrationTests, rocketNodeCheckinTests1, rocketNodeCheckinTests2, rocketNodeRemovalTests1, rocketNodeRemovalTests2 } from './rocket-node/rocket-node-tests';
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


  /**
   * Configuration options
   */


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


  /**
   * Tests
   */


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

  rocketNodeCheckinTests1({
    owner,
    accounts,
    nodeFirst,
    nodeSecond,
    miniPools,
    nodeCheckinGas,
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

  rocketNodeCheckinTests2({
    owner,
    accounts,
    nodeFirst,
    nodeSecond,
    miniPools,
    nodeCheckinGas,
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
