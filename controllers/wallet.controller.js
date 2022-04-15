const { User, Wallet, CustomToken } = require('../model/index')

const rp = require('request-promise')
const { randomUUID } = require('crypto')
const { v5: uuidv5 } = require('uuid')
const cron = require('node-cron')
var fs = require('fs')

const {
    getContractByToken,
    erc20Connexion,
    bep20Connexion,
} = require('../blockchainConnexion')

const { configSendBox } = require('../conf/config')

const Big = require('big.js')
var requirement = require('../helpers/utils')
const { synfonyHash } = require('../helpers/utils')

var connection
const { responseHandler } = require('../helpers/response-handler')
const { Constants } = require('../conf/const')
const {
    unlock,
    lock,
    createSeed,
    exportkeyBtc,
    exportkey,
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
    transferEther,
    FilterTransactionsByHash,
    getTokenContractByToken,
} = require('../web3/wallets')

const { notificationManager } = require('../manager/accounts')

const { payementRequest } = require('../conf/config')
const { BalanceUsersStats } = require('../helpers/common')
cron.schedule(process.env.CRON_WALLET_USERS_sTAT_DAILY, () =>
    BalanceUsersStats('daily')
)

cron.schedule(process.env.CRON_WALLET_USERS_sTAT_MONTHLY, () =>
    BalanceUsersStats('monthly')
)

cron.schedule(process.env.CRON_WALLET_USERS_sTAT_WEEKLY, () =>
    BalanceUsersStats('weekly')
)
exports.exportBtc = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var cred = await unlock(req, res)
            if (!cred) return

            let ret = await exportkeyBtc(req, res)

            return responseHandler.makeResponseData(
                res.attachment(),
                200,
                'success',
                ret
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log('errrrr', err)
    }
}

exports.exportEth = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let ret = await exportkey(req, res)

            console.log('ret', ret)

            if (!ret) {
                return
            }

            responseHandler.makeResponseData(
                res.attachment(),
                200,
                'success',
                ret
            )
        } else {
            responseHandler.makeResponseError(res, 204, 'Account not found')
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.mywallet = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var ret = await getAccount(req, res)
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
        console.log(err.message)

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
    } catch (err) {
        console.log(err)
    }
}

exports.gasPriceBep20 = async (req, res) => {
    let Web3ETH = await erc20Connexion()

    var gasPrice = await Web3ETH.eth.getGasPrice()
    return responseHandler.makeResponseData(res, 200, 'success', {
        gasPrice: gasPrice / 1000000000,
    })
}

