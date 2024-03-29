const { Wallet, User, CustomToken } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const {
    erc20Connexion,
    bep20Connexion,
    polygonConnexion,
    bttConnexion,
    tronConnexion,
    webTronInstance,
    artheraConnexion,
} = require('../blockchainConnexion')
const {
    getWeb3Connection,
    getHttpProvider,
    networkProviders,
    networkProvidersOptions,
} = require('./web3-connection')
var cache = require('memory-cache')
const { ethers } = require('ethers')

var rp = require('axios')
const Big = require('big.js')
var wif = require('wif')
const ecc = require('tiny-secp256k1')
const { BIP32Factory } = require('bip32')
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc)
//var bip32 = require('bip32')
var bip38 = require('bip38')
var bip39 = require('bip39')
var bitcoinjs = require('bitcoinjs-lib')
var ethUtil = require('ethereumjs-util')

const tronWeb = require('tronweb')

const {
    Constants,
    PolygonConstants,
    BttConstants,
    TronConstant,
    wrapConstants,
    multicallConstants,
    Erc20NetworkConstant,
} = require('../conf/const')

var child = require('child_process')

const {
    Tokens,
    token200,
    networkSegWitCompat,
    networkSegWit,
    pathBtcSegwitCompat,
    pathBtcSegwit,
    pathEth,
    pathTron,
} = require('../conf/config')
const { timeout } = require('../helpers/utils')
const { list } = require('tar')
const { result } = require('underscore')

exports.unlock = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        const sdk = require('api')('@tron/v4.5.1#7p0hyl5luq81q')
        let account = await Wallet.findOne({ UserId })

        let WEB3 = null
        if (req.body && req.body.network) {
            WEB3 = getWeb3Connection(
                networkProviders[req.body.network.toUpperCase()],
                networkProvidersOptions[req.body.network.toUpperCase()]
            )
            WEB3.eth.accounts.wallet.decrypt([account.keystore], pass)
        }

        let Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        let Web3POLYGON = await polygonConnexion()
        Web3POLYGON.eth.accounts.wallet.decrypt([account.keystore], pass)
        let web3UrlBTT = await bttConnexion()
        web3UrlBTT.eth.accounts.wallet.decrypt([account.keystore], pass)

        return {
            address: '0x' + account.keystore.address,
            tronAddress: account.tronAddress,
            Web3ETH,
            Web3BEP20,
            Web3POLYGON,
            web3UrlBTT,
            tronSdk: sdk,
            WEB3,
            network: req.body.network,
        }
    } catch (err) {
        if (!!res) {
            res.status(500).send({
                code: 500,
                error: err.message ? err.message : err.error,
            })
        }
        //return { error: err.message ? err.message : err.error }
    }
}

exports.unlockV2 = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        const sdk = require('api')('@tron/v4.5.1#7p0hyl5luq81q')
        let account = await Wallet.findOne({ UserId })
        let WEB3 = null
        if (req.body && req.body.network) {
            WEB3 = getWeb3Connection(
                networkProviders[req.body.network.toUpperCase()],
                networkProvidersOptions[req.body.network.toUpperCase()]
            )
            WEB3.eth.accounts.wallet.decrypt([account.walletV2.keystore], pass)
        }
        if (!account.walletV2.btc.addressSegWitCompat)
            return 'Wallet v2 not found'
        let Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.walletV2.keystore], pass)
        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.walletV2.keystore], pass)
        let Web3POLYGON = await polygonConnexion()
        Web3POLYGON.eth.accounts.wallet.decrypt(
            [account.walletV2.keystore],
            pass
        )
        let web3UrlBTT = await bttConnexion()
        web3UrlBTT.eth.accounts.wallet.decrypt(
            [account.walletV2.keystore],
            pass
        )
        return {
            address: '0x' + account.walletV2.keystore.address,
            tronAddress: account.tronAddress,
            Web3ETH,
            Web3BEP20,
            Web3POLYGON,
            web3UrlBTT,
            tronSdk: sdk,
            WEB3,
            network: req.body.network,
        }
    } catch (err) {
        if (!!res) {
            res.status(500).send({
                code: 500,
                error: err.message ? err.message : err.error,
            })
        }
        //return { error: err.message ? err.message : err.error }
    }
}

exports.unlockBsc = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })
        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3BEP20 }
    } catch (err) {
        if (!!res && res.length > 0) {
            res.status(500).send({
                code: 500,
                error: err.message ? err.message : err.error,
            })
        }
    }
}

exports.unlockArthera = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })
        let Web3ARTHERA = await artheraConnexion()
        Web3ARTHERA.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3ARTHERA }
    } catch (err) {
        if (!!res && res.length > 0) {
            res.status(500).send({
                code: 500,
                error: err.message ? err.message : err.error,
            })
        }
    }
}

exports.lockBSC = async (credentials) => {
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
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
            return account.btc?.ek
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = { Web3ETH, address: '0x' + account.keystore.address }
            this.lockERC20(cred)
        }
    } else {
        return responseHandler.makeResponseError(res, 204, 'Account not found')
    }
}

exports.exportkeyBtcV2 = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })
    if (account) {
        try {
            var Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt(
                [account.walletV2.keystore],
                pass
            )
            return account.walletV2.btc.ek
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        } finally {
            let cred = {
                Web3ETH,
                address: '0x' + account.walletV2.keystore.address,
            }
            this.lockERC20(cred)
        }
    } else {
        return responseHandler.makeResponseError(res, 204, 'Account not found')
    }
}

exports.exportkey = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        var Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], pass)
        return account.keystore
    } else {
        return 'Account not found'
    }
}

exports.exportkeyV2 = async (req, res) => {
    let id = req.user._id
    let pass = req.body.pass
    let account = await Wallet.findOne({ UserId: parseInt(id) }).lean()
    if (account) {
        if (!account?.walletV2?.keystore.address) return 'Wallet V2 not found'
        var Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.walletV2.keystore], pass)
        return account.walletV2.keystore
    } else {
        return 'Account not found'
    }
}

exports.exportWalletInfo = async (req, res) => {
    let id = req.user._id
    let account = await Wallet.findOne({ UserId: parseInt(id) })

    if (account) {
        return account
    } else {
        return 'Account not found'
    }
}

