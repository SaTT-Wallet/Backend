var Web3 = require('web3')
const {
    Constants,
    erc20TokenCampaigns,
    bep20TokenCampaigns,
    web3UrlBep20,
    web3Url,
} = require('./conf/const')
const { Campaigns, Event } = require('./model/index')
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
        return await new Web3(new Web3.providers.HttpProvider(web3Url, options))
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.getContractByToken = async (token, credentials) => {
    try {
        let abiCampaign = Constants.campaign.abi
        if (erc20TokenCampaigns.includes(token.toLowerCase())) {
            var contract = new credentials.Web3ETH.eth.Contract(
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

exports.getCampaignContractByHashCampaign = async (
    hash,
    credentials = false
) => {
    try {
        var campaign = await Campaigns.findOne({ hash }, { contract: 1 })
        if (campaign?.contract)
            return this.getContractCampaigns(campaign.contract, credentials)
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

        return this.getContractCampaigns(prom.contract, credentials)
    } catch (err) {
        console.log(err.message)
    }
}

exports.getContractCampaigns = async (contract, credentials = false) => {
    try {
        let abi = Constants.campaign.abi
        let Web3ETH = credentials?.Web3ETH
            ? credentials?.Web3ETH
            : await this.erc20Connexion()
        let Web3BEP20 = credentials?.Web3BEP20
            ? credentials.Web3BEP20
            : await this.bep20Connexion()

        let Web3 =
            contract.toLowerCase() ===
            Constants.campaign.address.campaignErc20.toLowerCase()
                ? Web3ETH
                : Web3BEP20
        let ctr = new Web3.eth.Contract(abi, contract)
        ctr.getGasPrice = await Web3.eth.getGasPrice
        return ctr
    } catch (err) {
        console.log(err.message)
    }
}

exports.getContract = async (address) => {
    if (address) {
        let abi = Constants.campaign.abi
        let Web3 =
            address.toLowerCase() ===
            Constants.campaign.address.campaignErc20.toLowerCase()
                ? await this.erc20Connexion()
                : await this.bep20Connexion()
        let ctr = new Web3.eth.Contract(abi, address)
        ctr.getGasPrice = Web3.eth.getGasPrice
        return ctr
    }
}

exports.getOracleContractByCampaignContract = async (
    campaignContract,
    credentials = false
) => {
    try {
        let abi = Constants.oracle.abi
        if (credentials.Web3ETH && credentials.Web3BEP20) {
            var Web3ETH = credentials?.Web3ETH
            var Web3BEP20 = credentials.Web3BEP20
        } else {
            var Web3ETH = await this.erc20Connexion()
            var Web3BEP20 = await this.bep20Connexion()
        }

        if (
            campaignContract.toLowerCase() ===
            Constants.campaign.address.campaignErc20.toLowerCase()
        ) {
            Web3 = Web3ETH
            address = Constants.oracle.address.oracleErc20
        } else {
            Web3 = Web3BEP20
            address = Constants.oracle.address.oracleBep20
        }

        let ctr = new Web3.eth.Contract(abi, address)
        ctr.getGasPrice = await Web3.eth.getGasPrice
        return ctr
    } catch (err) {
        console.log(err.message)
    }
}
