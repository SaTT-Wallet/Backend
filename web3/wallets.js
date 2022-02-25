const { Wallet, CustomToken } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const { erc20Connexion, bep20Connexion } = require('../blockchainConnexion')

var rp = require('request-promise')
const Big = require('big.js')

const { Constants } = require('../conf/const2')
const { Tokens, token200 } = require('../conf/config1')
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

exports.filterAmount = function (input, nbre = 10) {
    if (input) {
        var out = input
        let size = input.length
        let toAdd = parseInt(nbre) - parseInt(size)

        if (input == 0) {
            toAdd--
        }
        if (toAdd > 0) {
            if (input.includes('.')) {
                for (let i = 0; i < toAdd; i++) {
                    out += '0'
                }
            } else {
                out += '.'
                for (let i = 0; i < toAdd; i++) {
                    out += '0'
                }
            }
        } else if (toAdd < 0) {
            if (input.includes('.')) {
                if (input.split('.')[0].length > nbre) {
                    out = input.substring(0, nbre)
                } else {
                    out = input.substring(0, nbre)
                    if (out[nbre - 1] == '.') {
                        out = input.substring(0, nbre - 1)
                    }
                }
            }
        }

        return out
    } else {
        return '-'
    }
}

exports.getBalance = async (Web3, token, address) => {
    try {
        let contract = new Web3.eth.Contract(Constants.token.abi, token)
        amount = await contract.methods.balanceOf(address).call()

        return amount.toString()
    } catch (err) {
        return '0'
    }
}

exports.getListCryptoByUid = async (req, res) => {
    let id = req.user._id
    let crypto = await this.getPrices()
    var listOfCrypto = []
    try {
        var token_info = Object.assign({}, Tokens)
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

            let Web3ETH = await erc20Connexion()
            let Web3BEP20 = await bep20Connexion()

            let balance = {}
            if (network == 'ERC20') {
                balance.amount = await this.getBalance(
                    Web3ETH,
                    token_info[T_name].contract,
                    ret.address
                )
            } else {
                balance.amount = await this.getBalance(
                    Web3BEP20,
                    token_info[T_name].contract,
                    ret.address
                )
            }

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
                    this.filterAmount(
                        new Big(balance['amount'])
                            .div((10 ** +token_info[T_name].dicimal).toString())
                            .toNumber() + ''
                    ) *
                    CryptoPrices[key].price *
                    1
            }
            crypto.quantity = this.filterAmount(
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
                crypto.contract = Constants.token.satt
            } else if (tokenSymbol == 'BNB') {
                crypto.name = 'BNB'
                crypto.network = 'BEP20'
            }
            ;[crypto.symbol, crypto.undername, crypto.undername2] =
                Array(3).fill(tokenSymbol)
            crypto.price = CryptoPrices[tokenSymbol].price
            crypto.variation = CryptoPrices[tokenSymbol].percent_change_24h

            crypto.total_balance =
                this.filterAmount(
                    new Big(await ret[Amount])
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
            crypto.quantity = new Big(await ret[Amount])
                .div(new Big(10).pow(decimal))
                .toNumber()
                .toFixed(8)
            listOfCrypto.push(crypto)
        }

        return { listOfCrypto }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.getBalanceByUid = async (req, res) => {
    try {
        var userId = req.user._id
        let crypto = await this.getPrices()

        var [Total_balance, CryptoPrices] = [0, crypto]
        var token_info = Object.assign({}, Tokens)
        delete token_info['SATT']
        delete token_info['BNB']

        let ret = await this.getAccount(req, res)
        delete ret.btc
        delete ret.version

        let userTokens = await CustomToken.find({
            sn_users: { $in: [userId] },
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

        for (const T_name in token_info) {
            var network = token_info[T_name].network

            let Web3ETH = await erc20Connexion()
            let Web3BEP20 = await bep20Connexion()

            let balance = {}
            if (network == 'ERC20') {
                balance.amount = await this.getBalance(
                    Web3ETH,
                    token_info[T_name].contract,
                    ret.address
                )
            } else {
                balance.amount = await this.getBalance(
                    Web3BEP20,
                    token_info[T_name].contract,
                    ret.address
                )
            }

            let key = T_name.split('_')[0]
            if (
                token_info[T_name].contract ==
                    token_info['SATT_BEP20'].contract ||
                token_info[T_name].contract == token_info['WSATT'].contract
            ) {
                key = 'SATT'
            }
            if (CryptoPrices.hasOwnProperty(key)) {
                Total_balance +=
                    this.filterAmount(
                        new Big(balance['amount'] * 1)
                            .div((10 ** +token_info[T_name].dicimal).toString())
                            .toNumber() + ''
                    ) * CryptoPrices[key].price
            }
        }

        delete ret.address
        for (const Amount in ret) {
            let tokenSymbol = Amount.split('_')[0].toUpperCase()
            tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol

            let decimal = tokenSymbol === 'BTC' ? 8 : 18

            Total_balance +=
                this.filterAmount(
                    new Big((await ret[Amount]) * 1)
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
        }

        Total_balance = Total_balance.toFixed(2)

        return { Total_balance }
    } catch (err) {
        console.log(err)
        //    return responseHandler.makeResponseError(
        // 		 res,
        // 		 500,
        // 		 err.message ? err.message : err.error
        // 		 )
    }
}

exports.transfer = async (token, to, amount, credentials) => {
    try {
        var contract = new app.web3.eth.Contract(
            app.config.ctrs.token.abi,
            token
        )
        var gasPrice = await app.web3.eth.getGasPrice()
        var gas = 60000
        //await contract.methods.transfer(to,amount).estimateGas({from:credentials.address})

        var receipt = await contract.methods.transfer(to, amount).send({
            from: credentials.address,
            gas: gas,
            gasPrice: gasPrice,
        })

        var tx = await app.web3.eth.getTransaction(receipt.transactionHash)
        tx.txtype = token
        tx.apiversion = 2
        tx.date = Date.now()
        tx.networkid = app.config.blockChain
        tx.from = credentials.address
        tx.to = to.toLowerCase()
        tx.from_id = credentials.from_id
        tx.value = amount
        tx.gasPrice = gasPrice
        app.db.txs().insertOne(tx)

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: to,
            amount,
        }
        console.log(
            'erManager.transfer',
            credentials.address,
            `transfer confirmed transactionHash :${receipt.transactionHash} ${amount} to ${to}`
        )
    } catch (err) {
        console.log(err)
    }
}
