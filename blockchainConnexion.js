var Web3 = require('web3')
const {
    web3UrlBep20,
    web3UrlBTT,
    web3Url,
    web3PolygonUrl,
    CampaignConstants,
    OracleConstants,
} = require('./conf/const')
const { Campaigns, Event } = require('./model/index')
const { TronConstant } = require('./conf/const')
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
        let Web3 = require('web3')
        let web3 = await new Web3(
            new Web3.providers.HttpProvider(web3UrlBep20, options)
        )
        await web3.eth.getNodeInfo()
        return web3
    } catch (err) {
        console.log('bsc web3 error', err.message ? err.message : err.error)
        return null
    }
}

exports.erc20Connexion = async () => {
    try {
        let Web3 = require('web3')
        let web3 = await new Web3(
            new Web3.providers.HttpProvider(web3Url, options)
        )
        await web3.eth.getNodeInfo()
        return web3
    } catch (err) {
        console.log('eth web3 error', err.message ? err.message : err.error)
        return null
    }
}

exports.polygonConnexion = async () => {
    try {
        let Web3 = require('web3')
        let web3 = await new Web3(
            new Web3.providers.HttpProvider(web3PolygonUrl, options)
        )
        await web3.eth.getNodeInfo()
        return web3
    } catch (err) {
        console.log('polygon web3 error', err.message ? err.message : err.error)
        return null
    }
}
exports.bttConnexion = async () => {
    try {
        let Web3 = require('web3')
        let web3 = await new Web3(
            new Web3.providers.HttpProvider(web3UrlBTT, options)
        )
        await web3.eth.getNodeInfo()
        return web3
    } catch (err) {
        console.log('bttc web3 error', err.message ? err.message : err.error)
        return null
    }
}

exports.webTronInstance = async () => {
    try {
        const TronWeb = require('tronweb')
        const tronWeb = new TronWeb({
            fullHost: process.env.TRON_NETWORK_URL,
            headers: { 'TRON-PRO-API-KEY': process.env.TRON_PRO_API_KEY },
        })
        return tronWeb
    } catch (err) {
        console.log('tron rpc error', err.message ? err.message : err.error)
    }
}

exports.getContractByNetwork = async (credentials) => {
    try {
        var contract = new credentials.WEB3.eth.Contract(
            CampaignConstants[credentials.network.toUpperCase()].abi,
            CampaignConstants[credentials.network.toUpperCase()].address
        )
        contract.getGasPrice = credentials.WEB3.eth.getGasPrice

        return contract
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.getCampaignContractByHashCampaign = async (
    hash,
    credentials = false,
    tronWeb = null
) => {
    try {
        var campaign = await Campaigns.findOne({ hash }, { contract: 1 })
        if (campaign?.contract) {
            if (!!tronWeb) {
                let ctr = await tronWeb.contract(
                    TronConstant.campaign.abi,
                    TronConstant.campaign.address
                )
                return ctr
            }
            credentials.network = campaign.token.type
            return this.getContractByNetwork(credentials)
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.getPromContract = async (idProm, credentials = false) => {
    try {
        var prom = await Event.findOne(
            { prom: idProm },
            { contract: 1, _id: 0 }
        )

        return this.getContractByNetwork(credentials)
    } catch (err) {
        console.log('err prom', err.message)
    }
}

exports.getCampaignOwnerAddr = async (idProm) => {
    try {
        var prom = await Event.findOne(
            { prom: idProm },
            { contract: 1, _id: 0 }
        )
        if (!prom.contract) return

        return process.env.CAMPAIGN_OWNER
    } catch (err) {
        console.log(err)
    }
}

exports.getOracleContractByCampaignContract = async (credentials = false) => {
    try {
        var contract = new credentials.WEB3.eth.Contract(
            OracleConstants[credentials.network.toUpperCase()].abi,
            OracleConstants[credentials.network.toUpperCase()].address
        )
        contract.getGasPrice = credentials.WEB3.eth.getGasPrice

        return contract
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}
