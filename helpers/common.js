var requirement = require('./utils')

var Campaigns = require('../model/campaigns.model')
var CampaignLink = require('../model/campaignLink.model')

var LinkedinProfile = require('../model/linkedinProfile.model')

var Wallet = require('../model/wallet.model')
var Event = require('../model/event.model')
var Request = require('../model/request.model')
var User = require('../model/user.model')
var TwitterProfile = require('../model/twitterProfile.model')
var fs = require('fs')
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
const {
    campaignStatus,
    getLinkedinLinkInfo,
    getLinkedinLinkInfoMedia,
} = require('../web3/campaigns')
const {
    getPromApplyStats,
    findBountyOracle,
    getTotalToEarn,
    getReward,
    getButtonStatus,
    updateFacebookPages,
    answerAbos,
} = require('../manager/oracles')
const { TikTokProfile, FbProfile } = require('../model')
const { ConnectionCheckedOutEvent } = require('mongodb')
/*
	@description: Script that change campaign and links statistics
	*/

module.exports.updateStat = async () => {
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

    for (let campaign of campaigns) {
        if (!campaign) continue
        let type = campaignStatus(campaign)
        await Campaigns.updateOne(
            { _id: campaign._id },
            {
                $set: {
                    type,
                    launchDate: new Date(
                        campaign.startDate * 1000
                    ).toISOString(),
                },
            }
        )
        campaign.type = type
    }

    var Events = await CampaignLink.find({
        $or: [{ deleted: { $ne: true } }, { status: { $ne: 'indisponible' } }],
    })

    let eventLint = []
    Events.forEach((event) => {
        const result = campaigns.find(
            (campaign) => event.id_campaign === campaign.hash
        )

        if (result?.toObject()) {
            eventLint.push({ ...event.toObject(), campaign: result.toObject() })
        }
    })

    let userWallet
    for (const event of eventLint) {
        if (event.status === 'rejected' || event.campaign?.type === 'finished')
            continue

        userWallet =
            (event.id_wallet.indexOf('0x') >= 0 &&
                // !campaign.isFinished &&
                (await Wallet.findOne(
                    {
                        'keystore.address': event.id_wallet
                            .toLowerCase()
                            .substring(2),
                    },
                    { UserId: 1, _id: 0 }
                ))) ||
            (await Wallet.findOne(
                {
                    tronAddress: event.id_wallet,
                },
                { UserId: 1, _id: 0 }
            ))

        if (userWallet) {
            if (event.typeSN == 5) {
                var linkedinProfile = await LinkedinProfile.findOne({
                    userId: userWallet?.UserId,
                })
                var linkedinInfo = await getLinkedinLinkInfoMedia(
                    linkedinProfile?.accessToken,
                    event.idPost,
                    linkedinProfile
                )

                var media_url = linkedinInfo?.mediaUrl || ''
            }

            if (event.typeSN == '1') {
                var facebookProfile = await FbProfile.findOne(
                    {
                        UserId: userWallet?.UserId,
                    },
                    { accessToken: 1 }
                ).lean()

                await updateFacebookPages(
                    userWallet?.UserId,
                    facebookProfile?.accessToken,
                    false
                )
            }
            if (event.typeSN == '6') {
                var tiktokProfile = await TikTokProfile.findOne({
                    userId: userWallet?.UserId,
                })
            }

            let oracle = findBountyOracle(event.typeSN)
            try {
                var socialOracle = await getPromApplyStats(
                    oracle,
                    event,
                    userWallet?.UserId,
                    linkedinProfile,
                    tiktokProfile
                )
            } catch (e) {
                console.error(e)
                continue
            }

            if (socialOracle === 'Rate limit exceeded') continue
            socialOracle === 'No found' && (event.deleted = true)
            socialOracle === 'indisponible' && (event.status = 'indisponible')

            if (socialOracle && typeof socialOracle !== 'string') {
                event.shares = socialOracle?.shares || event.shares
                event.likes = socialOracle?.likes || event.likes
                event.views =
                    socialOracle?.views === 'old'
                        ? event.views
                        : socialOracle?.views
                event.media_url = socialOracle?.media_url || media_url
                event.oracle = oracle
            }

            if (event.campaign.ratios.length && socialOracle) {
                event.totalToEarn =
                    event.campaign.funds[1] !== '0'
                        ? getTotalToEarn(event, event.campaign.ratios)
                        : 0
            }

            if (event.campaign.bounties.length && socialOracle) {
                event.totalToEarn = getReward(event, event.campaign.bounties)
            }

            event.type = getButtonStatus(event)

            delete event.campaign
            delete event.payedAmount
            delete event._id
            delete event.status
            await this.UpdateStats(event, socialOracle) //saving & updating proms in campaign_link.
        }
    }
}

