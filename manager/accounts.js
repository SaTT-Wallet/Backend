const { Notification, User } = require('../model/index')

const { sendNotification } = require('./notification')

var rp = require('request-promise')

const { token200 } = require('../conf/config1')

exports.notificationManager = async (id, NotifType, label) => {
    let notification = {
        idNode: '0' + id,
        type: NotifType,
        status: 'done',
        label,
        isSeen: false,
        isSend: false,
        attachedEls: {
            id: id,
        },
        created: new Date(),
    }

    await Notification.create(notification)

    let user = await User.findOne({ _id: +id }).select('fireBaseAccessToken ')

    if (user.fireBaseAccessToken) {
        let data = {
            message: {
                token: user.fireBaseAccessToken,
                data: {
                    obj: JSON.stringify(notification),
                },
            },
        }
        await sendNotification(data)
    }
}

exports.manageTime = () => {
    var d = new Date()
    var date = d.getDate()
    var month = d.getMonth() + 1
    var year = d.getFullYear()
    var seconds = d.getSeconds()
    var minutes = d.getMinutes()
    var hour = d.getHours()
    return year + '-' + month + '-' + ' ' + hour + ':' + minutes + ':' + seconds
}

exports.differenceBetweenDates = (authDate, dateNow) => {
    return Math.ceil(Math.abs(dateNow * 1000 - authDate * 1000) / 60000)
}

exports.updateAndGenerateCode = async (_id, type) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000)
        let secureCode = {}
        ;(secureCode.code = code),
            (secureCode.expiring = Date.now() + 3600 * 20 * 5),
            (secureCode.type = type)
        await User.updateOne({ _id }, { $set: { secureCode } })
        return code
    } catch (e) {
        reject({ message: e.message })
    }
}

exports.getPrices = async () => {
    var options = {
        method: 'GET',
        uri:
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD&CMC_PRO_API_KEY=' +
            process.env.CMCAPIKEY,

        json: true,
    }

    var options2 = {
        method: 'GET',
        uri:
            'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SATT%2CJET&convert=USD&CMC_PRO_API_KEY=' +
            process.env.CMCAPIKEY,

        json: true,
    }

    var result = await rp(options)
    var response = result

    var result2 = await rp(options2)
    var responseSattJet = result2

    response.data.push(responseSattJet.data.SATT)
    response.data.push(responseSattJet.data.JET)

    var priceMap = response.data.map((elem) => {
        var obj = {}
        obj = {
            symbol: elem.symbol,
            name: elem.name,
            price: elem.quote.USD.price,
            percent_change_24h: elem.quote.USD.percent_change_24h,
            market_cap: elem.quote.USD.market_cap,
            volume_24h: elem.quote.USD.volume_24h,
            circulating_supply: elem.circulating_supply,
            total_supply: elem.total_supply,
            max_supply: elem.max_supply,
            logo:
                'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
                elem.id +
                '.png',
        }

        return obj
    })
    var finalMap = {}
    for (var i = 0; i < priceMap.length; i++) {
        finalMap[priceMap[i].symbol] = priceMap[i]
        delete finalMap[priceMap[i].symbol].symbol
    }

    for (var i = 0; i < token200.length; i++) {
        var token = token200[i]

        if (finalMap[token.symbol]) {
            finalMap[token.symbol].network = token.platform.network
            finalMap[token.symbol].tokenAddress = token.platform.token_address
            finalMap[token.symbol].decimals = token.platform.decimals
        }
    }

    response.data = finalMap

    return finalMap
}
