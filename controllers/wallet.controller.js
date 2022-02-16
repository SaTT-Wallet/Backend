var Wallet = require('../model/wallet.model')
var User = require('../model/user.model')
var CustomToken = require('../model/customToken.model')

const rp = require('request-promise')
const { randomUUID } = require('crypto')
const { v5: uuidv5 } = require('uuid')
const jwt = require('jsonwebtoken')

const Big = require('big.js')
var requirement = require('../helpers/utils')

var connection
const { responseHandler } = require('../helpers/response-handler')

let app
;(connection = async () => {
    app = await requirement.connection()
})()

exports.exportBtc = async (req, res) => {
    try {
        console.log(req.user.hasWallet)
        if (req.user.hasWallet == true) {
            var cred = await app.account.unlock(req, res)

            let ret = await app.account.exportkeyBtc(req, res)
            return responseHandler.makeResponseData(
                res.attachment(),
                200,
                'success',
                ret
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
    } finally {
        if (cred) app.account.lock(cred.address)
    }
}

exports.exportEth = async (req, res) => {
    try {
        
        if (req.user.hasWallet == true) {
            let id = req.user._id
            var cred = await app.account.unlock(req, res)
            console.log("creddddd",cred)
            let ret = await app.account.exportkey(req, res)
            return responseHandler.makeResponseData(
                res.attachment(),
                200,
                'success',
                ret
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Account not found'
            )
        }
    } catch (err) {
        // return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
    } finally {
        if (cred) app.account.lock(cred.address)
    }
}

exports.mywallet = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            console.log('start')
            var count = await app.account.hasAccount(req, res)

            console.log(count)

            var ret = await app.account.getAccount(req, res)
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        // return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
    }
}

exports.userBalance = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let id = req.user._id
            let Crypto = app.account.getPrices()
            const balance = await app.account.getListCryptoByUid(req, res)

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
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        // return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
    }
}

exports.gasPriceBep20 = async (req, res) => {
    var gasPrice = await app.web3Bep20.eth.getGasPrice()
    return responseHandler.makeResponseData(res, 200, 'success', {
        gasPrice: gasPrice / 1000000000,
    })
}

exports.gasPriceErc20 = async (req, res) => {
    let app = await requirement.connection()

    var gasPrice = await app.web3.eth.getGasPrice()

    return responseHandler.makeResponseData(res, 200, 'success', {
        gasPrice: gasPrice / 1000000000,
    })
}

exports.cryptoDetails = async (req, res) => {
    let prices = app.account.getPrices()

    return responseHandler.makeResponseData(res, 200, 'success', prices)
}

exports.totalBalances = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var Total_balance = await app.account.getBalanceByUid(req, res)

            return responseHandler.makeResponseData(res, 200, 'success', {
                Total_balance: Total_balance.Total_balance,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        // return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
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

                await user.daily.save()
            }
        }
    }
}

exports.transfertErc20 = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var tokenERC20 = req.body.token
            var to = req.body.to
            var amount = req.body.amount
            var currency = req.body.symbole
            var decimal = req.body.decimal
            var cred = await app.account.unlock(req, res)
            cred.from_id = req.user._id
            var result = await app.account.getAccount(req, res)
            let balance = await app.erc20.getBalance(tokenERC20, result.address)
            if (new Big(amount).gt(new Big(balance.amount))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var ret = await app.erc20.transfer(tokenERC20, to, amount, cred)

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        //    return responseHandler.makeResponseError(
        //    			 res,
        //     		 500,
        //    			 err.message ? err.message : err.error
        // 			 )
    } finally {
        cred && app.account.lock(cred.address)
        if (ret && ret.transactionHash) {
            await app.account.notificationManager(req, 'transfer_event', {
                amount,
                currency,
                to,
                transactionHash: ret.transactionHash,
                network: 'ERC20',
                decimal,
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { projection: { UserId: true } }
            )
            if (wallet) {
                await app.account.notificationManager(
                    wallet.UserId,
                    'receive_transfer_event',
                    {
                        amount,
                        currency,
                        from: cred.address,
                        transactionHash: ret.transactionHash,
                        network: 'ERC20',
                        decimal,
                    }
                )
            }
        }
    }
}

