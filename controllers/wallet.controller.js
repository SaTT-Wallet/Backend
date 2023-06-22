const { User, Wallet, CustomToken, WalletUserNode } = require('../model/index')

const rp = require('axios')
const path = require('path')
const { randomUUID } = require('crypto')
const { v5: uuidv5 } = require('uuid')
const cron = require('node-cron')
var fs = require('fs')
var bip39 = require('bip39')
var bip32 = require('bip32')
var bip38 = require('bip38')
const Web3 = require('web3')
const {
    networkProviders,
    networkProvidersOptions,
    getWeb3Connection,
    getHttpProvider,
} = require('../web3/web3-connection')
const { transferTokens, transferBTC } = require('../libs/transfer')
const { unlockAccount } = require('../web3/account')

const {
    erc20Connexion,
    bep20Connexion,
    polygonConnexion,
    bttConnexion,
    tronConnexion,
    webTronInstance,
} = require('../blockchainConnexion')

const {
    configSendBox,
    PolygonApi,
    Tokens,
    networkSegWitCompat,
    pathBtcSegwitCompat,
} = require('../conf/config')

const Big = require('big.js')
var requirement = require('../helpers/utils')
const {
    synfonyHash,
    configureTranslation,
    readHTMLFileLogin,
} = require('../helpers/utils')

var connection
const { responseHandler } = require('../helpers/response-handler')
const { Constants } = require('../conf/const')
const {
    unlock,
    unlockV2,
    lock,
    createSeed,
    exportkeyBtc,
    exportkey,
    exportkeyTron,
    getAccount,
    getPrices,
    getListCryptoByUid,
    getBalanceByUid,
    getBalance,
    transfer,
    unlockBsc,
    lockBSC,
    sendBep20,
    sendBtc,
    transferNativeBNB,
    sendPolygon,
    transferEther,
    FilterTransactionsByHash,
    getTokenContractByToken,
    exportWalletInfo,
    sendBtt,
    createWalletTron,
    addWalletTron,
    getWalletTron,
    createSeedV2,
    getAllWallets,
    exportkeyV2,
    exportkeyBtcV2,
    exportkeyTronV2,
    getAccountV2,
} = require('../web3/wallets')

const {
    notificationManager,
    updateAndGenerateCode,
} = require('../manager/accounts')

const { payementRequest } = require('../conf/config')
const { BalanceUsersStats } = require('../helpers/common')
const { async } = require('hasha')
const { transferTronTokens } = require('../libs/transfer/transfer-TRON')
const { number } = require('bitcoinjs-lib/src/script')

/*
cron.schedule(process.env.CRON_WALLET_USERS_sTAT_DAILY, () =>
    BalanceUsersStats('daily')
)

cron.schedule(process.env.CRON_WALLET_USERS_sTAT_MONTHLY, () =>
    BalanceUsersStats('monthly')
)

cron.schedule(process.env.CRON_WALLET_USERS_sTAT_WEEKLY, () =>
    BalanceUsersStats('weekly')
)*/

