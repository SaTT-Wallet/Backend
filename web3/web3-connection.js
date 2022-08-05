const Web3 = require('web3')

const networkProviders = {
    ETH: process.env.WEB3_URL,
    BSC: process.env.WEB3_URL_BEP20,
    POLYGON: process.env.WEB3_URL_POLYGON,
    BTTC: process.env.WEB3_URL_BTT,
}

const getWeb3Connection = function (provider) {
    return new Web3(provider)
}

const getHttpProvider = function (providerUrl) {
    return new Web3.providers.HttpProvider(providerUrl)
}

module.exports = {
    getWeb3Connection,
    getHttpProvider,
    networkProviders,
}