exports.transfertBep20 = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var currency = req.body.symbole
            var to = req.body.to
            var amount = req.body.amount
            var decimal = req.body.decimal
            var pass = req.body.pass
            var cred = await app.account.unlockBSC(req, res)
            cred.from_id = req.user._id
            req.body.token = !req.body.token
                ? '0x448bee2d93be708b54ee6353a7cc35c4933f1156'
                : req.body.token

            var result = await app.account.getAccount(req, res)

            let balance = await app.bep20.getBalance(
                req.body.token,
                result.address
            )

            if (new Big(amount).gt(new Big(balance.amount))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }

            var ret = await app.bep20.sendBep20(
                req.body.token,
                to,
                amount,
                cred
            )
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Account not found'
            )
        }
    } catch (err) {
    } finally {
        cred && app.account.lockBSC(cred.address)
        if (ret && ret.transactionHash) {
            await app.account.notificationManager(req, 'transfer_event', {
                amount,
                network: 'BEP20',
                to: req.body.to,
                transactionHash: ret.transactionHash,
                currency,
                decimal,
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { projection: { UserId: true } }
            )
            if (wallet) {
                await app.account.notificationManager(
                    req,
                    'receive_transfer_event',
                    {
                        amount,
                        network: 'BEP20',
                        from: cred.address,
                        transactionHash: ret.transactionHash,
                        currency,
                        decimal,
                    }
                )
            }
        }
    }
}

exports.checkWalletToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }

        let [tokenAdress, network] = [req.body.tokenAdress, req.body.network]
        let abi =
            network === 'bep20'
                ? app.config.ctrs.bep20.abi
                : app.config.ctrs.token.abi
        let networkToken =
            network === 'bep20' ? app.web3Bep20.eth : app.web3.eth
        let code = await networkToken.getCode(tokenAdress)
        if (code === '0x') {
            return responseHandler.makeResponseError(
                res,
                404,
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

            if (tokenExist) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'token already added'
                )
            }

            let CryptoPrices = app.account.getPrices()

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
                    const cryptoMetaData = {
                        method: 'GET',
                        uri: app.config.cmcUrl + symbol,
                        headers: {
                            'X-CMC_PRO_API_KEY': app.config.cmcApiKey,
                        },
                        json: true,
                        gzip: true,
                    }
                    let metaData = await rp(cryptoMetaData)
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
                    { _id: app.ObjectId(id) },
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
                404,
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