exports.getAccountV2 = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId }).lean()
    //const version = req.body.version
    if (account) {
        var address =
            (account?.walletV2?.keystore &&
                '0x' + account?.walletV2?.keystore?.address) ||
            '0x' + account?.keystore?.address
        let btcAddress =
            (account.walletV2?.btc &&
                account.walletV2?.btc?.addressSegWitCompat) ||
            account?.btc?.addressSegWitCompat
        let tronAddress =
            (account?.walletV2 && account?.walletV2?.tronAddress) ||
            account?.tronAddress
        //TODO: redundant code here we can get rid of it and pass the cred as parma to this function

        let [
            Web3ETH,
            Web3BEP20,
            Web3POLYGON,
            web3UrlBTT,
            tronWeb,
            web3Arthera,
        ] = await Promise.all([
            erc20Connexion(),
            bep20Connexion(),
            polygonConnexion(),
            bttConnexion(),
            webTronInstance(),
            artheraConnexion(),
        ])

        let contractSatt = null
        if (Web3ETH) {
            contractSatt = new Web3ETH.eth.Contract(
                Constants.token.abi,
                Constants.token.satt
            )
        }

        let tronPromise = !!tronAddress
            ? tronWeb?.trx.getBalance(tronAddress)
            : new Promise((resolve, reject) => {
                  resolve(null)
              })

        let sattPromise = !!contractSatt
            ? contractSatt.methods.balanceOf(address).call()
            : new Promise((resolve, reject) => {
                  resolve(null)
              })

        let [
            ether_balance,
            bnb_balance,
            polygon_balance,
            btt_balance,
            trx_balance,
            satt_balance,
            aa_balance,
        ] = await Promise.all([
            Web3ETH?.eth.getBalance(address),
            Web3BEP20?.eth.getBalance(address),
            Web3POLYGON?.eth.getBalance(address),
            web3UrlBTT?.eth.getBalance(address),
            tronPromise,
            sattPromise,
            web3Arthera?.eth.getBalance(address),
        ])
        let totalBalance =
            ether_balance +
            bnb_balance +
            polygon_balance +
            btt_balance +
            trx_balance +
            satt_balance +
            aa_balance
        var result = {
            btc: account.btc ? btcAddress : '',
            address: address,
            tronAddress: tronAddress,
            tronValue: account.tronValue,
            ether_balance: ether_balance,
            bnb_balance: bnb_balance,
            matic_balance: polygon_balance,
            // tron_balance:tron_balance,
            satt_balance: satt_balance,
            btt_balance: btt_balance,
            trx_balance: trx_balance,
            version: account.mnemo ? 2 : 1,
            aa_balance: aa_balance,
            totalBalance: totalBalance,
        }
        result.btc_balance = 0
        if (process.env.NODE_ENV === 'mainnet' && btcAddress) {
            result.btc = btcAddress

            try {
                var utxo = JSON.parse(
                    child.execSync(
                        process.env.BTC_CMD +
                            ' listunspent 1 1000000 \'["' +
                            btcAddress +
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
    } else if (Object.keys(res).length !== 0)
        return res.status(401).end('Account not found')
}

exports.getAccount = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId }).lean()

    if (account) {
        var address =
            (account.keystore && '0x' + account.keystore?.address) ||
            '0x' + account.walletV2?.keystore?.address

        let tronAddress = account?.tronAddress || account.walletV2?.tronAddress

        let btcAddress =
            (account.btc && account?.btc?.addressSegWitCompat) ||
            account.walletV2?.btc?.addressSegWitCompat

        //TODO: redundant code here we can get rid of it and pass the cred as parma to this function

        let [
            Web3ETH,
            Web3BEP20,
            Web3POLYGON,
            web3UrlBTT,
            tronWeb,
            web3Arthera,
        ] = await Promise.all([
            erc20Connexion(),
            bep20Connexion(),
            polygonConnexion(),
            bttConnexion(),
            webTronInstance(),
            artheraConnexion(),
        ])

        const contractSatt = Web3ETH
            ? new Web3ETH.eth.Contract(
                  Constants.token.abi,
                  Constants.token.satt
              )
            : null
        const tronPromise = tronAddress
            ? tronWeb?.trx.getBalance(tronAddress)
            : Promise.resolve(null)
        const sattPromise = contractSatt
            ? contractSatt.methods.balanceOf(address).call()
            : Promise.resolve(null)

        let [
            ether_balance,
            bnb_balance,
            polygon_balance,
            btt_balance,
            trx_balance,
            satt_balance,
            aa_balance,
        ] = await Promise.all([
            Web3ETH?.eth.getBalance(address),
            Web3BEP20?.eth.getBalance(address),
            Web3POLYGON?.eth.getBalance(address),
            web3UrlBTT?.eth.getBalance(address),
            tronPromise,
            sattPromise,
            web3Arthera?.eth.getBalance(address),
        ])

        var result = {
            btc: btcAddress,
            address: address,
            tronAddress: tronAddress,
            tronValue: account?.tronValue,
            ether_balance: ether_balance,
            bnb_balance: bnb_balance,
            matic_balance: polygon_balance,
            // tron_balance:tron_balance,
            satt_balance: satt_balance,
            btt_balance: btt_balance,
            trx_balance: trx_balance,
            aa_balance: aa_balance,
            version: account.mnemo ? 2 : 1,
        }

        result.btc_balance = 0
        if (process.env.NODE_ENV === 'mainnet' && btcAddress) {
            result.btc = btcAddress

            try {
                var utxo = JSON.parse(
                    child.execSync(
                        process.env.BTC_CMD +
                            ' listunspent 1 1000000 \'["' +
                            btcAddress +
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
    } else if (Object.keys(res).length !== 0)
        return res.status(401).end('Account not found')
}
exports.getAllWallets = async (req, res) => {
    let UserId = req.user._id

    let account = await Wallet.findOne({ UserId }).lean()

    if (account) {
        let address = account?.keystore?.address
            ? '0x' + account?.keystore?.address
            : null
        let tronAddress = account?.tronAddress || null
        let addressV2 = account?.walletV2?.keystore?.address
            ? '0x' + account?.walletV2?.keystore?.address
            : null
        let tronAddressV2 = account?.walletV2?.tronAddress || null
        let btcAddress = account?.btc?.addressSegWitCompat
        let btcAddressV2 = account?.walletV2?.btc?.addressSegWitCompat || null

        let result = {
            address,
            tronAddress,
            btcAddress,
            addressV2,
            tronAddressV2,
            btcAddressV2,
        }
        return result
    } else if (Object.keys(res).length !== 0)
        return res.status(401).end('Account not found')
}

const getNetworkByToken = async (idCrypto) => {
    try {
        if (cache.get('networks')) {
            return cache.get('networks').data
        } else {
            const idCryptoArray = idCrypto.split(',')
            const batchSize = 1000 // Number of cryptos per batch

            // Split the idCryptoArray into batches
            const batches = []
            for (let i = 0; i < idCryptoArray.length; i += batchSize) {
                const batch = idCryptoArray.slice(i, i + batchSize).join(',')
                batches.push(batch)
            }

            const results = []

            // Send requests for each batch concurrently using Promise.all
            await Promise.all(
                batches.map(async (batch) => {
                    const options = {
                        method: 'GET',
                        url: process.env.CMC_CRYPTO_DETAILS,
                        params: {
                            id: batch,
                        },
                        headers: {
                            'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                        },
                    }

                    try {
                        const result = await rp.request(options)
                        results.push(result)
                    } catch (err) {
                        console.log({ err })
                        // Handle the error as needed, e.g., retry or skip
                    }
                })
            )

            // Process the results
            const networksContract = results.flatMap((result) =>
                Object.values(result.data.data).map((innerObj) => ({
                    id: innerObj.id,
                    symbol: innerObj.symbol,
                    contract_address: innerObj.contract_address,
                    description: innerObj.description,
                    urls: innerObj.urls.website,
                }))
            )

            const networks = { data: networksContract, date: Date.now() }
            cache.put('networks', networks)

            return networksContract
        }
    } catch (err) {
        console.log({ err })
        throw new Error('Error fetching networks')
    }
}

exports.getPrices = async () => {
    try {
        if (
            cache.get('prices') &&
            Date.now() - new Date(cache.get('prices')?.date).getTime() < 1200000
        ) {
            return cache.get('prices').data
        } else {
            const options = {
                method: 'GET',
                url: process.env.CMC_URl,
                params: {
                    start: '1',
                    limit: '5000',
                    convert: 'USD',
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                },
            }

            const options2 = {
                method: 'GET',
                url: process.env.CMC_CRYPTO_URL,
                params: {
                    symbol: 'SATT,JET,BTT',
                    convert: 'USD',
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                },
            }

            let result

            try {
                result = await Promise.all([
                    rp.request(options),
                    rp.request(options2),
                ])
            } catch (error) {
                console.log({ error })
                throw new Error('Error fetching prices')
            }

            var response = result[0]

            var responseSattJet = result[1]
            response.data.data.push(responseSattJet.data.data.SATT)
            response.data.data.push(responseSattJet.data.data.JET)
            response.data.data.push(responseSattJet.data.data.BTT)
            let priceMap

            try {
                priceMap = response.data.data.map((elem) => {
                    var obj = {}
                    let tokenAddress = null
                    if (elem.platform?.name === 'BNB') {
                        tokenAddress = elem.platform?.token_address
                    }
                    if (elem.name === 'SaTT') {
                        obj = {
                            id: elem.id,
                            cmc_rank: elem.cmc_rank,
                            network:
                                (elem.platform?.name === 'BNB' && 'BEP20') ||
                                null,
                            networkSupported: [],
                            tokenAddress: tokenAddress,
                            symbol: elem.symbol,
                            name: elem.name,
                            price: elem?.quote.USD.price,
                            percent_change_24h:
                                elem?.quote.USD.percent_change_24h,
                            percent_change_1h:
                                elem?.quote.USD.percent_change_1h,
                            percent_change_7d:
                                elem?.quote.USD.percent_change_7d,
                            market_cap: elem?.quote.USD.market_cap,
                            volume_24h: elem?.quote.USD.volume_24h,
                            circulating_supply: elem.circulating_supply,
                            total_supply: elem.total_supply,
                            max_supply: elem.max_supply,
                            volume_change_24h: elem.quote.USD.volume_change_24h,
                            fully_diluted:
                                elem.quote.USD.fully_diluted_market_cap,
                            logo:
                                'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
                                elem.id +
                                '.png',
                        }
                    } else
                        obj = {
                            id: elem.id,
                            cmc_rank: elem.cmc_rank,
                            network:
                                (elem.platform?.name === 'BNB' && 'BEP20') ||
                                null,
                            networkSupported: [],
                            tokenAddress: tokenAddress,
                            symbol: elem.symbol,
                            name: elem.name,
                            price:
                                elem.symbol === 'AA'
                                    ? '0.5'
                                    : elem?.quote.USD.price,
                            percent_change_24h:
                                elem?.quote.USD.percent_change_24h,
                            percent_change_1h:
                                elem?.quote.USD.percent_change_1h,
                            percent_change_7d:
                                elem?.quote.USD.percent_change_7d,
                            market_cap: elem?.quote.USD.market_cap,
                            volume_24h: elem?.quote.USD.volume_24h,
                            circulating_supply: elem.circulating_supply,
                            total_supply: elem.total_supply,
                            max_supply: elem.max_supply,
                            fully_diluted:
                                elem.quote.USD.fully_diluted_market_cap,
                            market_cap: elem.quote.USD.market_cap,
                            percent_change_24h:
                                elem.quote.USD.percent_change_24h,
                            volume_change_24h: elem.quote.USD.volume_change_24h,
                            logo:
                                'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
                                elem.id +
                                '.png',
                        }

                    return obj
                })
            } catch (error) {
                throw new Error('Error fetching prices')
            }

            var finalMap = {}

            const idcrypto = priceMap.map((token) => token.id.toString())

            priceMap.forEach((token) => {
                finalMap[token.id] = {
                    ...token,
                    networkSupported: '',
                    description: '',
                    urls: '',
                    network: '',
                }
            })

            const networksContract = await getNetworkByToken(idcrypto.join(','))

            networksContract.forEach((network) => {
                if (finalMap[network.id]) {
                    const networkItem = (network.contract_address || []).find(
                        (item) =>
                            [
                                'Ethereum',
                                'BNB Smart Chain (BEP20)',
                                'Polygon',
                                'Tron20',
                            ].includes(item?.platform?.name)
                    )
                    const networkname = networkItem?.platform?.name || null
                    finalMap[network.id].network = networkname
                    finalMap[network.id].networkSupported =
                        network.contract_address
                    finalMap[network.id].description = network.description
                    finalMap[network.id].urls = network.urls
                }
            })

            for (var i = 0; i < token200.length; i++) {
                var token = token200[i]
                if (finalMap[token.symbol]) {
                    finalMap[token.symbol].tokenAddress =
                        token.platform.token_address
                    finalMap[token.symbol].decimals = token.platform.decimals
                }
            }
            let newCryptoPrices = {}
            for (const key in finalMap) {
                if (finalMap.hasOwnProperty(key)) {
                    const crypto = finalMap[key]
                    const symbol = crypto.symbol
                    newCryptoPrices[symbol] = crypto
                }
            }
            prices = { data: newCryptoPrices, date: Date.now() }
            cache.put('prices', prices)
            return newCryptoPrices
        }
    } catch (err) {
        throw new Error('Error fetching prices ')
    }
}

exports.getChart = async (id, range) => {
    try {
        const options = {
            method: 'GET',
            url: process.env.CMC_CRYPTO_CHART,
            params: {
                id: id,
                range: range,
            },
            headers: {
                'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
            },
        }

        try {
            result = await rp.request(options)

            return result.data.data.points
        } catch (error) {
            throw new Error('Error fetching charts')
        }
    } catch (err) {
        throw new Error('Error fetching prices ')
    }
}

exports.getallCryptoMarket = async (startVariable) => {
    try {
        if (
            cache.get('prices' + startVariable) &&
            Date.now() -
                new Date(cache.get('prices' + startVariable)?.date).getTime() <
                1200000
        ) {
            return cache.get('prices' + startVariable).data
        } else {
            const result = []

            for (let i = 0; i < 2; i++) {
                const options = {
                    method: 'GET',
                    url: process.env.CMC_URl,
                    params: {
                        start: i * 5000 + 1,
                        limit: '5000',
                        convert: 'USD',
                    },
                    headers: {
                        'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                    },
                }

                try {
                    const response = await rp(options)
                    result.push(response)
                } catch (error) {
                    throw new Error('Error fetching prices')
                }
            }

            let priceMap = []

            try {
                for (let i = 0; i < 2; i++) {
                    priceMap = priceMap.concat(
                        result[i].data.data.map((elem) => ({
                            id: elem.id,
                            cmc_rank: elem.cmc_rank,
                            symbol: elem.symbol,
                            name: elem.name,
                            price: elem?.quote.USD.price,
                            percent_change_24h:
                                elem?.quote.USD.percent_change_24h,
                            percent_change_1h:
                                elem?.quote.USD.percent_change_1h,
                            percent_change_7d:
                                elem?.quote.USD.percent_change_7d,
                            market_cap: elem?.quote.USD.market_cap,
                            volume_24h: elem?.quote.USD.volume_24h,
                            circulating_supply: elem.circulating_supply,
                            total_supply: elem.total_supply,
                            max_supply: elem.max_supply,
                            logo:
                                'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
                                elem.id +
                                '.png',
                        }))
                    )
                }

                // Sort the priceMap array by the "id" field in ascending order
                priceMap.sort((a, b) => a.id - b.id)
            } catch (error) {
                throw new Error('Error fetching prices')
            }

            var finalMap = {}
            for (var i = 0; i < priceMap.length; i++) {
                finalMap[priceMap[i].symbol] = priceMap[i]
                delete finalMap[priceMap[i].symbol].symbol
            }

            prices = { data: finalMap, date: Date.now() }
            cache.put('prices' + startVariable, prices)

            return finalMap
        }
    } catch (err) {}
}

exports.getChartVariation = async (cryptolist) => {
    try {
        if (
            cache.get('chart') &&
            Date.now() - new Date(cache.get('chart')?.date).getTime() < 86400000
        ) {
            return cache.get('chart').data
        } else {
            const endDate = Math.floor(Date.now() / 1000) // Current timestamp in seconds
            const startDate = endDate - 7 * 24 * 60 * 60
            const options = {
                method: 'GET',
                url: process.env.CMC_HISTORY_URL,
                params: {
                    id: cryptolist,
                    time_start: startDate,
                    time_end: endDate,
                    interval: 'hourly',
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                },
            }

            var results
            try {
                results = await Promise.all([rp.request(options)])
            } catch (error) {
                throw new Error('Error fetching prices chart')
            }
            var result = await results[0]

            var cryptoInfo
            var priceVariation = []

            cryptoInfo = result.data.data
            Object.values(cryptoInfo).forEach((innerObj) => {
                let sparkline_in_7d = innerObj.quotes.map((elem) => {
                    return elem.quote.USD.price
                })
                priceVariation.push({
                    id: innerObj.id,
                    name: innerObj.name,
                    sparkline_in_7d: sparkline_in_7d,
                })
            })

            chart = { data: priceVariation, date: Date.now() }
            cache.put('chart', chart)

            return priceVariation
        }
    } catch (err) {
        throw new Error('Error fetching prices char')
    }
}
exports.getGlobalCryptoMarket = async () => {
    try {
        if (
            cache.get('market') &&
            Date.now() - new Date(cache.get('market')?.date).getTime() <
                86400000
        ) {
            return cache.get('market').data
        } else {
            const options = {
                method: 'GET',
                url: process.env.CMC_GLOBL_URL,
                params: {
                    convert: 'USD',
                },
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                },
            }
            var result
            try {
                result = await Promise.all([rp.request(options)])
            } catch (err) {
                throw new Error('Error fetching Global Crypto Market Info')
            }
            market = {
                data: result[0]?.data?.data?.quote?.USD,
                date: Date.now(),
            }
            cache.put('market', market)
            return result[0]?.data?.data?.quote?.USD
        }
    } catch (err) {
        throw new Error('Error fetching Global Crypto Market Info')
    }
}

exports.filterAmount = function (input, nbre = 10) {
    try {
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
    } catch (err) {
        throw new Error('Error filterAmount')
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

exports.getBalanceExternalWallet = async (req, res) => {
    try {
        const { token, walletAddress } = req.body

        const networks = [
            { name: 'ethereum', providerUrl: process.env.WEB3_URL },
            { name: 'bsc', providerUrl: process.env.WEB3_URL_BEP20 },
            { name: 'polygon', providerUrl: process.env.WEB3_URL_POLYGON },
            { name: 'bttc', providerUrl: process.env.WEB3_URL_BTT },
        ]

        let balanceResponse

        for (const networkObj of networks) {
            try {
                const provider = new ethers.providers.JsonRpcProvider(
                    networkObj.providerUrl
                )
                const contract = new ethers.Contract(
                    token,
                    ['function balanceOf(address) view returns (uint256)'],
                    provider
                )

                const balance = await contract.balanceOf(walletAddress)
                const formattedBalance = ethers.utils.formatUnits(balance, 18)
                balanceResponse = {
                    balance: formattedBalance,
                    network: networkObj.name,
                }
                res.json(balanceResponse)
                return
            } catch (error) {
                console.error(
                    `Error fetching balance for ${networkObj.name}: ${error.message}`
                )
            }
        }

        res.status(500).json({
            error: 'An error occurred while fetching the balance for all networks.',
        })
    } catch (err) {
        res.status(500).json({
            error: 'An error occurred while setting up network connections.',
        })
    }
}

exports.multicall = async (tokens, addresses, network, web3) => {
    try {
        let contract = new web3.eth.Contract(
            multicallConstants[network].abi,
            multicallConstants[network].address
        )
        var adressesEncoded = []
        for (var i = 0; i < addresses.length; i++) {
            adressesEncoded.push(
                web3.eth.abi.encodeFunctionCall(Constants.token.abi[6], [
                    addresses[i],
                ])
            )
        }

        amounts = await contract.methods
            .multiCall(tokens, adressesEncoded)
            .call()

        return amounts
    } catch (err) {
        return new Array(tokens.length)
    }
}

// Helper function to get the Web3 instance based on the network
exports.getWeb3Instance = async (network) => {
    switch (network) {
        case 'bep20':
            return await bep20Connexion()
        case 'erc20':
            return await erc20Connexion()
        case 'polygon':
            return await polygonConnexion()
        case 'bttc':
            return await bttConnexion()
        case 'tron':
            return await webTronInstance()
        case 'arthera':
            return await artheraConnexion()
        default:
            throw new Error(`Invalid network: ${network}`)
    }
}

// Helper function to format token balance with decimals
exports.formatTokenBalance = (balance, decimals) => {
    return balance / 10 ** decimals
}

// Helper function to get native balance (ETH, TRX, etc.) and format it
exports.getNativeBalance = async (web3Instance, walletAddress, network) => {
    if (network === 'tron') {
        const account = await web3Instance.trx.getAccount(walletAddress)
        if (account && account.balance) {
            const balanceFormatted = web3Instance.fromSun(account.balance)
            return balanceFormatted
        }
        return '0'
    } else {
        const balanceWei = await web3Instance.eth.getBalance(walletAddress)
        const balanceFormatted = web3Instance.utils.fromWei(balanceWei, 'ether')
        return balanceFormatted
    }
}
exports.getArtheraBalance = async (token, address, isAA) => {
    try {
        const web3Arthera = await artheraConnexion()
        if (isAA) {
            let amount = await web3Arthera.eth.getBalance(address[0])
            return amount.toString()
        }
        //TODO verify the address because it doesnt work
        let ctr = await web3Arthera.contract(TronConstant.token.abi, token)
        let amount = await ctr.balanceOf(address).call()
        return amount.toString()
    } catch (err) {
        return '0'
    }
}

exports.getTronBalance = async (webTron, token, address, isTrx = false) => {
    try {
        if (isTrx) {
            let amount = await webTron.trx.getBalance(address)
            return amount.toString()
        }
        //TODO verify the address because it doesnt work
        let ctr = await webTron.contract(TronConstant.token.abi, token)
        let amount = await ctr.balanceOf(address).call()
        return amount.toString()
    } catch (err) {
        return '0'
    }
}

exports.getListCryptoByUid = async (req, res) => {
    let id = req.user._id
    const user = await User.findOne({ _id: id })
    let crypto = await this.getPrices()
    //list of first 200 crypto from coinmarketcap + satt + jet
    var listOfCrypto = []
    try {
        // token_info => env tokens without bnb, and satt
        var token_info = Object.assign({}, Tokens)
        delete token_info['SATT']
        delete token_info['BNB']

        // CryptoPrices =>  200 cryptos
        var CryptoPrices = crypto
        const migrated = !!req.user.migrated ? req.user.migrated : false
        let userIsNew = false
        if (req.body.version != 'v1' && req.body.version != 'v2' && !migrated) {
            const userWallet = await Wallet.findOne({
                UserId: req.user._id,
            }).lean()
            if (
                userWallet?.walletV2?.keystore?.address &&
                !userWallet?.keystore?.address
            )
                userIsNew = true
            else userIsNew = false
        }

        var ret =
            req.body.version === 'v2'
                ? await this.getAccountV2(req, res)
                : req.body.version === 'v1'
                ? await this.getAccount(req, res)
                : migrated
                ? await this.getAccountV2(req, res)
                : userIsNew
                ? await this.getAccountV2(req, res)
                : await this.getAccount(req, res)

        let tronAddress = ret.tronAddress
        delete ret.btc
        delete ret.version
        delete ret.tronAddress
        delete ret.tronValue
        // => userTokens : token ajoutés manuellemnt
        let userTokens = await CustomToken.find({
            sn_users: { $in: [id] },
        })

        if (userTokens.length) {
            for (let i = 0; i < userTokens.length; i++) {
                let symbol = userTokens[i].symbol
                // if added token exists in env tokens
                if (token_info[symbol])
                    symbol = `${symbol}_${userTokens[i].network}`
                token_info[symbol] = {
                    dicimal:
                        (!!Number(userTokens[i].decimal) &&
                            Number(userTokens[i].decimal)) ||
                        18,
                    symbol: userTokens[i].symbol,
                    network: userTokens[i].network,
                    contract: userTokens[i].tokenAdress,
                    name: userTokens[i].tokenName,
                    picUrl: userTokens[i].picUrl,
                    addedToken: true,
                    purchase: userTokens[i].purchase,
                }
            }
            // we have updated tokens env by custom tokens
        }

        let web3s = []
        let addressesByNetwork = []
        let tokensByNetwork = []
        let tokensInfosByNetwork = []
        let balancesBynetwork = []

        for (let T_name in token_info) {
            let network = token_info[T_name].network
            if (!web3s[network]) {
                web3s[network] = getWeb3Connection(
                    networkProviders[network],
                    networkProvidersOptions[network]
                )
                addressesByNetwork[network] = []
                tokensByNetwork[network] = []
                tokensInfosByNetwork[network] = []
            }
            tokensByNetwork[network].push(token_info[T_name].contract)
            addressesByNetwork[network].push(ret.address)

            let crypto = {}

            crypto.picUrl = token_info[T_name].picUrl || false
            crypto.symbol = token_info[T_name].symbol.split('_')[0]
            crypto.name = token_info[T_name].name
            crypto.AddedToken = token_info[T_name].addedToken
                ? token_info[T_name].contract
                : false
            crypto.contract = token_info[T_name].contract
            crypto.decimal = +token_info[T_name].dicimal
            crypto.network = network
            crypto.balance = 0
            crypto.undername = token_info[T_name].undername
            crypto.undername2 = token_info[T_name].undername2
            crypto.purchase = token_info[T_name].purchase
            ;[crypto.price, crypto.total_balance] = Array(2).fill(0.0)

            let key = T_name.split('_')[0]

            if (
                token_info[T_name]?.contract ==
                    token_info['SATT_BEP20']?.contract ||
                token_info[T_name]?.contract == token_info['WSATT']?.contract
            ) {
                key = 'SATT'
            }
            if (key == 'WBNB') key = 'BNB'
            crypto.key = key

            tokensInfosByNetwork[network].push(crypto)
        }
        for (let T_network in web3s) {
            if (web3s[T_network]) {
                if (T_network == 'TRON') {
                    const balanceTronList = []
                    for (let token of tokensInfosByNetwork[T_network]) {
                        const tronBalance = await this.getTronBalance(
                            await webTronInstance(),
                            token.contract,
                            tronAddress,
                            token.key === 'TRX' ? true : false
                        )
                        balanceTronList.push(tronBalance)
                    }
                    balancesBynetwork[T_network] = balanceTronList
                } else if (T_network == 'ARTHERA') {
                    const balanceArtheraList = []
                    for (let token of tokensInfosByNetwork[T_network]) {
                        const aaBalance = await this.getArtheraBalance(
                            token.contract,
                            addressesByNetwork[T_network],
                            token.key === 'AA' ? true : false
                        )
                        balanceArtheraList.push(aaBalance)
                    }
                    balancesBynetwork[T_network] = balanceArtheraList
                } else {
                    balancesBynetwork[T_network] = await this.multicall(
                        tokensByNetwork[T_network],
                        addressesByNetwork[T_network],
                        T_network,
                        web3s[T_network]
                    )
                }

                for (var i = 0; i < balancesBynetwork[T_network].length; i++) {
                    let crypto = tokensInfosByNetwork[T_network][i]

                    crypto.balance = balancesBynetwork[T_network][i]
                        ? web3s[Erc20NetworkConstant].utils
                              .toBN(balancesBynetwork[T_network][i])
                              .toString()
                        : '0'

                    if (CryptoPrices) {
                        if (CryptoPrices.hasOwnProperty(crypto.key)) {
                            crypto.price =
                                crypto.symbol === 'BTT'
                                    ? CryptoPrices[crypto.key].price.toFixed(10)
                                    : CryptoPrices[crypto.key].price
                            crypto.variation =
                                CryptoPrices[crypto.key].percent_change_24h
                            crypto.total_balance =
                                this.filterAmount(
                                    new Big(crypto.balance)
                                        .div((10 ** +crypto.decimal).toString())
                                        .toNumber() + ''
                                ) *
                                CryptoPrices[crypto.key].price *
                                1
                        }
                    }

                    crypto.quantity = this.filterAmount(
                        new Big(crypto.balance * 1)
                            .div((10 ** +crypto.decimal).toString())
                            .toNumber()
                    )
                    tokensInfosByNetwork[T_network][i] = crypto
                }
            }
        }

        for (let T_network in tokensInfosByNetwork) {
            listOfCrypto = listOfCrypto.concat(tokensInfosByNetwork[T_network])
        }
        delete ret.address
        delete ret.matic_balance
        delete ret.btt_balance
        delete ret.trx_balance
        delete ret.aa_balance
        delete ret.totalBalance

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
    } catch (err) {}
}

exports.getBalanceByUid = async (req, res) => {
    try {
        var userId = req.user._id
        let crypto = req.prices || (await this.getPrices())
        var user = await User.findOne({ _id: userId })
        var [Total_balance, CryptoPrices] = [0, crypto]
        var {
            SATT,
            BNB,
            BTT,
            TRX,
            MATIC,
            SATT_TRON,
            AA,
            SATT_BTT,
            ...token_info
        } = Tokens
        // var token_info = Object.assign({}, Tokens)
        // delete token_info['SATT']
        // delete token_info['BNB']
        // delete token_info['TRX']
        // delete token_info['MATIC']
        // delete token_info['BTT']

        var ret = (
            req.body.version === null
                ? !user.migrated
                : req.body.version === 'v1'
        )
            ? await this.getAccount(req, res)
            : await this.getAccountV2(req, res)
        let tronAddress = ret?.tronAddress
        delete ret?.btc
        delete ret?.tronAddress
        delete ret?.tronValue
        delete ret?.version

        let userTokens = await CustomToken.find({
            sn_users: { $in: [userId] },
        })

        if (userTokens.length) {
            for (let i = 0; i < userTokens.length; i++) {
                let symbol = userTokens[i].symbol
                if (token_info[symbol])
                    symbol = `${symbol}_${userTokens[i].network}`
                token_info[symbol] = {
                    dicimal:
                        (!!Number(userTokens[i].decimal) &&
                            Number(userTokens[i].decimal)) ||
                        18,
                    symbol: userTokens[i].symbol,
                    network: userTokens[i].network,
                    contract: userTokens[i].tokenAdress,
                    name: userTokens[i].tokenName,
                    picUrl: userTokens[i].picUrl,
                    addedToken: true,
                }
            }
        }

        let web3s = []
        let addressesByNetwork = []
        let tokensByNetwork = []
        let tokensInfosByNetwork = []
        let balancesBynetwork = []

        for (let T_name in token_info) {
            let network = token_info[T_name].network
            if (!web3s[network]) {
                web3s[network] = getWeb3Connection(
                    networkProviders[network],
                    networkProvidersOptions[network]
                )
                addressesByNetwork[network] = []
                tokensByNetwork[network] = []
                tokensInfosByNetwork[network] = []
            }
            tokensByNetwork[network].push(token_info[T_name].contract)
            addressesByNetwork[network].push(ret.address)

            let crypto = {}

            crypto.picUrl = token_info[T_name].picUrl || false
            crypto.symbol = token_info[T_name].symbol.split('_')[0]
            crypto.name = token_info[T_name].name
            crypto.AddedToken = token_info[T_name].addedToken
                ? token_info[T_name].contract
                : false
            crypto.contract = token_info[T_name].contract
            crypto.decimal = +token_info[T_name].dicimal
            crypto.network = network
            crypto.balance = 0
            crypto.undername = token_info[T_name].undername
            crypto.undername2 = token_info[T_name].undername2
            ;[crypto.price, crypto.total_balance] = Array(2).fill(0.0)

            let key = T_name.split('_')[0]

            if (
                token_info[T_name]?.contract ==
                    token_info['SATT_BEP20']?.contract ||
                token_info[T_name]?.contract == token_info['WSATT']?.contract
            ) {
                key = 'SATT'
            }
            if (key == 'WBNB') key = 'BNB'

            crypto.key = key

            tokensInfosByNetwork[network].push(crypto)
        }
        for (let T_network in web3s) {
            if (web3s[T_network]) {
                balancesBynetwork[T_network] = await this.multicall(
                    tokensByNetwork[T_network],
                    addressesByNetwork[T_network],
                    T_network,
                    web3s[T_network]
                )

                for (var i = 0; i < balancesBynetwork[T_network].length; i++) {
                    let crypto = tokensInfosByNetwork[T_network][i]

                    crypto.balance = balancesBynetwork[T_network][i]
                        ? web3s[Erc20NetworkConstant].utils
                              .toBN(balancesBynetwork[T_network][i])
                              .toString()
                        : '0'

                    if (CryptoPrices) {
                        if (CryptoPrices.hasOwnProperty(crypto.key)) {
                            Total_balance +=
                                this.filterAmount(
                                    new Big(
                                        (!!(crypto.balance * 1) &&
                                            crypto.balance * 1) ||
                                            0
                                    )
                                        .div((10 ** +crypto.decimal).toString())
                                        .toNumber() + ''
                                ) * CryptoPrices[crypto.key].price
                        }
                    }

                    crypto.quantity = this.filterAmount(
                        new Big(crypto.balance * 1)
                            .div((10 ** +crypto.decimal).toString())
                            .toNumber()
                    )
                }
            }
        }

        delete ret?.address
        delete ret?.totalBalance
        for (const Amount in ret) {
            let tokenSymbol = Amount.split('_')[0].toUpperCase()
            tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol

            let decimal =
                (tokenSymbol === 'BTC' && 8) ||
                (tokenSymbol === 'TRX' && 6) ||
                18
            let amount = ret[Amount] ? ret[Amount] : 0
            Total_balance +=
                this.filterAmount(
                    new Big(amount * 1)
                        .div(new Big(10).pow(decimal))
                        .toNumber() + ''
                ) * CryptoPrices[tokenSymbol].price
        }

        Total_balance = Total_balance.toFixed(2)

        return { Total_balance }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.getTokenContractByToken = async (token, credentials, network) => {
    if (network === 'POLYGON') {
        var contract = new credentials.Web3POLYGON.eth.Contract(
            PolygonConstants.token.abi,
            token
        )
        contract.getGasPrice = credentials.Web3ETH.eth.getGasPrice
    } else if (network === 'ERC20') {
        var contract = new credentials.Web3ETH.eth.Contract(
            Constants.token.abi,
            token
        )
        contract.getGasPrice = credentials.Web3ETH.eth.getGasPrice
    } else if (network === 'BTT') {
        var contract = new credentials.web3UrlBTT.eth.Contract(
            BttConstants.token.abi,
            token
        )
        contract.getGasPrice = credentials.web3UrlBTT.eth.getGasPrice
    } else {
        var contract = new credentials.Web3BEP20.eth.Contract(
            Constants.bep20.abi,
            token
        )

        contract.getGasPrice = credentials.Web3BEP20.eth.getGasPrice
    }

    return contract
}

exports.sendBtc = async function (id, pass, to, amount) {
    var account = await Wallet.findOne({ UserId: parseInt(id) })

    var escpass = pass.replace(/'/g, "\\'")

    var priv = bip38.decrypt(account.btc.ek, escpass)

    var encode = wif.encode(0x80, priv.privateKey, priv.compressed)

    var addr = account.btc.addressSegWitCompat

    var utxo = JSON.parse(
        child.execSync(
            process.env.BTC_CMD + ' listunspent 1 1000000 \'["' + addr + '"]\''
        )
    )

    if (!utxo.length) {
        return { error: 'insufficient funds ' }
    }

    var max = 0.0
    for (var i = 0; i < utxo.length; i++) {
        max += parseFloat(utxo[i].amount)
    }
    max = Math.floor(parseFloat(max) * 100000000)

    var body = await rp({ uri: process.env.BTS_FEES, json: true })
    var feeRate = 15 // parseInt(body.fastestFee);

    var maxFee = 20000

    const keyPair = bitcoinjs.ECPair.fromWIF(encode)
    const txb = new bitcoinjs.TransactionBuilder()

    var input_sum = 0
    var fee = (45 + utxo.length * 93) * feeRate
    for (var i = 0; i < utxo.length; i++) {
        txb.addInput(utxo[i].txid, parseInt(utxo[i].vout))
        input_sum += Math.round(parseFloat(utxo[i].amount) * 100000000)
    }
    var change = input_sum - parseInt(amount) - (fee + 34 * feeRate)
    txb.addOutput(to, parseInt(amount))

    if (change > fee) {
        txb.addOutput(addr, parseInt(change))
        fee += 34 * feeRate
    }

    if (parseInt(amount) + parseInt(fee) > max) {
        return {
            error: 'insufficient funds for gas',
        }
    }

    const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey })
    const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wpkh })

    for (var i = 0; i < utxo.length; i++) {
        txb.sign(
            i,
            keyPair,
            p2sh.redeem.output,
            null,
            Math.round(parseFloat(utxo[i].amount) * 100000000)
        )
    }
    var tx = txb.build()

    var signed = tx.toHex()
    var hash = tx.getId()

    var rec = child.execSync(
        process.env.BTC_CMD + ' sendrawtransaction "' + signed + '"'
    )
    return hash
}

exports.transferNative = async (to, amount, credentials, WEB3) => {
    if (!credentials.WEB3.utils.isAddress(to))
        return { error: 'Invalid address' }
    try {
        var gasPrice = await credentials.WEB3.eth.getGasPrice()

        // var gas = 21000
        var gas =
            (await credentials.WEB3.eth.estimateGas({ to })) *
            process.env.GAS_MULTIPLAyer
        var receipt = await credentials.WEB3.eth
            .sendTransaction({
                from: credentials.address,
                value: amount,
                gas: gas,
                to: to,
                gasPrice: gasPrice,
            })
            .once('transactionHash', function (hash) {})

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: to,
            amount: amount,
        }
    } catch (err) {
        return { error: err.message }
    }
}

exports.getCount = async function () {
    try {
        var count = await Wallet.countDocuments()
        return count + 1
    } catch (err) {}
}

exports.getCountV2 = async () => {
    try {
        var count = await Wallet.find({ walletV2: { $exists: true } }).count()
        return count + 1
    } catch (err) {}
}

exports.createSeed = async (req, res) => {
    try {
        var UserId = +req.user._id
        var pass = req.body.pass

        var escpass = pass.replace(/'/g, "\\'")

        const mnemonic = bip39.generateMnemonic(256)
        const seed = bip39.mnemonicToSeedSync(mnemonic, pass)
        const rootBtc = bip32.fromSeed(seed, networkSegWitCompat)
        const rootBtcBc1 = bip32.fromSeed(seed, networkSegWit)
        const rootEth = bip32.fromSeed(seed)
        const childBtc = rootBtc.derivePath(pathBtcSegwitCompat)
        const childBtcBc1 = rootBtcBc1.derivePath(pathBtcSegwit)
        const childEth = rootEth.derivePath(pathEth)

        const address = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: childBtc.publicKey,
                network: networkSegWitCompat,
            }),
            network: networkSegWitCompat,
        }).address

        const addressbc1 = bitcoinjs.payments.p2wpkh({
            pubkey: childBtcBc1.publicKey,
            network: networkSegWit,
        }).address

        var addressBuffer = ethUtil.privateToAddress(childEth.privateKey)
        var checksumAddress = ethUtil.toChecksumAddress(
            '0x' + addressBuffer.toString('hex')
        )
        var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'))

        var pubBtc = childBtc.publicKey.toString('hex')

        let Web3ETH = await erc20Connexion()

        var account = Web3ETH.eth.accounts
            .privateKeyToAccount(privkey)
            .encrypt(pass)
        var ek = bip38.encrypt(childBtc.privateKey, true, escpass)
        var btcWallet = {
            publicKey: pubBtc,
            addressSegWitCompat: address,
            addressSegWit: addressbc1,
            publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
            ek: ek,
        }
        var count = await this.getCount()

        let TronWallet = await this.getWalletTron(
            UserId,
            pass,
            account,
            mnemonic
        )

        await Wallet.create({
            UserId,
            keystore: account,
            num: count,
            btc: btcWallet,
            mnemo: mnemonic,
            tronAddress: TronWallet.addr,
        })

        return {
            address: '0x' + account.address,
            btcAddress: btcWallet.addressSegWitCompat,
            tronAddress: TronWallet.addr,
        }
    } catch (error) {
        return { error: error.message }
    }
}

exports.createSeedV2 = async (req, res) => {
    try {
        var UserId = +req.user._id
        var password = req.body.pass
        var escpassword = password.replace(/'/g, "\\'")
        let web3 = await bep20Connexion()
        let walletV1 = await Wallet.findOne({
            UserId,
            keystore: { $exists: true },
        })

        try {
            let oldpass = await web3.eth.accounts.decrypt(
                walletV1.keystore,
                req.body.pass
            )

            if (oldpass) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'same transaction pass '
                )
            }
        } catch (error) {
            const mnemonic = bip39.generateMnemonic(256)
            const seed = bip39.mnemonicToSeedSync(mnemonic, password)
            const rootBtc = bip32.fromSeed(seed, networkSegWitCompat)
            const rootBtcBc1 = bip32.fromSeed(seed, networkSegWit)
            const rootEth = bip32.fromSeed(seed)
            const childBtc = rootBtc.derivePath(pathBtcSegwitCompat)
            const childBtcBc1 = rootBtcBc1.derivePath(pathBtcSegwit)
            const childEth = rootEth.derivePath(pathEth)

            const address = bitcoinjs.payments.p2sh({
                redeem: bitcoinjs.payments.p2wpkh({
                    pubkey: childBtc.publicKey,
                    network: networkSegWitCompat,
                }),
                network: networkSegWitCompat,
            }).address

            const addressbc1 = bitcoinjs.payments.p2wpkh({
                pubkey: childBtcBc1.publicKey,
                network: networkSegWit,
            }).address

            var privkey = ethUtil.addHexPrefix(
                childEth.privateKey.toString('hex')
            )

            var pubBtc = childBtc.publicKey.toString('hex')

            let Web3ETH = await erc20Connexion()

            var account = Web3ETH.eth.accounts
                .privateKeyToAccount(privkey)
                .encrypt(password)

            var ek = bip38.encrypt(childBtc.privateKey, true, escpassword)
            var btcWallet = {
                publicKey: pubBtc,
                addressSegWitCompat: address,
                addressSegWit: addressbc1,
                publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
                ek: ek,
            }
            var count = await this.getCountV2()

            let TronWallet = await this.getWalletTronV2(
                UserId,
                password,
                account,
                mnemonic
            )

            await Wallet.updateOne(
                { UserId },
                {
                    $set: {
                        UserId,
                        num: count,
                        walletV2: {
                            keystore: account,
                            btc: btcWallet,
                            mnemo: mnemonic,
                            tronAddress: TronWallet.addr,
                        },
                    },
                },
                { upsert: true }
            )

            await User.updateOne(
                { _id: UserId },
                { $set: { hasWalletV2: true, hasWallet: true } }
            )

            return {
                address: '0x' + account.address,
                btcAddress: btcWallet.addressSegWitCompat,
                tronAddress: TronWallet.addr,
            }
        }
    } catch (error) {
        return { error: error.message }
    }
}
exports.addWalletTron = async ({ user: { _id: UserId }, body: { pass } }) => {
    try {
        let TronWallet = await this.getWalletTron(UserId, pass)
        await Wallet.updateOne(
            { UserId: UserId },
            {
                $set: {
                    tronAddress: TronWallet.addr,
                },
            },
            {
                new: true,
            }
        )

        return TronWallet
    } catch (error) {
        return { error: error.message ? error.message : error.error }
    }
}

exports.getWalletTron = async (
    id,
    pass,
    walletversion,
    keystoreWallet = false,
    mnemonic = null
) => {
    let wallet = await Wallet.findOne({ UserId: id }).lean()
    const mnemos =
        (walletversion === 'v1' ? wallet?.mnemo : wallet?.walletV2.mnemo) ||
        mnemonic
    const walletKeyStore =
        (walletversion === 'v1'
            ? wallet?.keystore
            : wallet?.walletV2.keystore) || keystoreWallet

    if (walletKeyStore) {
        try {
            let Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([walletKeyStore], pass)
        } catch (error) {
            return { error: 'Invalid Tron password' }
        }
    }
    try {
        const seed = bip39.mnemonicToSeedSync(mnemos, pass)
        const root = bip32.fromSeed(seed)
        const childTron = root.derivePath(pathTron)
        var tronPriv = childTron.privateKey.toString('hex')
        var tronAddr = tronWeb.address.fromPrivateKey(tronPriv)
        var tronAddrHex = tronWeb.address.toHex(tronAddr)
        return { priv: tronPriv, addr: tronAddr, addrHex: tronAddrHex }
    } catch (err) {
        return { err: err.message ? err.message : err.error }
    }
}
exports.getWalletTronV2 = async (
    id,
    pass,
    keystoreWallet = false,
    mnemonic = null
) => {
    let wallet = await Wallet.findOne(
        { UserId: id },
        { keystore: 1, mnemo: 1, walletV2: 1 }
    ).lean()
    const mnemos = wallet?.walletV2?.mnemo || mnemonic
    const walletKeyStore = wallet?.walletV2?.keystore || keystoreWallet

    if (walletKeyStore) {
        try {
            let Web3ETH = await erc20Connexion()
            Web3ETH.eth.accounts.wallet.decrypt([walletKeyStore], pass)
        } catch (error) {
            return { error: 'Invalid Tron password' }
        }
    }
    try {
        const seed = bip39.mnemonicToSeedSync(mnemos, pass)
        const root = bip32.fromSeed(seed)
        const childTron = root.derivePath(pathTron)
        var tronPriv = childTron.privateKey.toString('hex')
        var tronAddr = tronWeb.address.fromPrivateKey(tronPriv)
        var tronAddrHex = tronWeb.address.toHex(tronAddr)
        return { priv: tronPriv, addr: tronAddr, addrHex: tronAddrHex }
    } catch (err) {
        return { err: err.message ? err.message : err.error }
    }
}
exports.wrapNative = async (amount, credentials) => {
    try {
        tokenSmartContract = new credentials.WEB3.eth.Contract(
            wrapConstants[credentials.network].abi,
            wrapConstants[credentials.network].address
        )

        let gasPrice = await credentials.WEB3.eth.getGasPrice()
        let gas = await tokenSmartContract.methods
            .deposit()
            .estimateGas({ from: credentials.address, value: amount, gasPrice })

        let receipt = await tokenSmartContract.methods
            .deposit()
            .send({ from: credentials.address, value: amount, gas, gasPrice })

        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: wrapConstants[credentials.network].address,
            amount: amount,
        }
    } catch (err) {
        return { error: err.message }
    }
}

