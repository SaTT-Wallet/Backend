const Web3 = require('web3')

const options = {
    timeout: 30000,

    clientConfig: {
        // Useful if requests are large
        maxReceivedFrameSize: 100000000, // bytes - default: 1MiB
        maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

        // Useful to keep a connection alive
        keepalive: true,
        keepaliveInterval: 60000, // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false,
    },
}

const networkProviders = {
    ETH: process.env.WEB3_URL,
    BSC: process.env.WEB3_URL_BEP20,
    POLYGON: process.env.WEB3_URL_POLYGON,
    BTTC: process.env.WEB3_URL_BTT,
}

const networkProvidersOptions = {
    ETH: options,
    BSC: options,
    POLYGON: options,
    BTTC: options,
}

const getWeb3Connection = function (providerUrl, providerOptions) {
    return new Web3(getHttpProvider(providerUrl, providerOptions))
}

const getHttpProvider = function (providerUrl, providerOptions) {
    return new Web3.providers.HttpProvider(providerUrl, providerOptions)
}

module.exports = {
    getWeb3Connection,
    getHttpProvider,
    networkProviders,
    networkProvidersOptions,
}