exports.transfertBtc = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var pass = req.body.pass
            let id = req.user._id
            var cred = await app.account.unlock(req, res)
            var result = await app.account.getAccount(req, res)
            if (new Big(req.body.val).gt(new Big(result.btc_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var hash = await app.cryptoManager.sendBtc(
                id,
                pass,
                req.body.to,
                req.body.val
            )

            return responseHandler.makeResponseData(res, 200, 'success', hash)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        // return responseHandler.makeResponseError(
        //     res,
        //  500,
        //     err.message ? err.message : err.error
        //     )
    } finally {
        if (cred) app.account.lock(cred.address)
    }
}

exports.transfertBNB = async (req, res) => {
    var pass = req.body.pass
    try {
        if (req.user.hasWallet == true) {
            var cred = await app.account.unlockBSC(req, res)
            cred.from_id = req.user._id
            var to = req.body.to
            var amount = req.body.val
            var result = await app.account.getAccount(req, res)

            if (new Big(amount).gt(new Big(result.bnb_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var ret = await app.bep20.transferNativeBNB(to, amount, cred)

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 404, ' Account not found')
        }
    } catch (err) {
        console.log(err)
    } finally {
        cred && app.account.lockBSC(cred.address)

        if (ret.transactionHash && ret) {
            await app.account.notificationManager(req, 'transfer_event', {
                amount,
                currency: 'BNB',
                to,
                transactionHash: ret.transactionHash,
                network: 'BEP20',
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { projection: { UserId: true } }
            )
            if (wallet) {
                console.log('wallet', wallet)
                await app.account.notificationManager(
                    wallet.UserId,
                    'receive_transfer_event',
                    {
                        amount,
                        currency: 'BNB',
                        from: cred.address,
                        transactionHash: ret.transactionHash,
                        network: 'BEP20',
                    }
                )
            }
        }
    }
}

exports.transfertEther = async (req, res) => {
    var pass = req.body.pass
    var to = req.body.to
    var amount = req.body.val
    try {
        if (req.user.hasWallet == true) {
            var result = await app.account.getAccount(req, res)

            if (new Big(amount).gt(new Big(result.ether_balance))) {
                res.end(JSON.stringify({ message: 'not_enough_budget' }))
                return
            }
            var cred = await app.account.unlock(req, res)
            cred.from_id = req.user._id
            var ret = await app.cryptoManager.transfer(to, amount, cred)
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 404, ' Account not found')
        }
    } catch (err) {
        console.log('err', err)
    } finally {
        if (cred) app.account.lock(cred.address)

        if (ret) {
            await app.account.notificationManager(req, 'transfer_event', {
                amount,
                currency: 'ETH',
                to,
                transactionHash: 'ret.transactionHash',
                network: 'ERC20',
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { UserId: true }
            )
            if (wallet) {
                await app.account.notificationManager(
                    wallet.UserId,
                    'receive_transfer_event',
                    {
                        amount,
                        currency: 'ETH',
                        from: cred.address,
                        transactionHash: 'ret.transactionHash',
                        network: 'ERC20',
                    }
                )
            }
        }
    }
}

exports.getQuote = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            if (req.body.requested_amount < 50) {
                responseHandler.makeResponseError(
                    res,
                    403,
                    'Please enter amount of 50 USD or more'
                )
            } else {
                let requestQuote = req.body
                requestQuote['end_user_id'] = String(req.user._id)
                requestQuote['client_ip'] = req.addressIp
                requestQuote['payment_methods'] = ['credit_card']
                requestQuote['wallet_id'] = 'satt'
                const simplexQuote = {
                    url: app.config.sandBoxUri + '/wallet/merchant/v2/quote',
                    method: 'POST',
                    body: requestQuote,
                    headers: {
                        Authorization: `ApiKey ${app.config.sandBoxKey}`,
                    },
                    json: true,
                }
                var quote = await rp(simplexQuote)
                delete quote.supported_digital_currencies
                delete quote.supported_fiat_currencies
                app.account.log('Quote from simplex', quote)

                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    quote
                )
            }
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        app.account.sysLogError(err)
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
            if (ip) ip = ip.split(':')[3]
            let payment_id = randomUUID()
            const uiad = app.config.uiad
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
            request.order_id = uuidv5(app.config.orderSecret, uiad)
            request.uuid = payment_id
            request.currency = req.body.currency
            request.idWallet = req.body.idWallet
            let payment = app.config.paymentRequest(request)
            const paymentRequest = {
                url:
                    app.config.sandBoxUri +
                    '/wallet/merchant/v2/payments/partner/data',
                method: 'POST',
                body: payment,
                headers: {
                    Authorization: `ApiKey ${app.config.sandBoxKey}`,
                },
                json: true,
            }
            var paymentSubmitted = await rp(paymentRequest)
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
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        app.account.sysLogError(err)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        paymentSubmitted &&
            app.account.log(`requestedPayment by ${req.user._id}`)
    }
}

exports.bridge = async (req, res) => {
    let Direction = req.body.direction
    let pass = req.body.password
    let amount = req.body.amount
    var sattContract = app.config.ctrs.token.address.mainnet
    if (app.config.testnet) {
        sattContract = app.config.ctrs.token.address.testnet
    }
    try {
        var network
        var ret
        if (Direction == 'ETB') {
            network = 'ERC20'
            var cred = await app.account.unlock(req.user._id, pass)

            ret = await app.erc20.transfer(
                sattContract,
                app.config.bridge,
                amount,
                cred
            )
        } else if (Direction == 'BTE') {
            network = 'BEP20'
            var cred = await app.account.unlockBSC(req.user._id, pass)
            ret = await app.bep20.transferBEP(app.config.bridge, amount, cred)
        }
        res.end(JSON.stringify(ret))
    } catch (err) {
        res.end(JSON.stringify(err))
    } finally {
        if (cred) app.account.lock(cred.address)
        if (ret.transactionHash) {
            await app.account.notificationManager(req, 'convert_event', {
                amount,
                Direction,
                transactionHash: ret.transactionHash,
                currency: 'SATT',
                network,
            })
        }
    }
}

module.exports.getMnemo = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let wallet = await Wallet.findOne(
                { UserId: req.user._id },
                { mnemo: true }
            )
            let mnemo = wallet.mnemo

            return responseHandler.makeResponseData(res, 200, 'success', {
                mnemo,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
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
                $and: [{ UserId: req.user._id }, { mnemo }],
            })
            let verify = wallet ? true : false

            return responseHandler.makeResponseData(res, 200, 'success', {
                verify,
            })
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
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

exports.prices = (req, res) => {
    var prices = app.account.getPrices()
    res.json(prices)
}

exports.createNewWallet = async (req, res) => {
    try {
        var id = req.user._id

        console.log(req.user.hasWallet)

        if (req.user.hasWallet == false) {
            var ret = await app.account.createSeed(req, res)

            return responseHandler.makeResponseData(res, 200, 'success', {
                ret,
            })
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
    } finally {
        console.log(req.user)
        if (req.user.hasWallet == false) {
            if (ret.address) {
                await Wallet.create({
                    wallet: ret.address,
                    idUser: id,
                })
                await User.updateOne(
                    { _id: parseInt(id) },
                    {
                        $set: {
                            hasWallet: true,
                        },
                    }
                )
            }
        }
    }
}

module.exports.removeToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let id = req.user._id
            const { tokenAdress } = req.body
            let token = await CustomToken.findOne({ tokenAdress })

            if (token) {
                console.log(token, 'token2')
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
                    404,
                    'Token not found'
                )
            }
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
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
    var btcAddress = req.params.addressBTC

    try {
        //ETH Network
        const requestOptions_ETH_transactions = {
            method: 'GET',
            uri: app.config.etherscanApiUrl_ + address + '&action=txlist',
            json: true,
            gzip: true,
        }

        const requestOptions_ERC20_transactions = {
            method: 'GET',
            uri: app.config.etherscanApiUrl_ + address + '&action=tokentx',
            json: true,
            gzip: true,
        }

        var Eth_transactions = await rp(requestOptions_ETH_transactions)
        var ERC20_transactions = await rp(requestOptions_ERC20_transactions)
        var all_Eth_transactions = app.cryptoManager.FilterTransactionsByHash(
            Eth_transactions,
            ERC20_transactions,
            'ERC20'
        )
        //BNB Network
        const requestOptions_BNB_transactions = {
            method: 'GET',
            uri: app.config.bscscanApi + address + '&action=txlist',
            json: true,
            gzip: true,
        }

        const requestOptions_BEP20_transactions = {
            method: 'GET',
            uri: app.config.bscscanApi + address + '&action=tokentx',
            json: true,
            gzip: true,
        }

        var BNB_transactions = await rp(requestOptions_BNB_transactions)
        var BEP20_transactions = await rp(requestOptions_BEP20_transactions)
        var all_BNB_transactions = app.cryptoManager.FilterTransactionsByHash(
            BNB_transactions,
            BEP20_transactions,
            'BEP20'
        )
        const All_Transactions =
            all_Eth_transactions.concat(all_BNB_transactions)

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
