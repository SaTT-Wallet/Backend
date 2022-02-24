const { Wallet, CustomToken } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const { erc20Connexion, bep20Connexion } = require('../blockchainConnexion')

const { Constants } = require('../conf/const2')
const { Tokens } = require('../conf/config1').getToken
console.log(Tokens)
exports.unlock = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })

        let Web3ETH = await erc20Connexion()
        let Web3BEP20 = await bep20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3ETH, Web3BEP20 }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.lock = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.lockERC20 = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
}

exports.lockBEP20 = async (credentials) => {
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
}

exports.exportkeyBtc = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        try {
            var Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
            return account.btc.ek
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = { Web3ETH, address: '0x' + account.keystore.address }
            this.lockERC20(cred)
        }
    } else {
        return responseHandler.makeResponseError(res, 404, 'Account not found')
    }
}
exports.exportkey = async function (req, res) {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        try {
            var Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
            return account.keystore
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = { Web3ETH, address: '0x' + account.keystore.address }
            this.lockERC20(cred)
        }
    } else {
        res.status(404).send('Account not found')
    }
}

exports.getAccount = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId })

    if (account) {
        var address = '0x' + account.keystore.address
        let Web3ETH = await erc20Connexion()
        let Web3BEP20 = await bep20Connexion()
        var ether_balance = Web3ETH.eth.getBalance(address)

        var bnb_balance = Web3BEP20.eth.getBalance(address)

        contractSatt = new Web3ETH.eth.Contract(
            Constants.token.abi,
            Constants.token.satt
        )

        var satt_balance = await contractSatt.methods.balanceOf(address).call()

        var result = {
            address: '0x' + account.keystore.address,
            ether_balance: ether_balance,
            bnb_balance: bnb_balance,
            satt_balance: satt_balance ? satt_balance.toString() : 0,
            version: account.mnemo ? 2 : 1,
        }
        result.btc_balance = 0
        if (
            process.env.NODE_ENV === 'mainnet' &&
            account.btc &&
            account.btc.addressSegWitCompat
        ) {
            result.btc = account.btc.addressSegWitCompat

            try {
                var utxo = JSON.parse(
                    child.execSync(
                        app.config.btcCmd +
                            ' listunspent 1 1000000 \'["' +
                            account.btc.addressSegWitCompat +
                            '"]\''
                    )
                )

                if (!utxo.length) result.btc_balance = '0'
                else {
                    var red = utxo.reduce(function (r, cur) {
                        r.amount += parseFloat(cur.amount)
                        return r
                    })
                    result.btc_balance = Math.floor(red.amount * 100000000)
                }
            } catch (e) {
                result.btc_balance = 0
            }
        }

        return result
    } else {
        return res.status(401).end('Account not found')
    }
}

exports.getPrices = () => {
    if (
        app.prices.status &&
        Date.now() - new Date(app.prices.status.timestamp).getTime() < 1200000
    ) {
        return app.prices.data
    } else {
        var r = child.execSync(
            'curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD&CMC_PRO_API_KEY=' +
                app.config.cmcApiKey +
                '"'
        )
        var response = JSON.parse(r)
        var r2 = child.execSync(
            'curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SATT%2CJET&convert=USD&CMC_PRO_API_KEY=' +
                app.config.cmcApiKey +
                '"'
        )
        var responseSattJet = JSON.parse(r2)
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

        for (var i = 0; i < app.config.token200.length; i++) {
            var token = app.config.token200[i]
            if (finalMap[token.symbol]) {
                finalMap[token.symbol].network = token.platform.network
                finalMap[token.symbol].tokenAddress =
                    token.platform.token_address
                finalMap[token.symbol].decimals = token.platform.decimals
            }
        }
    }
    response.data = finalMap
    app.prices = response

    return finalMap
}

