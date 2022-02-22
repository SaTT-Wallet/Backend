var Web3 = require('web3')

app = await require('./conf/config')(app)
app = await require('./conf/const')(app)
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
        return new Web3(
            new Web3.providers.HttpProvider(app.config.web3UrlBep20, options)
        )
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.erc20Connexion = async () => {
    try {
        return  new Web3(
            new Web3.providers.WebsocketProvider(app.config.web3Url, options)
        )
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}

exports.getContractByToken = async (token) => {
    try {
        let abiCampaign=app.config.ctrs.campaign.abi;
        if( token.toLowerCase() in app.config.erc20TokenCampaigns){
          var contract = erc20Connexion.eth.Contract(
            abiCampaign,
            app.config.ctrs.campaign.address.erc20
          )
          contract.getGasPrice = erc20Connexion.eth.getGasPrice
        } 
        else if( token.toLowerCase() in app.config.bep20TokenCampaigns){
          var contract = new this.erc20Connexion.eth.Contract(
            abiCampaign,
            app.config.ctrs.campaign.address.bep20
          )
          contract.getGasPrice = erc20Connexion.eth.getGasPrice
        }
      return contract 
    } catch (err) {
        console.log(err.message ? err.message : err.error)
    }
}