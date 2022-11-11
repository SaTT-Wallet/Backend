;(async function () {
    require('dotenv').config()
    const mongoose = require('mongoose')

    const { mongoConnection } = require('./conf/config')

    let connect
    try {
        connect = mongoose.connect(mongoConnection().mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        console.log(mongoConnection().mongoURI)

        console.log(mongoConnection().mongoBase)
        console.log('******connection establed to MongoServer*******')
    } catch (error) {
        console.log('there is no connection')
        console.log(error)
    }
    module.exports.connect = connect

    const { CampaignLink } = require('./model/index')

    const {
        web3UrlBep20,
        CampaignConstants,
        Bep20NetworkConstant,
    } = require('./conf/const')

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

    const Web3 = require('web3')
    let web3 = await new Web3(
        new Web3.providers.HttpProvider(web3UrlBep20, options)
    )

    var ctr = new web3.eth.Contract(
        CampaignConstants[Bep20NetworkConstant].abi,
        CampaignConstants[Bep20NetworkConstant].address
    )

    const cursor = CampaignLink.find().cursor()
    var nblinks = 0
    for (
        let link = await cursor.next();
        link != null;
        link = await cursor.next()
    ) {
        var ctrLink = await ctr.methods.proms(link.id_prom).call()
        if (!ctrLink.isAccepted && link.status) {
            link.status = false
            link.type = 'waiting_for_validation'
            link.abosNumber = 0
            link.save()
        }
        console.log(++nblinks)
    }
})()
