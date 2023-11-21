const { utils } = require('ethers');

const verifySignature = (message, signature, address) => {
    const messageHash = utils.hashMessage(message);
    const recoveredAddress = utils.recoverAddress(messageHash, signature);
    return utils.isAddress(address) && address.toLowerCase() === recoveredAddress.toLowerCase(); 
}

module.exports = verifySignature;