exports.mywallet = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var ret =
                req.body.version === 'v1'
                    ? await getAccount(req, res)
                    : await getAccountV2(req, res)
            if (!ret) {
                return
            }
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.allwallets = async (req, res) => {
    try {
        var ret = await getAllWallets(req, res)

        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.userBalance = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            const balance = await getListCryptoByUid(req, res)

            let listOfCrypto = [...new Set(balance.listOfCrypto)]

            return responseHandler.makeResponseData(
                res,
                200,
                'success',
                listOfCrypto
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {}
}

exports.getGasPrice = async (req, res) => {
    const network = req.params.network.toUpperCase()

    switch (network) {
        case 'POLYGON':
            return exports.gasPricePolygon(req, res)
        case 'BEP20':
            return exports.gasPriceBep20(req, res)
        case 'ERC20':
            return exports.gasPriceErc20(req, res)
        case 'BTTC':
            return exports.gasPriceBtt(req, res)
        case 'TRON':
            return exports.gasPriceTrx(req, res)
    }
}
//Best Practices

const getGasPrice = async (res, connect, format) => {
    try {
        const web3Instance = await connect()
        const gasPrice = await web3Instance.eth.getGasPrice()
        const formattedGasPrice = format(gasPrice)
        return responseHandler.makeResponseData(res, 200, 'success', {
            gasPrice: formattedGasPrice,
        })
    } catch (error) {
        console.error(error)
        return responseHandler.makeResponseData(res, 500, 'failure', {
            error: 'Unable to retrieve gas price.',
        })
    }
}

exports.gasPricePolygon = (req, res) =>
    getGasPrice(res, polygonConnexion, (gasPrice) => gasPrice / 1e9)
exports.gasPriceBep20 = (req, res) =>
    getGasPrice(res, bep20Connexion, (gasPrice) => gasPrice / 1e9)
exports.gasPriceErc20 = (req, res) =>
    getGasPrice(res, erc20Connexion, (gasPrice) => gasPrice / 1e9)
exports.gasPriceBtt = (req, res) =>
    getGasPrice(res, bttConnexion, (gasPrice) => (gasPrice * 280) / 1e9)

exports.gasPriceTrx = async (req, res) => {
    try {
        const tronWeb = await webTronInstance()
        const gasPriceData = await tronWeb.trx.getChainParameters()
        const gasPrice = gasPriceData.find(
            (elem) => elem.key === 'getEnergyFee'
        ).value
        return responseHandler.makeResponseData(res, 200, 'success', {
            gasPrice,
        })
    } catch (error) {
        console.error(error)
        return responseHandler.makeResponseData(res, 500, 'failure', {
            error: 'Unable to retrieve gas price.',
        })
    }
}

exports.cryptoDetails = async (req, res) => {
    let prices = await getPrices()
    return responseHandler.makeResponseData(res, 200, 'success', prices)
}

exports.totalBalances = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var Total_balance = await getBalanceByUid(req, res)

            return responseHandler.makeResponseData(res, 200, 'success', {
                Total_balance: Total_balance.Total_balance,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (req.user._id && Total_balance) {
            let date = Math.round(new Date().getTime() / 1000)
            var today = new Date().toLocaleDateString('en-US')
            const user = await User.findOne(
                { _id: req.user._id },
                { fields: { _id: 0 } }
            )

            if (!user.daily) {
                user.daily = []
            }

            if (!user.daily[0] || user.daily[0].convertDate !== today) {
                user.daily.unshift({
                    Date: date,
                    Balance: Total_balance.Total_balance,
                    convertDate: today,
                })
                if (user.daily.length > 7) {
                    user.daily.pop()
                }

                await user.save()
            }
        }
    }
}

exports.transferTokensController = async (req, res) => {
    let from = req.body.from
    var to = req.body.to
    var amount = req.body.amount
    let { max } = req.query
    //TODO: Add a constants enum for different blockchain networks
    let network = req.body.network
    let tokenSymbol = req.body.tokenSymbol
    let pass = req.body.pass
    let tokenAddress = req.body.tokenAddress
    let userId = req.user._id
    let result

    try {
        if (req.user.hasWallet == true) {
            const provider = getHttpProvider(
                networkProviders[network.toUpperCase()],
                networkProvidersOptions[network.toUpperCase()]
            )

            // get wallet keystore
            const accountData = await Wallet.findOne({ UserId: userId })

            if (network.toUpperCase() === 'BTC') {
                //TODO: transferring btc need to be tested locally with testnet
                result = await transferBTC({
                    to,
                    amount,
                    walletPassword: pass,
                    account: accountData,
                })
            } else if (network.toUpperCase() === 'TRON') {
                if (req.body.from === '0x' + accountData.keystore.address) {
                    walletversion = 'v1'
                } else {
                    walletversion = 'v2'
                }
                let privateKey = (
                    await getWalletTron(userId, pass, walletversion)
                ).priv

                result = await transferTronTokens({
                    tronAddress:
                        walletversion === 'v1'
                            ? accountData.tronAddress
                            : accountData.walletV2.tronAddress,
                    toAddress: to,
                    amount,
                    privateKey,
                    max,
                })
            } else {
                result = await transferTokens({
                    fromAddress: from,
                    toAddress: to,
                    amount,
                    tokenSmartContractAddress: tokenAddress,
                    tokenSmartContractAbi: Constants.token.abi,
                    provider,
                    walletPassword: pass,
                    encryptedPrivateKey:
                        from === '0x' + accountData.walletV2.keystore.address
                            ? accountData.walletV2.keystore
                            : accountData.keystore,
                    max,
                })
            }

            if (result.error) {
                return responseHandler.makeResponseError(res, 402, result.error)
            }

            if (result.blockHash) {
                await notificationManager(req.user._id, 'transfer_event', {
                    amount,
                    currency: tokenSymbol,
                    network,
                    to,
                    transactionHash: result.transactionHash,
                })

                const wallet = await Wallet.findOne(
                    {
                        ...((network.toUpperCase() === 'TRON' && {
                            tronAddress: to,
                        }) || {
                            $or: [
                                { 'keystore.address': to.substring(2) },
                                {
                                    'walletV2.keystore.address':
                                        to.substring(2),
                                },
                            ],
                        }),
                    },
                    { UserId: 1 }
                ).lean()

                if (wallet) {
                    await notificationManager(
                        wallet.UserId,
                        'receive_transfer_event',
                        {
                            amount,
                            currency: tokenSymbol,
                            network,
                            from:
                                (network.toUpperCase() === 'TRON' &&
                                    accountData.tronAddress) ||
                                from,
                            transactionHash: result.transactionHash,
                        }
                    )
                }
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    result
                )
            }
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Account not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message)
    }
}

exports.checkWalletToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
        let Web3BEP20 = await bep20Connexion()
        let Web3ETH = await erc20Connexion()
        let web3MATIC = await polygonConnexion()
        let [tokenAdress, network] = [req.body.tokenAdress, req.body.network]
        let abi =
            network === 'bep20' ? Constants.bep20.abi : Constants.token.abi
        let networkToken =
            network === 'bep20'
                ? Web3BEP20.eth
                : network === 'polygon'
                ? web3MATIC.eth
                : Web3ETH.eth

        let code = await networkToken.getCode(tokenAdress)

        if (code === '0x') {
            return responseHandler.makeResponseError(
                res,
                204,
                'not a token address'
            )
        } else {
            let contract = new networkToken.Contract(abi, tokenAdress)
            decimal = await contract.methods.decimals().call()
            tokenName = await contract.methods.name().call()
            network = network.toUpperCase()
            symbol = await contract.methods.symbol().call()

            return responseHandler.makeResponseData(res, 200, 'Token found', {
                tokenName,
                symbol,
                decimal,
                tokenAdress,
                network,
            })
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.addNewToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let customToken = {}
            let [tokenAdress, symbol, decimal, network] = [
                req.body.tokenAdress,
                req.body.symbol,
                req.body.decimal,
                req.body.network,
            ]

            let tokenExist = await CustomToken.findOne({
                tokenAdress,
                symbol,
                decimal,
                network,
                sn_users: { $in: [req.user._id] },
            })

            defaultAddressList = []
            for (const crypto in Tokens) {
                defaultAddressList.push(Tokens[crypto].contract)
            }

            if (
                tokenExist ||
                defaultAddressList.indexOf(req.body.tokenAdress) >= 0
            ) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'token already added'
                )
            }

            let CryptoPrices = await getPrices()

            let tokenFounded = await CustomToken.findOne({
                tokenAdress,
                symbol,
                decimal,
                network,
            })

            if (!tokenFounded) {
                customToken = req.body
                customToken.sn_users = [req.user._id]
                if (CryptoPrices.hasOwnProperty(symbol)) {
                    // const cryptoMetaData = {
                    //     method: 'GET',
                    //     uri: process.env.CMR_URL + symbol,
                    //     headers: {
                    //         'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                    //     },
                    //     json: true,
                    //     gzip: true,
                    // }

                    let metaData = (
                        await rp(process.env.CMR_URL + symbol, {
                            headers: {
                                'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
                            },
                        })
                    ).data
                    customToken.picUrl = metaData.data[customToken.symbol].logo
                }
                await CustomToken.create(customToken)
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'Token added',
                    customToken
                )
            } else {
                let id = tokenFounded._id
                await CustomToken.updateOne(
                    { _id: id },
                    { $push: { sn_users: req.user._id } }
                )
            }
            return responseHandler.makeResponseData(
                res,
                200,
                'Token added',
                customToken
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Account not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.getQuote = async (req, res) => {
    try {
        let ip =
            req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''

        // if (ip) ip = ip.split(':')[3]
        if (!ip) {
            ip = '41.230.35.91'
        }

        let requestQuote = req.body
        requestQuote['end_user_id'] = String(req.user._id)
        requestQuote['client_ip'] = ip
        requestQuote['wallet_id'] = 'satt'
        // const simplexQuote = {
        //     url: configSendBox + '/wallet/merchant/v2/quote',
        //     method: 'POST',
        //     body: requestQuote,
        //     headers: {
        //         Authorization: `ApiKey ${process.env.SEND_BOX}`,
        //     },
        //     json: true,
        // }
        var quote = (
            await rp.post(
                configSendBox + '/wallet/merchant/v2/quote',
                requestQuote,
                {
                    headers: {
                        Authorization: `ApiKey ${process.env.SEND_BOX}`,
                    },
                }
            )
        ).data
        //var quote = await rp(simplexQuote)
        if (!!quote.error) {
            return responseHandler.makeResponseError(res, 403, quote.error)
        }

        delete quote.supported_digital_currencies
        delete quote.supported_fiat_currencies

        return responseHandler.makeResponseData(res, 200, 'success', quote)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
    }
}

exports.payementRequest = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let ip =
                req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
            //  if (ip) ip = ip.split(':')[3]
            let payment_id = randomUUID()
            const uiad = process.env.UIAD
            let user_agent = req.headers['user-agent']
            const http_accept_language = req.headers['accept-language']
            let user = await User.findOne(
                { _id: req.user._id },
                { email: true, phone: true, created: 1 }
            )
            let request = {}
            ;(request._id = req.user._id.toString()),
                (request.installDate = user.created)
            ;(request.email = user.email),
                (request.addressIp = ip),
                (request.user_agent = user_agent)
            request.language = http_accept_language
            request.quote_id = req.body.quote_id
            request.order_id = uuidv5(process.env.ORDER_SECERET, uiad)
            request.uuid = payment_id
            request.currency = req.body.currency
            request.idWallet = req.body.idWallet
            let payment = await payementRequest(request)

            var paymentSubmitted = (
                await rp.post(
                    configSendBox + '/wallet/merchant/v2/payments/partner/data',
                    payment,
                    {
                        headers: {
                            Authorization: `ApiKey ${process.env.SEND_BOX}`,
                        },
                    }
                )
            ).data
            paymentSubmitted.payment_id = payment_id
            return responseHandler.makeResponseData(
                res,
                200,
                'success',
                paymentSubmitted
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
/*
exports.bridge = async (req, res) => {
    let amount = req.body.amount
    let sattContractErc20 = Constants.token.satt
    let sattContractBep20 = Constants.bep20.address.sattBep20
    try {
        network = 'ERC20'
        var cred = await unlock(req, res)
        if (!cred) return

        let balance = await getBalance(
            cred.Web3ETH,
            sattContractErc20,
            cred.address
        )
        if (new Big(amount).gt(new Big(balance))) {
            return responseHandler.makeResponseError(
                res,
                401,
                'not_enough_budget'
            )
        }
        var transfertErc20 = await transfer(
            sattContractErc20,
            process.env.SATT_RESERVE,
            amount,
            cred
        )
        if (transfertErc20?.transactionHash) {
            let Web3BEP20 = await bep20Connexion()
            var campaignKeystore = fs.readFileSync(
                process.env.CAMPAIGN_WALLET_PATH,
                'utf8'
            )

            campaignWallet = JSON.parse(campaignKeystore)
            Web3BEP20.eth.accounts.wallet.decrypt(
                [campaignWallet],
                process.env.SATT_RESERVE_PASS
            )
            var credentials = {
                Web3BEP20: Web3BEP20,
                address: process.env.SATT_RESERVE,
            }
            let ctr = await getTokenContractByToken(
                sattContractBep20,
                credentials,
                'BEP20'
            )
            var gasPrice = await Web3BEP20.eth.getGasPrice()
            var gas = 80000
            let funds = await ctr.methods.mint(amount).send({
                from: process.env.SATT_RESERVE,
                gas: gas,
                gasPrice: gasPrice,
            })
            if (funds) {
                var transfertBep20 = await sendBep20(
                    sattContractBep20,
                    cred.address,
                    amount,
                    credentials
                )
                if (transfertBep20?.transactionHash)
                    res.end(JSON.stringify({ transfertErc20, transfertBep20 }))
            }
        }
    } catch (err) {
        res.end(JSON.stringify(err))
    } finally {
        if (cred) lock(cred)
        if (transfertBep20?.transactionHash) {
            await notificationManager(req.user._id, 'convert_event', {
                amount,
                Direction,
                transactionHash: transfertBep20.transactionHash,
                currency: 'SATT',
                network,
            })
        }
    }
}*/

module.exports.getMnemo = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let wallet = await Wallet.findOne(
                { UserId: req.user._id },
                { mnemo: true, walletV2: true }
            ).lean()
            let mnemo = wallet?.walletV2?.mnemo || wallet.mnemo

            return responseHandler.makeResponseData(res, 200, 'success', {
                mnemo,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.verifyMnemo = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let mnemo = req.body.mnemo
            let wallet = await Wallet.findOne({
                $and: [{ UserId: req.user._id }, { 'walletV2.mnemo': mnemo }],
            })
            let verify = wallet ? true : false

            return responseHandler.makeResponseData(res, 200, 'success', {
                verify,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.createNewWallet = async (req, res) => {
    try {
        var { _id } = req.user
        let user = await User.findOne({ _id }, { password: 1 }).lean()
        if (user.password === synfonyHash(req.body.pass)) {
            return responseHandler.makeResponseError(res, 401, 'same password')
        } else if (req.user.hasWallet) {
            return responseHandler.makeResponseError(
                res,
                401,
                'Wallet already exist'
            )
        } else {
            var ret = await createSeed(req, res)

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (ret) {
            await User.updateOne({ _id }, { hasWallet: true })
        }
    }
}
exports.verifySign = async (req, res) => {
    try {
        cred = await unlock(req, res)
        let userWallet = await Wallet.findOne({ UserId: req.user._id })

        let decryptAccount = await cred.Web3BEP20.eth.accounts.wallet.decrypt(
            [userWallet.keystore],
            req.body.pass
        )

        signature = await cred.Web3BEP20.eth.accounts.sign(
            'SignWallet',
            decryptAccount[0].privateKey
        )

        return responseHandler.makeResponseData(res, 200, 'success', signature)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            401,
            err.message ? err.message : err.error
        )
    }
}

exports.createNewWalletV2 = async (req, res) => {
    try {
        var { _id } = req.user
        let user = await User.findOne({ _id }, { password: 1 }).lean()

        if (user.password === synfonyHash(req.body.pass)) {
            return responseHandler.makeResponseError(res, 401, 'same password')
        } else if (
            (req.user.hasWallet && !req.user.hasWalletV2) ||
            !req.user.hasWallet
        ) {
            var ret = await createSeedV2(req, res)
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                401,
                'Wallet already exist'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.addTronWalletToExistingAccount = async (req, res) => {
    try {
        let account = await Wallet.findOne({ UserId: req.user._id })
        let Web3ETH = await erc20Connexion()
        Web3ETH.eth.accounts.wallet.decrypt([account.keystore], req.body.pass)
        var tronWallet = await getWalletTron(req.user._id, req.body.pass)
        if (!tronWallet.addr) {
            return responseHandler.makeResponseError(
                res,
                401,
                'Invalid password'
            )
        } else {
            var ret = await addWalletTron(req)

            return responseHandler.makeResponseData(res, 200, 'success', {
                tronAddress: ret.addr,
            })
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.removeToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let id = req.user._id
            const tokenAdress = req.params.address
            let token = await CustomToken.findOne({ tokenAdress }).lean()
            if (token) {
                let splicedArray = token.sn_users.filter((item) => item !== id)
                await CustomToken.updateOne(
                    { tokenAdress },
                    { $set: { sn_users: splicedArray } }
                )
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'token removed'
                )
            } else {
                return responseHandler.makeResponseError(
                    res,
                    204,
                    'Token not found'
                )
            }
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.getTransactionHistory = async (req, res) => {
    var address = req.params.address

    try {
        //ETH Network
        const requestOptions_ETH_transactions = {
            method: 'GET',
            uri: process.env.ETHERSCAN_APIURL_ + address + '&action=txlist',
            json: true,
            gzip: true,
        }
        const requestOptions_ERC20_transactions = {
            method: 'GET',
            uri: process.env.ETHERSCAN_APIURL_ + address + '&action=tokentx',
            json: true,
            gzip: true,
        }

        const Eth_transactions = await rp.get(
            requestOptions_ETH_transactions.uri
        )
        const ERC20_transactions = await rp.get(
            requestOptions_ERC20_transactions.uri
        )
        const all_Eth_transactions = FilterTransactionsByHash(
            Eth_transactions.data,
            ERC20_transactions.data,
            'ERC20'
        )
        //BNB Network
        const requestOptions_BNB_transactions = {
            method: 'GET',
            uri: process.env.BSCSCAN_API + address + '&action=txlist',
            json: true,
            gzip: true,
        }

        const requestOptions_BEP20_transactions = {
            method: 'GET',
            uri: process.env.BSCSCAN_API + address + '&action=tokentx',
            json: true,
            gzip: true,
        }

        const BNB_transactions = await rp.get(
            requestOptions_BNB_transactions.uri
        )
        const BEP20_transactions = await rp.get(
            requestOptions_BEP20_transactions.uri
        )
        const all_BNB_transactions = FilterTransactionsByHash(
            BNB_transactions.data,
            BEP20_transactions.data,
            'BEP20'
        )

        //POLYGON Network
        const requestOptions_POLYGON_transactions = {
            method: 'GET',
            uri: PolygonApi + address + '&action=tokentx',
            json: true,
            gzip: true,
        }

        const requestOptions_MATIC_transactions = {
            method: 'GET',
            uri: PolygonApi + address + '&action=txlist',
            json: true,
            gzip: true,
        }
        const POLYGON_transactions = await rp.get(
            requestOptions_MATIC_transactions.uri
        )
        const MATIC_transactions = await rp.get(
            requestOptions_POLYGON_transactions.uri
        )
        const all_POLYGON_transactions = FilterTransactionsByHash(
            POLYGON_transactions.data,
            MATIC_transactions.data,
            'POLYGON'
        )

        const All_Transactions = all_Eth_transactions.concat(
            all_BNB_transactions,
            all_POLYGON_transactions
        )

        return responseHandler.makeResponseData(res, 200, 'success', {
            All_Transactions,
        })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.balanceStat = async (req, res) => {
    try {
        const id = req.user._id
        let result = {}
        let user = await User.findOne({ _id: id })
        if (user.daily && user.daily.length > 0) {
            result.daily = user.daily
        }
        if (user.weekly && user.weekly.length > 0) {
            result.weekly = user.weekly
        }
        if (user.monthly && user.monthly.length > 0) {
            result.monthly = user.monthly
        }
        return responseHandler.makeResponseData(res, 200, 'success', result)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.countWallets = async (req, res) => {
    let countWallets = await Wallet.count()

    return responseHandler.makeResponseData(res, 200, 'success', countWallets)
}
exports.addNewWallet = async (req, res) => {
    try {
        let ret = await createSeedV2(req, res)
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (ret) {
            await User.updateOne({ _id }, { hasWallet: true })
        }
    }
}

exports.transfertAllTokensBEP20 = async (req, res) => {
    try {
        const userId = req.user._id
        const { pass, tokens, network } = req.body
        if (req.user?.migrate)
            return responseHandler.makeResponseData(
                res,
                401,
                'success',
                'has wallet v2 already done'
            )

        const accountData = await Wallet.findOne({ UserId: userId }).lean()
        const transactionHash = []
        const errorTransaction = []
        if (accountData) {
            if (network === 'TRON') {
                let tronWeb = await webTronInstance()
                let privateKey = (await getWalletTron(userId, pass, 'v1')).priv
                let amount = new Big(
                    await tronWeb.trx.getBalance(accountData.tronAddress)
                )
                    .minus(1100000)
                    .toString()

                const send = await transferTronTokens({
                    tronAddress: accountData?.tronAddress,
                    toAddress: accountData?.walletV2?.tronAddress,
                    amount,
                    privateKey,
                })
                if (send?.transactionHash) {
                    transactionHash.push(send)
                } else {
                    errorTransaction.push(
                        `Error sending TRX token: ${send.error}`
                    )
                }

                return responseHandler.makeResponseData(res, 200, 'success', {
                    transactionHash,
                    errorTransaction,
                })
            }
            // PROVIDER
            const provider = getHttpProvider(
                networkProviders[network],
                networkProvidersOptions[network]
            )

            let nativeIndex = tokens.findIndex(
                (elem) =>
                    elem.symbol == 'BNB' ||
                    elem.symbol == 'ETH' ||
                    elem.symbol == 'MATIC' ||
                    elem.symbol == 'BTT'
            )
            nativeIndex !== -1 && tokens.splice(nativeIndex, 1)
            for (let token of tokens) {
                try {
                    const send = await transferTokens({
                        fromAddress: '0x' + accountData.keystore.address, // old wallet
                        toAddress:
                            '0x' +
                            accountData.walletV2.keystore
                                .address /*'0x2f5f8767F82658E24AFb1e3Ff25101bEfF98d85C'*/,
                        amount:
                            token?.balance ||
                            new Big(token?.quantity)
                                .times(new Big(10 ** (token?.decimal || 18)))
                                .toFixed(),
                        tokenSmartContractAddress: token.contract,
                        tokenSmartContractAbi: Constants.token.abi,
                        provider: provider,
                        walletPassword: pass, // req.body
                        encryptedPrivateKey: accountData.keystore,
                        max: false,
                    })
                    if (send?.transactionHash) {
                        transactionHash.push(send)
                    }
                    if (send?.error) {
                        errorTransaction.push(
                            `Error sending ${token.name} tokens: ${send.error}`
                        )
                        break
                    }
                } catch (err) {
                    continue
                }
            }

            if (nativeIndex !== -1 && errorTransaction.length === 0) {
                let connexionObj = {
                    BEP20: bep20Connexion,
                    ERC20: erc20Connexion,
                    POLYGON: polygonConnexion,
                    BTTC: bttConnexion,
                }
                const Web3Connexion = await connexionObj[network]()
                let bnbBalance = await Web3Connexion?.eth.getBalance(
                    '0x' + accountData.keystore.address
                )

                let web3 = await new Web3(provider)
                const gasPrice = await web3.eth.getGasPrice()

                gasLimit = 21000

                let amount = new Big(bnbBalance).minus(
                    new Big(gasLimit).times(new Big(gasPrice))
                )

                const send = await transferTokens({
                    fromAddress: '0x' + accountData.keystore.address, // old wallet
                    toAddress:
                        '0x' +
                        accountData.walletV2.keystore
                            .address /*'0x2f5f8767F82658E24AFb1e3Ff25101bEfF98d85C'*/,
                    amount: amount,
                    tokenSmartContractAddress: null,
                    tokenSmartContractAbi: Constants.token.abi,
                    provider: provider,
                    walletPassword: pass, // req.body
                    encryptedPrivateKey: accountData.keystore,
                    max: false,
                    ...(nativeIndex !== -1 && { token: true }),
                    network,
                })
                if (send?.transactionHash) {
                    transactionHash.push(send)
                }
                if (send?.error) {
                    errorTransaction.push(
                        `Error sending ${
                            network === 'ERC20'
                                ? 'ETH'
                                : network === 'BEP20'
                                ? 'BNB'
                                : network === 'BTTC'
                                ? 'BTT'
                                : 'MATIC'
                        } tokens: ${send.error}`
                    )
                }
            }

            return responseHandler.makeResponseData(res, 200, 'success', {
                transactionHash,
                errorTransaction,
            })
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.checkUserWalletV2Exist = async (req, res) => {
    try {
        const userId = req.user._id
        const wallet = await Wallet.findOne({ UserId: userId }).lean()
        if (wallet?.walletV2?.keystore?.address)
            return responseHandler.makeResponseData(res, 200, 'success', true)
        return responseHandler.makeResponseData(res, 200, 'success', false)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.checkIsNewUser = async (req, res) => {
    try {
        const userId = req.user._id
        const wallet = await Wallet.findOne({ UserId: userId }).lean()
        if (wallet?.walletV2?.keystore?.address && !wallet?.keystore?.address)
            return responseHandler.makeResponseData(res, 200, 'success', true)
        return responseHandler.makeResponseData(res, 200, 'success', false)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.getCodeKeyStore = async (req, res) => {
    try {
        let walletAddr

        const { network, version } = req.body

        const _id = req.user._id
        // let user = await User.findOne({ _id },{email :1}).lean()

        // let wallet = await Wallet.findOne({
        //     UserId: _id,
        // }).lean()

        let [user, wallet] = await Promise.all([
            User.findOne({ _id }, { email: 1 }).lean(),
            Wallet.findOne({
                UserId: _id,
            }).lean(),
        ])

        if (version === '1') {
            walletAddr = '0x' + wallet.keystore.address
        } else {
            walletAddr = '0x' + wallet.walletV2.keystore.address
        }

        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'user not found',
                false
            )
        } else {
            const code = Math.floor(100000 + Math.random() * 900000)
            let secureCode = {}
            ;(secureCode.code = code),
                (secureCode.expiring = Date.now() + 3600 * 20 * 5),
                (secureCode.attempts = 0),
                (secureCode.type = `keystore-v${version}-${network}`)

            await User.updateOne({ _id }, { $set: { secureCode } })
            let lang = req.body.lang || 'en'
            configureTranslation(lang)
            readHTMLFileLogin(
                __dirname +
                    '/../public/emailtemplate/email_validated_keystore_code.html',
                'exportKeystore',
                null,
                null,
                code,
                user,
                walletAddr
            )
            return responseHandler.makeResponseData(res, 200, 'code sent', true)
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.exportKeyStore = async (req, res) => {
    try {
        // VARIABLES FROM REQUEST
        const _id = req.user._id
        const { code, network, version } = req.body

        const [user, wallet] = await Promise.all([
            User.findOne({ _id }).lean(),
            Wallet.findOne({ UserId: _id }).lean(),
        ])
        // CHECK WALLET VERSION
        if (version === '1') {
            /*****                    WALLET V1                        ******/

            //CHECK FOR CODE VERIFICATION
            if (
                parseInt(code) === user.secureCode.code &&
                user.secureCode.type.includes(network) &&
                user.secureCode.type.includes(version)
            ) {
                // CHECK FOR EXPIRED CODE
                if (Date.now() - user.secureCode.expiring < 5 * 60 * 1000) {
                    // CHECK USER WALLET V1 EXIST
                    if (wallet.keystore && wallet.btc) {
                        return responseHandler.makeResponseData(
                            res,
                            200,
                            (network === 'eth' && wallet.keystore) ||
                                (network === 'btc' && wallet?.btc?.ek),
                            true
                        )
                    } else {
                        return responseHandler.makeResponseData(
                            res,
                            200,
                            'wallet v1 not found',
                            false
                        )
                    }
                } else {
                    return responseHandler.makeResponseData(
                        res,
                        200,
                        'code expired',
                        false
                    )
                }
            } else {
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            'secureCode.attempts': user.secureCode.attempts + 1,
                        },
                    }
                )
                return responseHandler.makeResponseData(
                    res,
                    200,
                    code !== user.secureCode.code
                        ? 'code wrong'
                        : 'network or version wrong',
                    false
                )
            }
        } else {
            /*****                    WALLET V2                        ******/

            //CHECK FOR CODE VERIFICATION
            if (
                parseInt(code) === user.secureCode.code &&
                user.secureCode.type.includes(network) &&
                user.secureCode.type.includes(version)
            ) {
                // CHECK FOR EXPIRED CODE
                if (Date.now() - user.secureCode.expiring < 5 * 60 * 1000) {
                    // CHECK USER WALLET V2 EXIST
                    if (wallet.walletV2?.keystore && wallet.walletV2?.btc) {
                        return responseHandler.makeResponseData(
                            res,
                            200,
                            (network === 'eth' && wallet.walletV2.keystore) ||
                                (network === 'btc' && wallet.walletV2?.btc.ek),
                            true
                        )
                    } else {
                        return responseHandler.makeResponseData(
                            res,
                            200,
                            'wallet v2 not found',
                            false
                        )
                    }
                } else {
                    return responseHandler.makeResponseData(
                        res,
                        200,
                        'code expired',
                        false
                    )
                }
            } else {
                await User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            'secureCode.attempts': user.secureCode.attempts + 1,
                        },
                    }
                )
                return responseHandler.makeResponseData(
                    res,
                    200,
                    code !== user.secureCode.code
                        ? 'code wrong'
                        : 'network or version wrong',
                    false
                )
            }
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