exports.gasPriceErc20 = async (req, res) => {
    let Web3BEP20 = await erc20Connexion()

    var gasPrice = await Web3BEP20.eth.getGasPrice()
    return responseHandler.makeResponseData(res, 200, 'success', {
        gasPrice: gasPrice / 1000000000,
    })
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
        console.log(err.message)

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

exports.transfertErc20 = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var tokenERC20 = req.body.token
            var to = req.body.to
            var amount = req.body.amount
            var tokenName = req.body.symbole
            var cred = await unlock(req, res)

            if (!cred) {
                return
            }
            var result = await getAccount(req, res)

            let balance = await getBalance(
                cred.Web3ETH,
                tokenERC20,
                result.address
            )

            if (new Big(amount).gt(new Big(balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }

            var ret = await transfer(tokenERC20, to, amount, cred)

            if (ret.error) {
                return responseHandler.makeResponseError(res, 402, ret.error)
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
        console.log(err)
    } finally {
        cred && lock(cred)
        if (ret && ret.transactionHash) {
            await notificationManager(req.user._id, 'transfer_event', {
                amount,
                currency: tokenName,
                from: cred.address,
                to,
                transactionHash: ret.transactionHash,
                network: 'ERC20',
            })
            const wallet = await Wallet.findOne({
                'keystore.address': to.substring(2),
            }).select('UserId')

            if (wallet) {
                await notificationManager(
                    wallet.UserId,
                    'receive_transfer_event',
                    {
                        amount,
                        currency: tokenName,
                        from: cred.address,
                        transactionHash: ret.transactionHash,
                        network: 'ERC20',
                    }
                )
            }
        }
    }
}

exports.transfertBep20 = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var to = req.body.to
            var amount = req.body.amount
            var cred = await unlockBsc(req, res)
            req.body.token = !req.body.token
                ? '0x448bee2d93be708b54ee6353a7cc35c4933f1156'
                : req.body.token

            var result = await getAccount(req, res)

            let balance = await getBalance(
                cred.Web3BEP20,
                req.body.token,
                result.address
            )

            if (new Big(amount).gt(new Big(balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }

            var ret = await sendBep20(req.body.token, to, amount, cred)

            if (ret.error) {
                return responseHandler.makeResponseError(res, 402, ret.error)
            }

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Account not found'
            )
        }
    } catch (err) {
        console.log(err)
    } finally {
        cred && lockBSC(cred)
        if (ret && ret.transactionHash) {
            await notificationManager(req.user._id, 'transfer_event', {
                amount,
                currency: req.body.symbole,
                network: 'BEP20',
                to: req.body.to,
                transactionHash: ret.transactionHash,
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { UserId: 1 }
            )
            if (wallet) {
                await notificationManager(
                    wallet.UserId,
                    'receive_transfer_event',
                    {
                        amount,
                        currency: req.body.symbole,
                        network: 'BEP20',
                        from: cred.address,
                        transactionHash: ret.transactionHash,
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
                204,
                'Wallet not found'
            )
        }
        let Web3BEP20 = await bep20Connexion()
        let Web3ETH = await erc20Connexion()

        let [tokenAdress, network] = [req.body.tokenAdress, req.body.network]
        let abi =
            network === 'bep20' ? Constants.bep20.abi : Constants.token.abi
        let networkToken = network === 'bep20' ? Web3BEP20.eth : Web3ETH.eth

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
        console.log(err.message)

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
                    const cryptoMetaData = {
                        method: 'GET',
                        uri: process.env.CMR_URL + symbol,
                        headers: {
                            'X-CMC_PRO_API_KEY': process.env.CMCAPIKEY,
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
        console.log(err.message)

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
            var cred = await unlock(req, res)
            var result = await getAccount(req, res)

            if (new Big(req.body.val).gt(new Big(result.btc_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var hash = await sendBtc(id, pass, req.body.to, req.body.val)
            if (hash.error) {
                return responseHandler.makeResponseError(res, 402, hash.error)
            }

            return responseHandler.makeResponseData(res, 200, 'success', hash)
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (cred) await lock(cred)
    }
}

exports.transfertBNB = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var cred = await unlockBsc(req, res)
            var to = req.body.to
            var amount = req.body.val
            var result = await getAccount(req, res)

            if (new Big(amount).gt(new Big(result.bnb_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var ret = await transferNativeBNB(to, amount, cred)
            if (ret.error) {
                return responseHandler.makeResponseError(res, 402, ret.error)
            }

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 204, ' Account not found')
        }
    } catch (err) {
        console.log(err)
    } finally {
        cred && lockBSC(cred)
        if (ret?.transactionHash && ret) {
            await notificationManager(req.user._id, 'transfer_event', {
                amount,
                currency: 'BNB',
                to,
                transactionHash: ret.transactionHash,
                network: 'BEP20',
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { UserId: 1 }
            )
            if (wallet) {
                await notificationManager(
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
    var to = req.body.to
    var amount = req.body.val
    try {
        if (req.user.hasWallet == true) {
            var result = await getAccount(req, res)

            if (new Big(amount).gt(new Big(result.ether_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var cred = await unlock(req, res)

            var ret = await transferEther(to, amount, cred)

            if (ret.error) {
                return responseHandler.makeResponseError(res, 402, ret.error)
            }
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 204, ' Account not found')
        }
    } catch (err) {
        console.log('err', err)
    } finally {
        if (cred) lock(cred)
        if (ret) {
            await notificationManager(req.user._id, 'transfer_event', {
                amount,
                currency: 'ETH',
                to,
                transactionHash: 'ret.transactionHash',
                network: 'ERC20',
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { UserId: 1 }
            )
            if (wallet) {
                await notificationManager(
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
        let ip =
            req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
        if (ip) ip = ip.split(':')[3]
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
                requestQuote['client_ip'] = ip
                requestQuote['payment_methods'] = ['credit_card']
                requestQuote['wallet_id'] = 'satt'
                const simplexQuote = {
                    url: configSendBox + '/wallet/merchant/v2/quote',
                    method: 'POST',
                    body: requestQuote,
                    headers: {
                        Authorization: `ApiKey ${process.env.SEND_BOX}`,
                    },
                    json: true,
                }
                var quote = await rp(simplexQuote)
                delete quote.supported_digital_currencies
                delete quote.supported_fiat_currencies

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
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err.message)

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
            const paymentRequest = {
                url:
                    configSendBox + '/wallet/merchant/v2/payments/partner/data',
                method: 'POST',
                body: payment,
                headers: {
                    Authorization: `ApiKey ${process.env.SEND_BOX}`,
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
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

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
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err.message)

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
                204,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.createNewWallet = async (req, res) => {
    try {
        var id = req.user._id
        let user = await User.findOne({ _id: id }, { password: 1 })
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
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (ret) {
            await Wallet.create({
                wallet: ret.address,
                idUser: id,
            })

            await User.updateOne(
                { _id: id },
                {
                    $set: {
                        hasWallet: true,
                    },
                }
            )
        }
    }
}

module.exports.removeToken = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            let id = req.user._id
            const tokenAdress = req.params.tokenAddress
            let token = await CustomToken.findOne({ tokenAdress })
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
        console.log(err.message)

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

        var Eth_transactions = await rp(requestOptions_ETH_transactions)
        var ERC20_transactions = await rp(requestOptions_ERC20_transactions)
        var all_Eth_transactions = FilterTransactionsByHash(
            Eth_transactions,
            ERC20_transactions,
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

        var BNB_transactions = await rp(requestOptions_BNB_transactions)
        var BEP20_transactions = await rp(requestOptions_BEP20_transactions)
        var all_BNB_transactions = FilterTransactionsByHash(
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
        console.log(err.message)

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
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