exports.getListCryptoByUid = async (req, res) => {
    let id = req.user._id
    let crypto = this.getPrices()
    try {
        console.log('start')

        console.log(app.config.Tokens)
        let listOfCrypto = []
        var token_info = Object.assign({}, app.config.Tokens)
        let sattContract = token_info['SATT'].contract
        delete token_info['SATT']
        delete token_info['BNB']
        var CryptoPrices = crypto

        var ret = await this.getAccount(req, res)

        delete ret.btc
        delete ret.version

        let userTokens = await CustomToken.find({
            sn_users: { $in: [id] },
        })
        if (userTokens.length) {
            for (let i = 0; i < userTokens.length; i++) {
                let symbol = userTokens[i].symbol
                if (token_info[symbol])
                    symbol = `${symbol}_${userTokens[i].network}`
                token_info[symbol] = {
                    dicimal: Number(userTokens[i].decimal),
                    symbol: userTokens[i].symbol,
                    network: userTokens[i].network,
                    contract: userTokens[i].tokenAdress,
                    name: userTokens[i].tokenName,
                    picUrl: userTokens[i].picUrl,
                    addedToken: true,
                }
            }
        }
        for (let T_name in token_info) {
            let network = token_info[T_name].network
            let crypto = {}
            crypto.picUrl = token_info[T_name].picUrl || false
            crypto.symbol = token_info[T_name].symbol.split('_')[0]
            crypto.name = token_info[T_name].name
            crypto.AddedToken = token_info[T_name].addedToken
                ? token_info[T_name].contract
                : false
            crypto.contract = token_info[T_name].contract
            crypto.decimal = token_info[T_name].dicimal
            crypto.network = network
            crypto.undername = token_info[T_name].undername
            crypto.undername2 = token_info[T_name].undername2
            ;[crypto.price, crypto.total_balance] = Array(2).fill(0.0)

            let networkToken = network == 'ERC20' ? app.erc20 : app.bep20
            let balance = await networkToken.getBalance(
                token_info[T_name].contract,
                ret.address
            )

            let key = T_name.split('_')[0]

            if (
                token_info[T_name].contract ==
                    token_info['SATT_BEP20'].contract ||
                token_info[T_name].contract == token_info['WSATT'].contract
            ) {
                key = 'SATT'
            }
            if (key == 'WBNB') key = 'BNB'
            if (CryptoPrices.hasOwnProperty(key)) {
                crypto.price = CryptoPrices[key].price
                crypto.variation = CryptoPrices[key].percent_change_24h
                crypto.total_balance =
                    app.token.filterAmount(
                        new Big(balance['amount'])
                            .div((10 ** +token_info[T_name].dicimal).toString())
                            .toNumber() + ''
                    ) *
                    CryptoPrices[key].price *
                    1
            }
            crypto.quantity = app.token.filterAmount(
                new Big(balance['amount'] * 1)
                    .div((10 ** +token_info[T_name].dicimal).toString())
                    .toNumber()
            )

            listOfCrypto.push(crypto)
        }
        delete ret.address
        for (const Amount in ret) {
            let crypto = {}
            let tokenSymbol = Amount.split('_')[0].toUpperCase()
            let decimal = tokenSymbol === 'BTC' ? 8 : 18
            tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol
            if (tokenSymbol == 'BTC') {
                crypto.name = 'Bitcoin'
                crypto.network = 'BTC'
            }
            if (tokenSymbol == 'ETH') {
                crypto.name = 'Ethereum'
                crypto.network = 'ERC20'
            }
            if (tokenSymbol == 'SATT') {
                crypto.name = 'SaTT'
                crypto.network = 'ERC20'
                crypto.contract = sattContract
            } else if (tokenSymbol == 'BNB') {
                crypto.name = 'BNB'
                crypto.network = 'BEP20'
            }
            ;[crypto.symbol, crypto.undername, crypto.undername2] =
                Array(3).fill(tokenSymbol)
            crypto.price = CryptoPrices[tokenSymbol].price
            crypto.variation = CryptoPrices[tokenSymbol].percent_change_24h
            crypto.total_balance =
                app.token.filterAmount(
                    new Big(ret[Amount])
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
            crypto.quantity = new Big(ret[Amount])
                .div(new Big(10).pow(decimal))
                .toNumber()
                .toFixed(8)
            listOfCrypto.push(crypto)
        }

        console.log(listOfCrypto)
        return { listOfCrypto }
    } catch (err) {
        console.log(err)
        //        return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
    }
}