exports.updateStatforUser = async (UserId) => {
    let campaigns = await Campaigns.find(
        { hash: { $exists: true }, type: { $ne: 'archived' } },
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

    for (let campaign of campaigns) {
        if (!campaign) continue
        let type = campaignStatus(campaign)
        await Campaigns.updateOne(
            { _id: campaign._id },
            {
                $set: {
                    type,
                    launchDate: new Date(
                        campaign.startDate * 1000
                    ).toISOString(),
                },
            }
        )
        campaign.type = type
    }

    let myWallet = await Wallet.findOne({
        UserId,
    })

    if (!myWallet) return

    let MyLinksCampaign = await CampaignLink.find({
        $or: [
            { id_wallet: '0x' + myWallet.keystore.address },
            { id_wallet: myWallet?.tronAddress },
            { id_wallet: myWallet?.walletV2?.tronAddress },
            { id_wallet: '0x' + myWallet.walletV2?.keystore?.address },
        ],
    })

    const eventLint = MyLinksCampaign.reduce((acc, event) => {
        const campaign = campaigns.find(
            (campaign) => event.id_campaign === campaign.hash
        );

        if (campaign?.toObject()) {
            acc.push({ ...event.toObject(), campaign: campaign.toObject() });
        }

        return acc;
    }, []);

    for (const event of eventLint) {
        if (
            event.status === 'rejected' ||
            event.campaign?.funds[1] == '0' ||
            event.deleted === true ||
            event.status === 'indisponible'
        )
            continue

        if (event.typeSN == 5) {
            var linkedinProfile = await LinkedinProfile.findOne({
                userId: UserId,
                ...(event.linkedinId && { linkedinId: event.linkedinId }),
            }).lean()
            var linkedinInfo = await getLinkedinLinkInfoMedia(
                linkedinProfile?.accessToken,
                event.idPost,
                linkedinProfile
            )

            var media_url = linkedinInfo?.mediaUrl || ''
        }

        if (event.typeSN == '1') {
            var facebookProfile = await FbProfile.findOne(
                {
                    UserId: UserId,
                },
                { accessToken: 1 }
            ).lean()

            await updateFacebookPages(
                UserId,
                facebookProfile?.accessToken,
                false
            )
        }
        if (event.typeSN == '6') {
            var tiktokProfile = await TikTokProfile.findOne({
                userId: UserId,
            })
        }

        let oracle = findBountyOracle(event.typeSN)
        try {
            var socialOracle = await getPromApplyStats(
                oracle,
                event,
                UserId,
                linkedinProfile,
                tiktokProfile
            )
        } catch (e) {
            console.error(e)
            continue
        }

        if (socialOracle === 'Rate limit exceeded') continue
        socialOracle === 'No found' && (event.deleted = true)
        socialOracle === 'indisponible' && (event.status = 'indisponible')

        if (socialOracle && typeof socialOracle !== 'string') {
            event.shares = socialOracle?.shares || event.shares
            event.likes = socialOracle?.likes || event.likes
            event.views =
                socialOracle?.views === 'old'
                    ? event.views
                    : socialOracle?.views
            event.media_url = socialOracle?.media_url || media_url
            event.oracle = oracle
        }

        if (event.campaign.ratios.length && socialOracle) {
            event.totalToEarn =
                event.campaign.funds[1] !== '0'
                    ? getTotalToEarn(event, event.campaign.ratios)
                    : 0
        }

        if (event.campaign.bounties.length && socialOracle) {
            event.totalToEarn = getReward(event, event.campaign.bounties)
        }

        event.type = getButtonStatus(event)

        delete event.campaign
        delete event.payedAmount
        delete event._id
        delete event.status
        await this.UpdateStats(event, socialOracle) //saving & updating proms in campaign_link.
    }
}

exports.automaticRjectLink = async (_) => {
    var campaignList = await Campaigns.find({
        hash: { $exists: true },
        type: 'finished',
    })
    var links = await CampaignLink.find({
        type: 'waiting_for_validation',
    })

    links.forEach(async (link) => {
        const result = campaignList.find(
            (campaign) => link.id_campaign === campaign.hash
        )
        result &&
            (await CampaignLink.updateOne(
                { id_prom: link.id_prom },
                { $set: { type: 'rejected' } }
            ))
    })
}

exports.UpdateStats = async (obj, socialOracle) => {
    if (!socialOracle) {
        ['views', 'likes', 'shares', 'totalToEarn'].forEach(field => delete obj[field]);
    }

        if(!(await CampaignLink.exists({ 'applyerSignature.messageHash': obj.applyerSignature.messageHash }))){
            await CampaignLink.create(obj)
            return;
        } else {
            await CampaignLink.updateOne(
                {
                    'applyerSignature.messageHash':
                        obj.applyerSignature.messageHash ,
                },
                { $set: obj }
            )
        }

}

exports.BalanceUsersStats = async (condition) => {
    let today = new Date().toLocaleDateString('en-US')
    let [currentDate, result] = [Math.round(new Date().getTime() / 1000), {}]
    ;[result.Date, result.convertDate] = [currentDate, today]

    var query = condition + '.convertDate'

    var users_ = await User.find(
        {
            $and: [
                { userSatt: true },
                { hasWallet: true },
                { [query]: { $nin: [today] } },
            ],
        },
        { daily: 1, weekly: 1, monthly: 1 }
    )

    let [counter, usersCount] = [0, users_.length]
    while (counter < usersCount) {
        let balance

        var user = users_[counter]
        let id = user._id //storing user id in a variable

        if (!user[condition]) {
            user[condition] = []
        } //adding time frame field in users depending on condition if it doesn't exist.

        try {
            let req = {
                user: users_[counter],
                prices: await getPrices(),
                body: { version: 'v1' },
            }
            let res = {}
            balance = await getBalanceByUid(req, res)
        } catch (err) {
            console.error(err)
            continue
        }
        // !balance['Total_balance'] && counter++
        result.Balance = balance?.Total_balance

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

exports.extractFollowerCount = str => {
    const regex = /(\d+(\.\d+)?)([MK]?)\s*$/;

    const match = str.match(regex);
  
    if (match) {
      let followerCount = parseFloat(match[1]);
  
      if (match[3] === 'K') {
        followerCount *= 1000;
      } else if (match[3] === 'M') {
        followerCount *= 1000000;
      }
  
      return parseInt(followerCount, 10);
    }
  
    return 0;
  }
