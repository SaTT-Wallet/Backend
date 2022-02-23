var Web3 = require('web3')
const {
    Constants,
    erc20TokenCampaigns,
    bep20TokenCampaigns,
    web3UrlBep20,
    web3Url,
} = require('./conf/const2')

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
exports.bep20Connexion = async () => {
    try {
        return new Web3(new Web3.providers.HttpProvider(web3UrlBep20, options))
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.erc20Connexion = async () => {
    try {
        return await new Web3(
            new Web3.providers.WebsocketProvider(web3Url, options)
        )
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.getContractByToken = async (token, credentials) => {
    try {
        let abiCampaign = Constants.campaign.abi

        if (erc20TokenCampaigns.includes(token.toLowerCase())) {
            var contract = credentials.Web3ETH.eth.Contract(
                abiCampaign,
                Constants.campaign.address.campaignErc20
            )
            contract.getGasPrice = credentials.Web3ETH.eth.getGasPrice
        } else if (bep20TokenCampaigns.includes(token.toLowerCase())) {
            var contract = new credentials.Web3BEP20.eth.Contract(
                abiCampaign,
                Constants.campaign.address.campaignBep20
            )
            contract.getGasPrice = credentials.Web3BEP20.eth.getGasPrice
        }
        return contract
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}
