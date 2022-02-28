const { Wallet } = require('../model/index')
const { responseHandler } = require('../helpers/response-handler')
const {
    erc20Connexion,
    bep20Connexion,
    getContractByToken,
} = require('../blockchainConnexion')

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

exports.lockERC20 = async (credentials) => {
    credentials.Web3ETH.eth.accounts.wallet.remove(credentials.address)
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

exports.createBountiesCampaign = async (
    dataUrl,
    startDate,
    endDate,
    bounties,
    token,
    amount,
    credentials,
    res
) => {
    var ctr = await getContractByToken(token, credentials)
    var gasPrice = await ctr.getGasPrice()
    var gas = 600000
    console.log('gasPrice', gasPrice)
    // var gas = await ctr.methods
    //     .createPriceFundBounty(
    //         dataUrl,
    //         startDate,
    //         endDate,
    //         bounties,
    //         token,
    //         amount
    //     )
    //     .estimateGas({ from: credentials.address, gasPrice: gasPrice })
    try {
        var receipt = await ctr.methods
            .createPriceFundBounty(
                dataUrl,
                startDate,
                endDate,
                bounties,
                token,
                amount
            )
            .send({
                from: credentials.address,
                gas: gas,
                gasPrice: gasPrice,
            })
        let transactionHash = receipt.events.CampaignCreated.transactionHash
        transactionHash &&
            console.log(
                'createCampaignBounties',
                credentials.address,
                `${transactionHash} confirmed campaignBounty ${receipt.events.CampaignCreated.returnValues.id} launched`
            )
        return {
            hash: receipt.events.CampaignCreated.returnValues.id,
            transactionHash,
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

exports.erc20Allow = async (token, credentials, spender, amount, res) => {
    try {
        var contract = new credentials.Web3ETH.eth.Contract(
            Constants.token.abi,
            token
        )
        var gasPrice = await credentials.Web3ETH.eth.getGasPrice()
        var gas = await contract.methods
            .approve(spender, amount)
            .estimateGas({ from: credentials.address })
        var receipt = await contract.methods
            .approve(spender, amount)
            .send({ from: credentials.address, gas: gas, gasPrice: gasPrice })
            .once('transactionHash', (transactionHash) => {
                console.log('approve transactionHash', transactionHash)
            })
        console.log(
            'approve',
            credentials.address,
            `confirmed approval to ${spender}`
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

exports.erc20Approve = async (token, address, spender) => {
    try {
        let Web3ETH = await erc20Connexion()
        var contract = new Web3ETH.eth.Contract(Constants.token.abi, token)
        var amount = await contract.methods.allowance(address, spender).call()
        console.log('approval', address, 'for', spender, amount.toString())
        return { amount: amount.toString() }
    } catch (err) {
        return { amount: '0' }
    }
}

exports.sortOutPublic = (req, idNode, strangerDraft) => {
    const title = req.query.searchTerm || ''
    const status = req.query.status
    const blockchainType = req.query.blockchainType || ''

    const dateJour = Math.round(new Date().getTime() / 1000)
    if (req.query._id) query['$and'].push({ _id: { $gt: req.query._id } })

    const remainingBudget = req.query.remainingBudget || []

    var query = {}
    query['$and'] = []

    if (
        (req.query.idWallet || req.query.showOnlyMyCampaigns) &&
        !req.query.showOnlyLiveCampaigns
    )
        query['$and'].push({ _id: { $nin: strangerDraft } })

    req.query.showOnlyMyCampaigns && query['$and'].push({ idNode })
    req.query.showOnlyLiveCampaigns &&
        query['$and'].push({ type: 'apply', hash: { $exists: true } })
    !req.query.idWallet && query['$and'].push({ hash: { $exists: true } })
    req.query.remuneration &&
        query['$and'].push({ remuneration: req.query.remuneration })

    if (req.query.oracles == undefined) {
        oracles = ['twitter', 'facebook', 'youtube', 'instagram', 'linkedin']
    } else if (typeof req.query.oracles === 'string') {
        oracles = Array(req.query.oracles)
    } else {
        oracles = req.query.oracles
    }
    if (req.query.oracles)
        query['$and'].push({
            $or: [
                { 'ratios.oracle': { $in: oracles } },
                { 'bounties.oracle': { $in: oracles } },
            ],
        })

    title &&
        query['$and'].push({
            title: { $regex: '.*' + title + '.*', $options: 'i' },
        })
    blockchainType && query['$and'].push({ 'token.type': blockchainType })

    if (status == 'active') {
        if (remainingBudget.length == 2) {
            query['$and'].push({ 'funds.1': { $exists: true } })
            query['$and'].push({
                'funds.1': {
                    $gte: remainingBudget[0],
                    $lte: remainingBudget[1],
                },
            })
        }
        query['$and'].push({ endDate: { $gt: dateJour } })
        query['$and'].push({ 'funds.1': { $ne: '0' } })
        query['$and'].push({ hash: { $exists: true } })
    } else if (status == 'finished') {
        query['$and'].push({
            $or: [{ endDate: { $lt: dateJour } }, { 'funds.1': { $eq: '0' } }],
        })
        query['$and'].push({ hash: { $exists: true } })
    } else if (status == 'draft') {
        query['$and'].push({ hash: { $exists: false } })
        query['$and'].push({ idNode: idNode })
    }

    query['$and'].push({
        type: {
            $in: ['draft', 'finished', 'inProgress', 'apply'],
        },
    })

    return query
}

exports.getUserIdByWallet = async (wallet) => {
    console.log(wallet)
    let user = await Wallet.findOne({ 'keystore.address': wallet })
    return user.UserId
}
