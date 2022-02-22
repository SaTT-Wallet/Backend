const {
    Wallet
} = require('../model/index')
const { responseHandler } = require('../helpers/response-handler');
const { erc20Connexion, bep20Connexion } = require('../blockchainConnexion');

exports.unlock = async (req, res) => {
    try {
        let UserId = req.user._id;
        let pass = req.body.pass;

        let account = await Wallet.findOne({ UserId });
        erc20Connexion.eth.accounts.wallet.decrypt([account.keystore], pass)
        bep20Connexion.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address }
    } catch (err) {
        console.log(err)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.createPerformanceCampaign = async (dataUrl,startDate,endDate,ratios,token,amount,credentials) => {
    try {
        let UserId = req.user._id;
        let pass = req.body.pass;

        let account = await Wallet.findOne({ UserId });
        erc20Connexion.eth.accounts.wallet.decrypt([account.keystore], pass)
        bep20Connexion.eth.accounts.wallet.decrypt([account.keystore], pass)
        return { address: '0x' + account.keystore.address }
    } catch (err) {
        console.log(err)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}