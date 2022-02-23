const { Wallet } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const {
    erc20Connexion,
    bep20Connexion,
    getContractByToken,
} = require('../blockchainConnexion')

const { sysLog } = require('../helpers/utils')
const { Constants } = require('../conf/const2')

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

exports.unlockBsc = async (req, res) => {
    try {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId })
        let Web3BEP20 = await bep20Connexion()
        Web3BEP20.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address, Web3BEP20 }
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

exports.lockBSC = async (credentials) => {
    credentials.Web3BEP20.eth.accounts.wallet.remove(credentials.address)
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

exports.createPerformanceCampaign = async (
    dataUrl,
    startDate,
    endDate,
    ratios,
    token,
    amount,
    credentials,
    res
) => {
    try {
        var ctr = await getContractByToken(token, credentials)
        var gasPrice = await ctr.getGasPrice()
        var gas = 600000
        var receipt = await ctr.methods
            .createPriceFundAll(
                dataUrl,
                startDate,
                endDate,
                ratios,
                token,
                amount
            )
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })

        receipt.transactionHash &&
            console.log(
                'createCampaignAll',
                credentials.address,
                `${receipt.events.CampaignCreated.transactionHash} confirmed campaign ${receipt.events.CampaignCreated.returnValues.id} launched`
            )
        return {
            hash: receipt.events.CampaignCreated.returnValues.id,
            transactionHash: receipt.events.CampaignCreated.transactionHash,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.bep20Allow = async (token, credentials, spender, amount, res) => {
    console.log('approve', token, credentials.address, spender, amount)
    try {
        var contract = new credentials.Web3BEP20.eth.Contract(
            Constants.token.abi,
            token
        )
        var gasPrice = await credentials.Web3BEP20.eth.getGasPrice()
        var gas = await contract.methods
            .approve(spender, amount)
            .estimateGas({ from: credentials.address })
        var receipt = await contract.methods
            .approve(spender, amount)
            .send({ from: credentials.address, gas: gas, gasPrice: gasPrice })
            .once('transactionHash', function (transactionHash) {
                console.log('approve transactionHash', transactionHash)
            })
        console.log(
            receipt.transactionHash,
            'confirmed approval from',
            credentials.address,
            'to',
            spender
        )
        return {
            transactionHash: receipt.transactionHash,
            address: credentials.address,
            spender: spender,
        }
    } catch (err) {
        res.status(500).send({
            code: 500,
            error: err.message ? err.message : err.error,
        })
    }
}

exports.bep20Approve = async (token, address, spender) => {
    try {
        let Web3BEP20 = await bep20Connexion()
        var contract = new Web3BEP20.eth.Contract(Constants.token.abi, token)
        var amount = await contract.methods.allowance(address, spender).call()
        console.log('approval', address, 'for', spender, amount.toString())
        return { amount: amount.toString() }
    } catch (err) {
        return { amount: '0' }
    }
}
