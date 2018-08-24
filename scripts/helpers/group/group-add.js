// Dependencies
const Web3 = require('web3');

// Artifacts
const RocketGroup = artifacts.require('./contract/RocketGroup');

module.exports = async (done) => {

    // Get command-line arguments (remove args from truffle)
    let args = process.argv.splice(4);

      // Validate arguments
    if (args.length != 2) done('Incorrect number of arguments. Please enter: group ID, name, fee.');
    if (isNaN(args[1])) done('Fee amount (ETH) is invalid.');

    // Parse arguments
    let [name, fee] = args;

    // Get contract dependencies
    const rocketGroup = await RocketGroup.deployed();

    // Perform add group
    let result = await rocketGroup.add(name, Web3.utils.toWei(fee, 'ether'), {
        from: web3.eth.coinbase,
        gas: 480000,
    });

    // Show events

    result.logs.forEach(event => {
        console.log('********************************');
        console.log('EVENT: '+event['event'], );
        console.log('********************************');
        Object.keys(event['args']).forEach(arg => {
            console.log(' - '+arg+': ', event['args'][arg].valueOf());
        });
    });;
    console.log('********************************');
    

    // Complete
    done('Group added successfully: ' + args.join(', '));
   

};

