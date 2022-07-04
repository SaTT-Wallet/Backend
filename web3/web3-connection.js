const Web3 = require('web3')

const networkProviders = {
    ETH: process.env.WEB3_URL,
    BSC: process.env.WEB3_URL_BEP20,
    POLYGON: process.env.WEB3_URL_POLYGON,
}

const getProvider = function (network) {
    return new Web3.providers.HttpProvider(networkProviders[network])
}

const getWeb3Connection = function (provider) {
    return new Web3(provider)
}

const ethProvider = getProvider(networkProviders.ETH)
const bscProvider = getProvider(networkProviders.BSC)
const polygonProvider = getProvider(networkProviders.POLYGON)

const web3Connection = {
    ethereum: getWeb3Connection(ethProvider),
    bschain: getWeb3Connection(bscProvider),
    polygon: getWeb3Connection(polygonProvider),
}

module.exports = web3Connection
