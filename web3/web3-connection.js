const Web3 = require('web3')

const {
    Erc20NetworkConstant,
    Bep20NetworkConstant,
    PolygonNetworkConstant,
    BttNetworkConstant,
} = require('../conf/const')

const options = {
    timeout: 30000,

    clientConfig: {
        // Useful if requests are largeS
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

const networkProviders = {}

networkProviders[Erc20NetworkConstant] = process.env.WEB3_URL
networkProviders[Bep20NetworkConstant] = process.env.WEB3_URL_BEP20
networkProviders[PolygonNetworkConstant] = process.env.WEB3_URL_POLYGON
networkProviders[BttNetworkConstant] = process.env.WEB3_URL_BTT

const networkProvidersOptions = {}

networkProvidersOptions[Erc20NetworkConstant] = options
networkProvidersOptions[Bep20NetworkConstant] = options
networkProvidersOptions[PolygonNetworkConstant] = options
networkProvidersOptions[BttNetworkConstant] = options

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