exports.unWrapNative = async (credentials) => {
    try {
        tokenSmartContract = new credentials.WEB3.eth.Contract(
            wrapConstants[credentials.network].abi,
            wrapConstants[credentials.network].address
        )
        var amount = await tokenSmartContract.methods
            .balanceOf(credentials.address)
            .call()
        let gasPrice = await credentials.WEB3.eth.getGasPrice()
        let gas = await tokenSmartContract.methods
            .withdraw(amount)
            .estimateGas({ from: credentials.address, gasPrice })
        let receipt = await tokenSmartContract.methods
            .withdraw(amount)
            .send({ from: credentials.address, gas, gasPrice })
        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            to: wrapConstants[credentials.network].address,
            amount: amount,
        }
    } catch (err) {
        return { error: err.message }
    }
}

exports.exportkeyTron = async (id, pass) => {
    let wallet = await Wallet.findOne({ UserId: id })

    let Web3ETH = await erc20Connexion()

    if (wallet.keystore) {
        try {
            Web3ETH.eth.accounts.wallet.decrypt([wallet.keystore], pass)
        } catch (error) {
            return { error: 'Invalid Tron password' }
        }
    }
    const seed = bip39.mnemonicToSeedSync(wallet.mnemo, pass)
    const root = bip32.fromSeed(seed)
    const childTron = root.derivePath(pathTron)
    var tronPriv = childTron.privateKey.toString('hex')

    var keystore = Web3ETH.eth.accounts
        .privateKeyToAccount(tronPriv)
        .encrypt(pass)
    let ethAddr = '41' + keystore.address
    keystore.address = ethAddr
    return keystore
}

