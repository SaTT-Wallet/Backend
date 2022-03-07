const { User, Wallet, CustomToken } = require('../model/index')

const rp = require('request-promise')
const { randomUUID } = require('crypto')
const { v5: uuidv5 } = require('uuid')
const cron = require('node-cron')

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
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err)
    }
}

exports.exportEth = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var cred = await unlock(req, res)
            let ret = await exportkey(req, res)

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
        console.log(err)
    }
}

exports.mywallet = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var ret = await getAccount(req, res)
            return responseHandler.makeResponseData(res, 200, 'success', ret)
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
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err)
        // return responseHandler.makeResponseError(
        //     res,
        //     500,
        //     err.message ? err.message : err.error
        // )
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
            cred.from_id = req.user._id
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

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
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
                token: tokenName,
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
                        token: tokenName,
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
            cred.from_id = req.user._id
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
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Account not found'
            )
        }
    } catch (err) {
        // console.log(err)
    } finally {
        cred && lockBSC(cred)
        if (ret && ret.transactionHash) {
            await notificationManager(req.user._id, 'transfer_event', {
                amount,
                network: 'BEP20',
                to: req.body.to,
                transactionHash: ret.transactionHash,
            })
            const wallet = await Wallet.findOne(
                { 'keystore.address': to.substring(2) },
                { projection: { UserId: true } }
            )
            if (wallet) {
                await notificationManager(
                    req.user._id,
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
        // console.log(err)
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
            var cred = await unlock(req, res)
            var result = await getAccount(req, res)

            console.log(result)
            if (new Big(req.body.val).gt(new Big(result.btc_balance))) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'not_enough_budget'
                )
            }
            var hash = await sendBtc(id, pass, req.body.to, req.body.val)

            return responseHandler.makeResponseData(res, 200, 'success', hash)
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Wallet not found'
            )
        }
    } catch (err) {
        console.log(err)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (cred) await lock(cred.address)
    }
}

exports.transfertBNB = async (req, res) => {
    try {
        if (req.user.hasWallet == true) {
            var cred = await unlockBsc(req, res)
            cred.from_id = req.user._id
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

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 404, ' Account not found')
        }
    } catch (err) {
        console.log(err)
    } finally {
        cred && lockBSC(cred)
        if (ret.transactionHash && ret) {
            await notificationManager(req.user._id, 'transfer_event', {
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
                    ' not_enough_budget'
                )
            }
            var cred = await unlock(req, res)
            cred.from_id = req.user._id
            var ret = await transferEther(to, amount, cred)
            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            responseHandler.makeResponseError(res, 404, ' Account not found')
        }
    } catch (err) {
        console.log('err', err)
    } finally {
        if (cred) lock(cred.address)
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
                { UserId: true }
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

            console.log('ret', ret)

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        }
    } catch (err) {
        console.log(err)
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
        console.log(err)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
