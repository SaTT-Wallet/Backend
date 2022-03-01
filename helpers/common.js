var requirement = require('./utils')

var Campaigns = require('../model/campaigns.model')
var CampaignLink = require('../model/campaignLink.model')

var LinkedinProfile = require('../model/linkedinProfile.model')

var Wallet = require('../model/wallet.model')
var Event = require('../model/event.model')
var Ban = require('../model/ban.model')
var Request = require('../model/request.model')
var User = require('../model/user.model')
var TwitterProfile = require('../model/twitterProfile.model')
var connection
let app
;(connection = async () => {
    app = await requirement.connection()
})()

const {
    unlock,
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
    sendBep20,
    sendBtc,
    transferNativeBNB,
    transferEther,
} = require('../web3/wallets')

/*
	@description: Script that change campaign and links statistics
	*/
module.exports.updateStat = async () => {
    let dateNow = new Date()
    let campaigns = await Campaigns.find(
        { hash: { $exists: true } },
        {
            fields: {
                logo: 0,
                resume: 0,
                description: 0,
                tags: 0,
                cover: 0,
                coverSrc: 0,
                countries: 0,
            },
        }
    )

    campaigns.forEach(async (campaign) => {
        campaign &&
            (await Campaigns.updateOne(
                { _id: campaign._id },
                { $set: { type: app.campaign.campaignStatus(campaign) } }
            ))
    })
    var Events = await CampaignLink.find()
    Events.forEach(async (event) => {
        let campaign = await Campaigns.findOne(
            { hash: event.id_campaign },
            {
                fields: {
                    logo: 0,
                    resume: 0,
                    description: 0,
                    tags: 0,
                    cover: 0,
                    coverSrc: 0,
                    countries: 0,
                },
            }
        )
        var endDate = Date.parse(campaign.endDate)
            ? new Date(Date.parse(campaign.endDate))
            : new Date(+campaign.endDate * 1000)
        campaign.isFinished = endDate < dateNow || campaign.funds[1] === '0'
        if (campaign && campaign.funds)
            campaign.remaining = campaign.funds[1] || campaign.cost

        if (!event.status || event.status == 'rejected') return
        event.campaign = campaign
        let userWallet =
            event.status &&
            !campaign.isFinished &&
            (await Wallet.findOne(
                {
                    'keystore.address': event.id_wallet
                        .toLowerCase()
                        .substring(2),
                },
                { UserId: 1, _id: 0 }
            ))

        let linkedinProfile =
            event.typeSN == '5' &&
            event.status &&
            (await LinkedinProfile.findOne({ userId: userWallet.UserId }))
        let socialOracle =
            event.status &&
            !campaign.isFinished &&
            (await app.campaign.getPromApplyStats(
                app.oracle.findBountyOracle(event.typeSN),
                event,
                userWallet.UserId,
                linkedinProfile
            ))

        if (socialOracle === 'indisponible') event.status = 'indisponible'

        event.shares = (socialOracle && socialOracle.shares) || '0'
        event.likes = (socialOracle && socialOracle.likes) || '0'
        let views = (socialOracle && socialOracle.views) || '0'
        event.views = views === 'old' ? event.views : views
        event.media_url = (socialOracle && socialOracle.media_url) || ''
        event.oracle = app.oracle.findBountyOracle(event.typeSN)
        if (campaign && socialOracle) {
            event.abosNumber = await app.oracleManager.answerAbos(
                event.typeSN,
                event.idPost,
                event.idUser,
                linkedinProfile
            )
            event.oracle === 'twitter' &&
                (await TwitterProfile.updateOne(
                    { UserId: userWallet.UserId },
                    { $set: { subscibers: event.abosNumber } }
                ))
        }
        if (event.abosNumber === 'indisponible') event.status = 'indisponible'

        if (campaign.ratios.length && socialOracle) {
            event.totalToEarn = app.campaign.getTotalToEarn(
                event,
                campaign.ratios
            )
        }

        if (campaign.bounties.length && socialOracle) {
            event.totalToEarn = app.campaign.getReward(event, campaign.bounties)
        }
        if (campaign.isFinished) event.totalToEarn = 0

        if (campaign) event.type = app.campaign.getButtonStatus(event)
        delete event.campaign
        delete event.payedAmount
        await app.campaign.UpdateStats(event, socialOracle) //saving & updating proms in campaign_link.
    })
}

// module.exports.BalanceUsersStats = async (condition) => {
//     let today = new Date().toLocaleDateString('en-US')
//     let [currentDate, result] = [Math.round(new Date().getTime() / 1000), {}]

//     ;[result.Date, result.convertDate] = [currentDate, today]

//     let Crypto =  await getPrices()

//     var users_

//     if (condition === 'daily') {
//         users_ = await User.find({
//             $and: [
//                 { userSatt: true },
//                 { 'daily.convertDate': { $nin: [today] } },
//             ],
//         })
//     } else if (condition === 'weekly') {
//         users_ = await User.find({
//             $and: [
//                 { userSatt: true },
//                 { 'weekly.convertDate': { $nin: [today] } },
//             ],
//         })
//     } else if (condition === 'monthly') {
//         users_ = await User.find({
//             $and: [
//                 { userSatt: true },
//                 { 'monthly.convertDate': { $nin: [today] } },
//             ],
//         })
//     }

//     let [counter, usersCount] = [0, users_.length]
//     while (counter < usersCount) {
//         let balance

//         var user = users_[counter]
//         let id = user._id //storing user id in a variable
//         delete user._id

//         if (!user[condition]) {
//             user[condition] = []
//         } //adding time frame field in users depending on condition if it doesn't exist.

//         try {
//             balance = await getBalanceByUid(req, res)
//         } catch (err) {
//             console.error(err)
//         }

//         result.Balance = balance['Total_balance']

//         if (
//             !result.Balance ||
//             isNaN(parseInt(result.Balance)) ||
//             result.Balance === null
//         ) {
//             counter++
//         } else {
//             user[condition].unshift(result)
//             if (user[condition].length > 7) {
//                 user[condition].pop()
//             } //balances array should not exceed 7 elements
//             await User.updateOne({ _id: id }, { $set: user })
//             delete result.Balance
//             delete id
//             counter++
//         }
//     }
// }
