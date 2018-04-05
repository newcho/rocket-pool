import { soliditySha3 } from '../utils';
import { RocketNode } from '../artifacts';


// Registers node and asserts that number of registered nodes increased
export async function scenarioRegisterNode({
    nodeAddress,
    valCodeAddress,
    addValCodeAddress = null,
    providerID,
    subnetID,
    instanceID,
    regionID,
    fromAddress,
    gas
}) {
    const rocketNode = await RocketNode.deployed();

    // Initialise add val code address
    if (!addValCodeAddress) addValCodeAddress = valCodeAddress;

    // Get initial node count
    let nodeCountOld = await rocketNode.getNodeCount.call();

    // Sign the message for the nodeAdd function to prove ownership of the address being registered
    let signature =  web3.eth.sign(nodeAddress, soliditySha3(valCodeAddress));

    // Register the node
    await rocketNode.nodeAdd(nodeAddress, providerID, subnetID, instanceID, regionID, addValCodeAddress, signature, {from: fromAddress, gas: gas});

    // Get updated node count
    let nodeCountNew = await rocketNode.getNodeCount.call();

    // Assert that updated node count is correct
    assert.equal(nodeCountNew.valueOf(), parseInt(nodeCountOld.valueOf()) + 1, 'Invalid number of nodes registered');

}


// Performs node checkin and asserts that checkin was preformed successfully
export async function scenarioNodeCheckin({averageLoad, fromAddress}) {
    const rocketNode = await RocketNode.deployed();

    // Estimate gas required to launch pools
    let gasEstimate = await rocketNode.nodeCheckin.estimateGas(averageLoad, {from: fromAddress});

    // Check in
    let result = await rocketNode.nodeCheckin(averageLoad, {
        from: fromAddress,
        gas: parseInt(gasEstimate) + 100000,
    });

    // Assert NodeCheckin event was logged
    let log = result.logs.find(({ event }) => event == 'NodeCheckin');
    assert.notEqual(log, undefined, 'NodeCheckin event was not logged');

    // Get checkin details
    let checkinNodeAddress = log.args._nodeAddress.valueOf();
    let checkinLoadAverage = log.args.loadAverage.valueOf();

    // Check checkin details
    assert.equal(checkinNodeAddress, fromAddress, 'Checked in node address does not match');
    assert.notEqual(checkinLoadAverage, 0, 'Checked in load average is not correct');

}


// Removes a node and asserts that node was removed successfully
export async function scenarioRemoveNode({nodeAddress, fromAddress, gas}) {
    const rocketNode = await RocketNode.deployed();

    // Remove the node
    let result = await rocketNode.nodeRemove(nodeAddress, {from: fromAddress, gas: gas});

    // Check that removal event was logged
    let log = result.logs.find(({ event }) => event == 'NodeRemoved');
    assert.notEqual(log, undefined, 'NodeRemoved event was not logged');

    // Check that removed node address matches
    let removedNodeAddress = log.args._address;
    assert.equal(removedNodeAddress, nodeAddress, 'Removed node address does not match');

}