exports.exportkeyTronV2 = async (id, pass) => {
    let wallet = await Wallet.findOne({ UserId: id })

    let Web3ETH = await erc20Connexion()

    if (!wallet.walletV2.keystore.address) return 'Wallet v2 not found'

    if (wallet.walletV2.keystore) {
        try {
            Web3ETH.eth.accounts.wallet.decrypt(
                [wallet.walletV2.keystore],
                pass
            )
        } catch (error) {
            return { error: 'Invalid Tron password' }
        }
    }
    const seed = bip39.mnemonicToSeedSync(wallet.walletV2.mnemo, pass)
    const root = bip32.fromSeed(seed)
    const childTron = root.derivePath(pathTron)
    var tronPriv = childTron.privateKey.toString('hex')

    var keystore = Web3ETH.eth.accounts
        .privateKeyToAccount(tronPriv)
        .encrypt(pass)
    let ethAddr = '41' + keystore.address
    keystore.address = ethAddr
    return keystore
}

exports.FilterTransactionsByHash = (
    All_Transactions,
    Erc20_OR_BEP20_Transactions,
    Network
) => {
    var transaction_content = All_Transactions.result
    var erc20_or_bep20_transaction_content = Erc20_OR_BEP20_Transactions.result

    transaction_content.map((elem) => {
        for (var i = 0; i < erc20_or_bep20_transaction_content.length; i++) {
            if (erc20_or_bep20_transaction_content[i].hash == elem.hash) {
                erc20_or_bep20_transaction_content[i].network = Network
            }
        }
        if (!elem.network) {
            elem.network = Network
        }
    })
    return transaction_content.concat(erc20_or_bep20_transaction_content)
}
