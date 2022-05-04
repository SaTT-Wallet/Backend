var requirement = require('./utils')

var Campaigns = require('../model/campaigns.model')
var CampaignLink = require('../model/campaignLink.model')

var LinkedinProfile = require('../model/linkedinProfile.model')

var Wallet = require('../model/wallet.model')
var Event = require('../model/event.model')
var Request = require('../model/request.model')
var User = require('../model/user.model')
var TwitterProfile = require('../model/twitterProfile.model')

// /const { getPrices } = require('../manager/accounts.js')
//const { getBalanceByUid } = require('../web3/wallets')

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
const { campaignStatus } = require('../web3/campaigns')
const {
    getPromApplyStats,
    findBountyOracle,
    answerAbos,
    getTotalToEarn,
    getReward,
    getButtonStatus,
} = require('../manager/oracles')

/*
	@description: Script that change campaign and links statistics
	*/
module.exports.updateStat = async () => {
    let dateNow = new Date()
    let campaigns = await Campaigns.find(
        { hash: { $exists: true } },
        {
            logo: 0,
            resume: 0,
            description: 0,
            tags: 0,
            cover: 0,
            coverSrc: 0,
            coverMobile: 0,
            coverSrcMobile: 0,
            countries: 0,
        }
    )

    campaigns.forEach(async (campaign) => {
        campaign &&
            (await Campaigns.updateOne(
                { _id: campaign._id },
                { $set: { type: campaignStatus(campaign) } }
            ))
    })
    var Events = await CampaignLink.find()
    Events.forEach(async (event) => {
        let campaign = await Campaigns.findOne(
            { hash: event.id_campaign },
            {
                logo: 0,
                resume: 0,
                description: 0,
                tags: 0,
                cover: 0,
                coverSrc: 0,
                countries: 0,
            }
        )

        if (campaign) {
            var endDate = Date.parse(campaign?.endDate)
                ? new Date(Date.parse(campaign?.endDate))
                : new Date(+campaign?.endDate * 1000)

            campaign.isFinished =
                endDate < dateNow || campaign?.funds[1] === '0'
            if (!campaign.isFinished) {
                if (campaign && campaign.funds)
                    campaign.remaining = campaign.funds[1] || campaign.cost

                if (!event.status || event.status == 'rejected') return
                event.campaign = campaign
                let userWallet =
                    event.status &&
                    // !campaign.isFinished &&
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
                    (await LinkedinProfile.findOne({
                        userId: userWallet.UserId,
                    }))
                let socialOracle =
                    event.status &&
                    // !campaign.isFinished &&
                    (await getPromApplyStats(
                        findBountyOracle(event.typeSN),
                        event,
                        userWallet.UserId,
                        linkedinProfile
                    ))

                if (socialOracle === 'indisponible')
                    event.status = 'indisponible'
                event.shares = (socialOracle && socialOracle.shares) || '0'
                event.likes = (socialOracle && socialOracle.likes) || '0'
                let views = (socialOracle && socialOracle.views) || '0'
                event.views = views === 'old' ? event.views : views
                event.media_url = (socialOracle && socialOracle.media_url) || ''
                event.oracle = findBountyOracle(event.typeSN)

                if (campaign.ratios.length && socialOracle) {
                    event.totalToEarn = getTotalToEarn(event, campaign.ratios)
                }

                if (campaign.bounties.length && socialOracle) {
                    event.totalToEarn = getReward(event, campaign.bounties)
                }
                // if (campaign.isFinished) event.totalToEarn = 0

                if (campaign) event.type = getButtonStatus(event)
                delete event.campaign
                delete event.payedAmount
                await this.UpdateStats(event, socialOracle) //saving & updating proms in campaign_link.
            }
        }
    })
}

exports.UpdateStats = async (obj, socialOracle) => {
    if (!socialOracle)
        delete obj.views,
            delete obj.likes,
            delete obj.shares,
            delete obj.totalToEarn
    await CampaignLink.findOne(
        { id_prom: obj.id_prom },
        async (err, result) => {
            if (!result) {
                await CampaignLink.create(obj)
            } else {
                await CampaignLink.updateOne(
                    { id_prom: obj.id_prom },
                    { $set: obj }
                )
            }
        }
    )
}

exports.BalanceUsersStats = async (condition) => {
    let today = new Date().toLocaleDateString('en-US')
    let [currentDate, result] = [Math.round(new Date().getTime() / 1000), {}]
    ;[result.Date, result.convertDate] = [currentDate, today]

    let Crypto = await getPrices()

    var users_
    if (condition === 'daily') {
        users_ = await User.find({
            $and: [
                { userSatt: true },
                { hasWallet: true },
                { 'daily.convertDate': { $nin: [today] } },
            ],
        })
    } else if (condition === 'weekly') {
        users_ = await User.find({
            $and: [
                { userSatt: true },
                { hasWallet: true },
                { 'weekly.convertDate': { $nin: [today] } },
            ],
        })
    } else if (condition === 'monthly') {
        users_ = await User.find({
            $and: [
                { userSatt: true },
                { hasWallet: true },
                { 'monthly.convertDate': { $nin: [today] } },
            ],
        })
    }

    let [counter, usersCount] = [0, users_.length]
    while (counter < usersCount) {
        let balance

        var user = users_[counter]
        let id = user._id //storing user id in a variable

        if (!user[condition]) {
            user[condition] = []
        } //adding time frame field in users depending on condition if it doesn't exist.

        try {
            let req = { user: users_[counter] }
            let res = {}
            balance = await getBalanceByUid(req, res)
        } catch (err) {
            console.error(err)
        }

        result.Balance = balance['Total_balance']

        if (
            !result.Balance ||
            isNaN(parseInt(result.Balance)) ||
            result.Balance === null
        ) {
            counter++
        } else {
            user[condition].unshift(result)
            if (user[condition].length > 7) {
                user[condition].pop()
            } //balances array should not exceed 7 elements
            let newUser = user.toObject()
            delete newUser._id
            await User.updateOne({ _id: id }, { $set: newUser })
            delete result.Balance
            delete id
            counter++
        }
    }
}
