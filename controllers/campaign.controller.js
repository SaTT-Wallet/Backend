var requirement = require('../helpers/utils')
var readHTMLFileCampaign = requirement.readHTMLFileCampaign

const multer = require('multer')
const Big = require('big.js')
const etherInWei = new Big(1000000000000000000)
const Grid = require('gridfs-stream')
const GridFsStorage = require('multer-gridfs-storage')
var mongoose = require('mongoose')
const cron = require('node-cron')

const {
    Campaigns,
    CampaignLink,
    LinkedinProfile,
    Wallet,
    Event,
    Request,
    User,
} = require('../model/index')

const { responseHandler } = require('../helpers/response-handler')
const { notificationManager } = require('../manager/accounts')
const { configureTranslation } = require('../helpers/utils')
const { getPrices } = require('../web3/wallets')
const { fundCampaign, getTransactionAmount } = require('../web3/campaigns')

const { v4: uuidv4 } = require('uuid')
const { mongoConnection } = require('../conf/config')

const storage = new GridFsStorage({
    url: mongoConnection().mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = uuidv4()
            const fileInfo = {
                filename: filename,
                bucketName: 'campaign_kit',
            }
            resolve(fileInfo)
        })
    },
})

module.exports.upload = multer({ storage }).array('file')
const {
    unlock,
    createPerformanceCampaign,
    getAccount,
    lock,
    unlockBsc,
    bep20Allow,
    lockBSC,
    bep20Approve,
    lockERC20,
    erc20Allow,
    erc20Approve,
    createBountiesCampaign,
    sortOutPublic,
    getUserIdByWallet,
    getLinkedinLinkInfo,
    applyCampaign,
    getRemainingFunds,
    validateProm,
    filterLinks,
    influencersLinks,
    getGains,
    updateBounty,
    updatePromStats,
} = require('../web3/campaigns')

const {
    getCampaignContractByHashCampaign,
    getContractByToken,
    getContractCampaigns,
    getPromContract,
} = require('../blockchainConnexion')

cron.schedule(process.env.CRON_UPDATE_STAT, () => updateStat())

let calcSNStat = (objNw, link) => {
    objNw.total++
    if (link.status !== 'rejected') {
        if (link.views) objNw.views += Number(link.views)
        if (link.likes) objNw.likes += Number(link.likes)
        if (link.shares) objNw.shares += Number(link.shares)
        if (link.status === true) objNw.accepted++
        if (link.status === false) objNw.pending++
    } else objNw.rejected++
    return objNw
}

let initStat = () => {
    return {
        total: 0,
        views: 0,
        likes: 0,
        shares: 0,
        accepted: 0,
        pending: 0,
        rejected: 0,
    }
}

var BN = require('bn.js')
const {
    getInstagramUserName,
    findBountyOracle,
    answerAbos,
    getPromApplyStats,
    getReachLimit,
    getTotalToEarn,
    getReward,
    getButtonStatus,
    answerBounty,
    answerOne,
    limitStats,
    answerCall,
} = require('../manager/oracles')
const { updateStat } = require('../helpers/common')

const conn = mongoose.createConnection(mongoConnection().mongoURI)
let gfsKit

conn.once('open', () => {
    gfsKit = Grid(conn.db, mongoose.mongo)
    gfsKit.collection('campaign_kit')
})

module.exports.launchCampaign = async (req, res) => {
    var dataUrl = req.body.dataUrl
    var startDate = req.body.startDate
    var endDate = req.body.endDate
    var tokenAddress = req.body.tokenAddress
    var amount = req.body.amount
    var ratios = req.body.ratios
    var contract = req.body.contract
    let _id = req.body.idCampaign
    try {
        var cred = await unlock(req, res)
        if (!cred) return
        var ret = await createPerformanceCampaign(
            dataUrl,
            startDate,
            endDate,
            ratios,
            tokenAddress,
            amount,
            cred,
            res
        )
        if (!ret) return
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (ret?.hash) {
            lock(cred)
            var campaign = {
                hash: ret.hash,
                transactionHash: ret.transactionHash,
                startDate,
                endDate,
                coverSrc: null,
                dataUrl,
                funds: [contract, amount],
                contract: contract.toLowerCase(),
                walletId: cred.address,
                type: 'inProgress',
            }
            await Campaigns.updateOne({ _id }, { $set: campaign })
            let event = {
                id: ret.hash,
                type: 'modified',
                date: Math.floor(Date.now() / 1000),
                txhash: ret.transactionHash,
                contract: contract.toLowerCase(),
            }
            await Event.create(event)
        }
    }
}

module.exports.launchBounty = async (req, res) => {
    var dataUrl = req.body.dataUrl
    var startDate = req.body.startDate
    var endDate = req.body.endDate
    var tokenAddress = req.body.tokenAddress
    var amount = req.body.amount
    let [_id, contract] = [req.body.idCampaign, req.body.contract.toLowerCase()]
    var bounties = req.body.bounties
    try {
        var cred = await unlock(req, res)
        if (!cred) return
        var ret = await createBountiesCampaign(
            dataUrl,
            startDate,
            endDate,
            bounties,
            tokenAddress,
            amount,
            cred,
            res
        )
        if (!ret) return
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        cred && lock(cred)
        if (ret && ret.hash) {
            let campaign = {
                hash: ret.hash,
                transactionHash: ret.transactionHash,
                startDate,
                endDate,
                dataUrl,
                coverSrc: null,
                funds: [contract, amount],
                contract: contract,
                type: 'inProgress',
                walletId: cred.address,
            }
            await Campaigns.updateOne(
                { _id },
                { $set: campaign },
                { $unset: { coverSrc: '', ratios: '' } }
            )
            let event = {
                id: ret.hash,
                type: 'modified',
                date: Math.floor(Date.now() / 1000),
                txhash: ret.transactionHash,
                contract: contract.toLowerCase(),
            }
            await Event.create(event)
        }
    }
}

exports.campaigns = async (req, res) => {
    try {
        let strangerDraft = []
        if (req.query.idWallet) {
            let userId = await getUserIdByWallet(
                req.query.idWallet.substring(2)
            )
            var idNode = '0' + userId
            strangerDraft = await Campaigns.distinct('_id', {
                idNode: { $ne: idNode },
                hash: { $exists: false },
            })
        }
        let limit = +req.query.limit || 10
        let page = +req.query.page || 1
        let skip = limit * (page - 1)
        let id_wallet = req.query.idWallet
        let query = sortOutPublic(req, idNode, strangerDraft)

        let tri = [['draft', 'apply', 'inProgress', 'finished'], '$type']
        let campaigns = await Campaigns.aggregate([
            {
                $match: query,
            },
            {
                $addFields: {
                    sortPriority: { $eq: ['$idNode', idNode] },
                    sort: {
                        $indexOfArray: tri,
                    },
                },
            },
            {
                $sort: {
                    sort: 1,
                    sortPriority: -1,
                    _id: 1,
                },
            },
            {
                $project: {
                    countries: 0,
                    description: 0,
                    resume: 0,
                    coverSrc: 0,
                },
            },
        ])
            .skip(skip)
            .limit(limit)

        if (req.query.idWallet) {
            for (var i = 0; i < campaigns.length; i++) {
                proms = await CampaignLink.find({
                    id_campaign: campaigns[i].hash,
                    id_wallet,
                })
                if (proms.length) campaigns[i].proms = proms
            }
        }

        return responseHandler.makeResponseData(res, 200, 'success', {
            data: campaigns,
        })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.campaignDetails = async (req, res) => {
    try {
        var _id = req.params.id

        var campaign = await Campaigns.findOne({ _id })

        if (campaign) {
            campaign.remaining = campaign.funds[1]
            return responseHandler.makeResponseData(
                res,
                200,
                'success',
                campaign
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Campaign not found'
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

exports.campaignPromp = async (req, res) => {
    var _id = req.params.id
    try {
        var _id = req.params.id
        const campaign = await Campaigns.findOne(
            { _id },
            {
                logo: 0,
                resume: 0,
                description: 0,
                tags: 0,
                cover: 0,
            }
        )
        let ctr = await getCampaignContractByHashCampaign(campaign.hash)

        if (!ctr) {
            return responseHandler.makeResponseData(res, 200, 'success', {})
        } else {
            const funds = campaign.funds ? campaign.funds[1] : campaign.cost

            const ratio = campaign.ratios
            const bounties = campaign.bounties
            let allLinks
            if (req.query.influencer)
                allLinks = await CampaignLink.find({
                    $and: [
                        {
                            id_campaign: campaign.hash,
                            id_wallet: req.query.influencer,
                        },
                    ],
                })
            if (!req.query.influencer)
                allLinks = await CampaignLink.find({
                    id_campaign: campaign.hash,
                })

            const allProms = await influencersLinks(allLinks)

            for (let i = 0; i < allProms.length; i++) {
                allProms[i].isAccepted = allProms[i].status
                allProms[i].influencer = allProms[i].id_wallet
                if (allProms[i].status == 'rejected') continue

                allProms[i].id = allProms[i].id_prom
                allProms[i].numberOfLikes = allProms[i].likes || '0'
                allProms[i].numberOfViews = allProms[i].views || '0'
                allProms[i].numberOfShares = !allProms[i].shares
                    ? '0'
                    : String(allProms[i].shares)
                allProms[i].payedAmount = allProms[i].payedAmount || '0'
                allProms[i].abosNumber = allProms[i].abosNumber || 0
                let result = allProms[i]

                let promDone = funds == '0' && result.fund == '0' ? true : false
                if (ratio.length && allProms[i].isAccepted && !promDone) {
                    delete allProms[i].isPayed
                    let reachLimit = getReachLimit(ratio, result.oracle)
                    if (reachLimit)
                        result = limitStats(
                            '',
                            result,
                            '',
                            result.abosNumber,
                            reachLimit
                        )
                    ratio.forEach((num) => {
                        if (
                            num.oracle === result.oracle ||
                            num.typeSN === result.typeSN
                        ) {
                            let view = result.views
                                ? new Big(num['view']).times(result.views)
                                : '0'
                            let like = result.likes
                                ? new Big(num['like']).times(result.likes)
                                : '0'
                            let share = result.shares
                                ? new Big(num['share']).times(
                                      result.shares.toString()
                                  )
                                : '0'
                            let totalToEarn = new Big(view)
                                .plus(new Big(like))
                                .plus(new Big(share))
                                .toFixed()
                            allProms[i].totalToEarn = new Big(totalToEarn).gt(
                                new Big(result.payedAmount)
                            )
                                ? totalToEarn
                                : result.payedAmount
                        }
                    })
                }

                if (bounties.length && allProms[i].isAccepted && !promDone) {
                    bounties.forEach((bounty) => {
                        if (
                            bounty.oracle === allProms[i].oracle ||
                            bounty.oracle == findBountyOracle(result.typeSN)
                        ) {
                            bounty = bounty.toObject()

                            bounty.categories.forEach((category) => {
                                if (
                                    +category.minFollowers <=
                                        +result.abosNumber &&
                                    +result.abosNumber <= +category.maxFollowers
                                ) {
                                    let totalToEarn = category.reward
                                    allProms[i].totalToEarn = new Big(
                                        totalToEarn
                                    ).gt(new Big(result.payedAmount))
                                        ? totalToEarn
                                        : result.payedAmount
                                } else if (
                                    +result.abosNumber > +category.maxFollowers
                                ) {
                                    let totalToEarn = category.reward
                                    allProms[i].totalToEarn = new Big(
                                        totalToEarn
                                    ).gt(new Big(result.payedAmount))
                                        ? totalToEarn
                                        : result.payedAmount
                                }
                            })
                        }
                    })
                }
            }
            return responseHandler.makeResponseData(res, 200, 'success', {
                allProms,
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

exports.apply = async (req, res) => {
    var idCampaign = req.body.idCampaign
    var typeSN = req.body.typeSN
    var idPost = req.body.idPost
    var idUser = req.body.idUser
    let title = req.body.title
    var id = req.user._id
    let [prom, date, hash] = [{}, Math.floor(Date.now() / 1000), req.body.hash]
    let campaignDetails = await Campaigns.findOne({ hash })
    try {
        let promExist = await CampaignLink.findOne({
            id_campaign: hash,
            idPost,
        })

        if (promExist) {
            return responseHandler.makeResponseError(
                res,
                401,
                'Link already sent'
            )
        }

        var cred = await unlock(req, res)
        if (!cred) return
        if (typeSN == 5) {
            var linkedinProfile = await LinkedinProfile.findOne(
                { userId: id },
                { accessToken: 1, _id: 0 }
            )
            var linkedinInfo = await getLinkedinLinkInfo(
                linkedinProfile.accessToken,
                idPost.toString()
            )
            var media_url = linkedinInfo.mediaUrl
            idUser = linkedinInfo.idUser
            idPost = linkedinInfo.idPost.replace(/\D/g, '')
        }
        var ret = await applyCampaign(
            hash,
            typeSN,
            idPost,
            idUser,
            cred,
            campaignDetails.token
        )
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        cred && lock(cred)
        if (ret && ret.transactionHash) {
            if (typeSN == 3)
                prom.instagramUserName = await getInstagramUserName(idPost)
            await notificationManager(id, 'apply_campaign', {
                cmp_name: title,
                cmp_hash: idCampaign,
                hash,
            })
            prom.id_prom = ret.idProm
            prom.typeSN = typeSN.toString()
            prom.idUser = idUser
            prom.status = false
            if (media_url) prom.media_url = media_url
            if (prom.typeSN == 5) {
                prom.typeURL = linkedinInfo.idPost.split(':')[2]
            }
            prom.type = 'waiting_for_validation'
            prom.id_wallet = cred.address.toLowerCase()
            prom.idPost = idPost
            prom.id_campaign = hash
            prom.isPayed = false
            prom.appliedDate = date
            prom.oracle = findBountyOracle(prom.typeSN)
            var insert = await CampaignLink.create(prom)
            prom.abosNumber = await answerAbos(
                prom.typeSN,
                prom.idPost,
                idUser,
                linkedinProfile
            )
            let userWallet = await Wallet.findOne(
                {
                    'keystore.address': prom.id_wallet
                        .toLowerCase()
                        .substring(2),
                },
                { UserId: 1, _id: 0 }
            )
            let userId = prom.oracle === 'instagram' ? userWallet.UserId : null
            let socialOracle = await getPromApplyStats(
                prom.oracle,
                prom,
                userId,
                linkedinProfile
            )
            if (socialOracle.views === 'old') socialOracle.views = '0'
            prom.views = socialOracle.views
            ;(prom.likes = socialOracle.likes),
                (prom.shares = socialOracle.shares || '0')
            await CampaignLink.updateOne({ _id: insert._id }, { $set: prom })
            let event = {
                id: hash,
                prom: ret.idProm,
                type: 'applied',
                date: date,
                txhash: ret.transactionHash,
                contract: campaignDetails.contract.toLowerCase(),
                owner: campaignDetails.contract.toLowerCase(),
            }

            await Event.create(event)
        }
    }
}

exports.linkNotifications = async (req, res) => {
    var id = req.user._id

    const lang = req.query.lang || 'en'
    configureTranslation(lang)

    try {
        let _id = req.body.idCampaign
        let link = req.body.link
        let idProm = req.body.idProm
        let element = await Campaigns.findOne(
            { _id },
            {
                logo: 0,
                resume: 0,
                description: 0,
                tags: 0,
                cover: 0,
            }
        )
        let owner = Number(element.idNode.substring(1))
        let hash = element.hash
        await notificationManager(id, 'cmp_candidate_insert_link', {
            cmp_name: element.title,
            cmp_hash: hash,
            linkHash: idProm,
        })

        User.findOne({ _id: owner }, (err, result) => {
            readHTMLFileCampaign(
                __dirname +
                    '/../public/emailtemplate/Email_Template_link_added.html',
                'linkNotifications',
                element.title,
                result.email,
                null,
                link
            )

            return responseHandler.makeResponseData(
                res,
                200,
                'Email was sent to ' + result.email
            )
        })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.validateCampaign = async (req, res) => {
    let _id = req.body.idCampaign
    let linkProm = req.body.link
    let idApply = req.body.idProm
    let idUser = '0' + req.user._id

    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return responseHandler.makeResponseError(
            res,
            400,
            'Please enter a valid id!'
        )
    }
    const campaign = await Campaigns.findOne(
        { _id },
        {
            logo: 0,
            resume: 0,
            description: 0,
            tags: 0,
            cover: 0,
        }
    )
    try {
        if (idUser === campaign?.idNode) {
            const lang = 'en'
            configureTranslation(lang)

            var cred = await unlock(req, res)

            var ret = await validateProm(idApply, cred)

            return responseHandler.makeResponseData(res, 200, 'success', ret)
        } else {
            return responseHandler.makeResponseError(res, 401, 'unothorized')
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        if (cred) {
            lock(cred)
        }
        if (ret && ret.transactionHash) {
            let link = await CampaignLink.findOne({ id_prom: idApply })
            let userWallet = await Wallet.findOne(
                {
                    'keystore.address': link.id_wallet
                        .toLowerCase()
                        .substring(2),
                },
                { UserId: 1, _id: 0 }
            )
            let user = await User.findOne({ _id: userWallet.UserId })
            const id = user._id
            const email = user.email
            let linkedinProfile =
                link.oracle == 'linkedin' &&
                (await LinkedinProfile.findOne({ userId: id }))
            let userId = link.oracle === 'instagram' ? id : null

            let socialOracle = await getPromApplyStats(
                link.oracle,
                link,
                userId,
                linkedinProfile
            )
            socialOracle.abosNumber =
                campaign.bounties.length ||
                (campaign.ratios && getReachLimit(campaign.ratios, link.oracle))
                    ? await answerAbos(
                          link.typeSN,
                          link.idPost,
                          link.idUser,
                          linkedinProfile
                      )
                    : 0
            ;(socialOracle.status = true), (link.status = true)
            if (socialOracle.views === 'old')
                socialOracle.views = link.views || '0'
            link.likes = socialOracle.likes
            link.views = socialOracle.views
            link.shares = socialOracle.shares
            link.campaign = campaign
            link.totalToEarn = campaign.ratios.length
                ? getTotalToEarn(link, campaign.ratios)
                : getReward(link, campaign.bounties)
            socialOracle.totalToEarn = link.totalToEarn
            socialOracle.type = getButtonStatus(link)
            await CampaignLink.updateOne(
                { id_prom: idApply },
                { $set: socialOracle }
            )

            await notificationManager(id, 'cmp_candidate_accept_link', {
                cmp_name: campaign.title,
                action: 'link_accepted',
                cmp_link: linkProm,
                cmp_hash: _id,
                hash: ret.transactionHash,
                promHash: idApply,
            })
            readHTMLFileCampaign(
                __dirname +
                    '/../public/emailtemplate/email_validated_link.html',
                'campaignValidation',
                campaign.title,
                email,
                _id
            )
        }
    }
}
exports.gains = async (req, res) => {
    var idProm = req.body.idProm
    var idCampaign = req.body.idCampaign
    var hash = req.body.hash
    var stats
    var requests = false
    var abi = [
        { indexed: true, name: 'idRequest', type: 'bytes32' },
        { indexed: false, name: 'typeSN', type: 'uint8' },
        { indexed: false, name: 'idPost', type: 'string' },
        { indexed: false, name: 'idUser', type: 'string' },
    ]
    try {
        var credentials = await unlock(req, res)
        var ctr = await getPromContract(idProm, credentials)

        var gasPrice = await ctr.getGasPrice()
        let prom = await ctr.methods.proms(idProm).call()
        var linkedinData =
            prom.typeSN == '5' &&
            (await LinkedinProfile.findOne(
                { userId: req.user._id },
                { accessToken: 1, _id: 0 }
            ))
        var link = await CampaignLink.findOne({ id_prom: idProm })
        if (req.body.bounty) {
            if (prom.funds.amount > 0 && prom.isPayed) {
                var ret = await getGains(idProm, credentials)
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    ret
                )
            }
            let campaign = await Campaigns.findOne(
                { hash: hash },
                { bounties: 1 }
            )
            let bountie = campaign.bounties.find(
                (b) => b.oracle == findBountyOracle(prom.typeSN)
            )
            let maxBountieFollowers =
                bountie.categories[bountie.categories.length - 1].maxFollowers
            var evts = await updateBounty(idProm, credentials)
            stats = await answerAbos(
                prom.typeSN,
                prom.idPost,
                prom.idUser,
                linkedinData
            )
            if (+stats >= +maxBountieFollowers) {
                stats = (+maxBountieFollowers - 1).toString()
            }

            await Request.updateOne(
                { id: idProm },
                {
                    $set: {
                        nbAbos: stats,
                        isBounty: true,
                        new: false,
                        date: Date.now(),
                        typeSN: prom.typeSN,
                        idPost: prom.idPost,
                        idUser: prom.idUser,
                    },
                },
                { upsert: true }
            )
            try {
                await answerBounty({
                    ctr,
                    gasPrice: gasPrice,
                    from: process.env.CAMPAIGN_OWNER,
                    campaignContract: ctr.options.address,
                    idProm: idProm,
                    nbAbos: stats,
                })
            } finally {
                var ret = await getGains(idProm, credentials)
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    ret
                )
            }
        }

        var prevstat = await Request.find({
            new: false,
            typeSN: prom.typeSN,
            idPost: prom.idPost,
            idUser: prom.idUser,
        }).sort({ date: -1 })

        stats = await answerOne(
            prom.typeSN,
            prom.idPost,
            prom.idUser,
            link.typeURL,
            linkedinData
        )
        var ratios = await ctr.methods.getRatios(prom.idCampaign).call()
        var abos = await answerAbos(
            prom.typeSN,
            prom.idPost,
            prom.idUser,
            linkedinData
        )
        if (stats) stats = limitStats(prom.typeSN, stats, ratios, abos, '')
        stats.views = stats.views || 0
        if (stats.views === 'old') stats.views = link.views
        stats.shares = stats.shares || 0
        stats.likes = stats.likes || 0

        requests = await Request.find({
            new: true,
            isBounty: false,
            typeSN: prom.typeSN,
            idPost: prom.idPost,
            idUser: prom.idUser,
        })

        if (!requests.length) {
            if (
                !prevstat.length ||
                stats.likes != prevstat[0].likes ||
                stats.shares != prevstat[0].shares ||
                stats.views != prevstat[0].views
            ) {
                var evts = await updatePromStats(idProm, credentials)
                var evt = evts.events[0]
                var idRequest = evt.raw.topics[1]
                requests = [{ id: idRequest }]
            }
        }
        if (requests && requests.length) {
            await Request.updateOne(
                { id: requests[0].id },
                {
                    $set: {
                        id: requests[0].id,
                        likes: stats.likes,
                        shares: stats.shares,
                        views: stats.views,
                        new: false,
                        date: Date.now(),
                        typeSN: prom.typeSN,
                        idPost: prom.idPost,
                        idUser: prom.idUser,
                    },
                },
                { upsert: true }
            )

            await answerCall({
                credentials,
                gasPrice: gasPrice,
                from: process.env.CAMPAIGN_OWNER,
                campaignContract: ctr.options.address,
                idRequest: requests[0].id,
                likes: stats.likes,
                shares: stats.shares,
                views: stats.views,
            })
        }

        var ret = await getGains(idProm, credentials)

        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        // im hereeeeeee
        if (credentials) lock(credentials)
        if (ret?.transactionHash) {
            let campaign = await Campaigns.findOne(
                { hash: hash },
                { token: 1, _id: 0 }
            )

            let campaignType = {}
            let network =
                campaign.token.type == 'erc20'
                    ? credentials.Web3ETH.eth
                    : credentials.Web3BEP20.eth

            let amount = await getTransactionAmount(
                ret.transactionHash,
                network
            )
            let updatedFUnds = {}
            await CampaignLink.findOne(
                { id_prom: idProm },
                async (err, result) => {
                    if (req.body.bounty) updatedFUnds.isPayed = true
                    updatedFUnds.payedAmount = !result.payedAmount
                        ? amount
                        : new Big(result.payedAmount)
                              .plus(new Big(amount))
                              .toFixed()
                    updatedFUnds.type = 'already_recovered'
                    await CampaignLink.updateOne(
                        { id_prom: idProm },
                        { $set: updatedFUnds }
                    )
                }
            )

            let contract = await getCampaignContractByHashCampaign(hash)

            var result = await contract.methods.campaigns(hash).call()
            campaignType.funds = result.funds
            if (result.funds[1] === '0') campaignType.type = 'finished'
            await Campaigns.updateOne({ hash: hash }, { $set: campaignType })
        }
    }
}

exports.saveCampaign = async (req, res) => {
    try {
        let campaign = req.body
        campaign.idNode = '0' + req.user._id
        campaign.createdAt = Date.now()
        campaign.updatedAt = Date.now()
        campaign.type = 'draft'
        let draft = await Campaigns.create(campaign)
        return responseHandler.makeResponseData(res, 200, 'success', draft)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.kits = async (req, res) => {
    try {
        const idCampaign = req.params.idCampaign
        gfsKit.files
            .find({ 'campaign.$id': idCampaign })
            .toArray((err, files) => {
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    files
                )
            })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.addKits = async (req, res) => {
    try {
        let files = req.files
        let links =
            typeof req.body.link === 'string'
                ? Array(req.body.link)
                : req.body.link
        let idCampaign = req.body.campaign

        if (files) {
            files.forEach((file) => {
                gfsKit.files.updateOne(
                    { _id: file.id },
                    {
                        $set: {
                            campaign: {
                                $ref: 'campaign',
                                $id: idCampaign,
                                $db: 'atayen',
                            },
                        },
                    }
                )
            })
        }
        if (links) {
            links.forEach((link) => {
                gfsKit.files.insertOne({
                    campaign: {
                        $ref: 'campaign',
                        $id: idCampaign,
                        $db: 'atayen',
                    },
                    link: link,
                })
            })
        }
        return responseHandler.makeResponseData(res, 200, 'Kit uploaded', false)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.update = async (req, res) => {
    try {
        let campaign = req.body
        campaign.updatedAt = Date.now()
        Campaigns.findOneAndUpdate(
            { _id: req.params.idCampaign },
            { $set: campaign },
            { new: true },
            (err, updatedCampaign) => {
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'updated',
                    updatedCampaign
                )
            }
        )
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.linkStats = async (req, res) => {
    try {
        let totalToEarn
        const idProm = req.params.idProm

        const info = await CampaignLink.findOne({ id_prom: idProm })
        if (info) {
            const payedAmount = info.payedAmount || '0'
            const campaign = (
                await Campaigns.findOne(
                    { hash: info.id_campaign },
                    {
                        fields: {
                            logo: 0,
                            resume: 0,
                            description: 0,
                            tags: 0,
                            cover: 0,
                        },
                    }
                )
            )?.toObject()
            const ratio = campaign.ratios
            const bounties = campaign.bounties
            let abosNumber = info.abosNumber || 0
            info.currency = campaign.token.name
            if (ratio.length) {
                let socialStats = {
                    likes: info.likes,
                    shares: info.shares,
                    views: info.views,
                }
                let reachLimit = getReachLimit(ratio, info.oracle)
                if (reachLimit)
                    socialStats = limitStats(
                        '',
                        socialStats,
                        '',
                        abosNumber,
                        reachLimit
                    )
                ratio.forEach((elem) => {
                    if (elem.oracle === info.oracle) {
                        let view = new Big(elem['view']).times(
                            socialStats.views || '0'
                        )
                        let like = new Big(elem['like']).times(
                            socialStats.likes || '0'
                        )
                        let share = new Big(elem['share']).times(
                            socialStats.shares || '0'
                        )
                        totalToEarn = view.plus(like).plus(share).toFixed()
                    }
                })
                info.totalToEarn = new Big(totalToEarn).gte(
                    new Big(payedAmount)
                )
                    ? new Big(totalToEarn).minus(new Big(payedAmount))
                    : totalToEarn
            }

            if (bounties.length) {
                bounties.forEach((bounty) => {
                    if (bounty.oracle === info.oracle) {
                        bounty.categories.forEach((category) => {
                            if (
                                +category.minFollowers <= +abosNumber &&
                                +abosNumber <= +category.maxFollowers
                            ) {
                                info.totalToEarn = category.reward
                            } else if (+abosNumber > +category.maxFollowers) {
                                info.totalToEarn = category.reward
                            }
                        })
                    }
                })
            }
            if (new Big(info.totalToEarn).gt(new Big(campaign.funds[1])))
                info.totalToEarn = campaign.funds[1]
            return responseHandler.makeResponseData(res, 200, 'success', info)
        } else {
            return responseHandler.makeResponseError(res, 404, 'link not found')
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.increaseBudget = async (req, res) => {
    var pass = req.body.pass
    var hash = req.body.hash
    var token = req.body.tokenAddress
    var amount = req.body.amount
    try {
        var cred = await unlock(req, res)

        var ret = await fundCampaign(hash, token, amount, cred)

        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        cred && lock(cred)
        if (ret?.transactionHash) {
            const ctr = await getCampaignContractByHashCampaign(hash)
            let fundsInfo = await ctr.methods.campaigns(idCampaign).call()
            await Campaigns.findOne({ hash: hash }, async (err, result) => {
                let budget = new Big(result.cost)
                    .plus(new Big(amount))
                    .toFixed()
                await Campaigns.updateOne(
                    { hash: hash },
                    { $set: { cost: budget, funds: fundsInfo.funds } }
                )
            })
        }
    }
}

exports.getFunds = async (req, res) => {
    var hash = req.body.hash
    try {
        var cred = await unlock(req, res)
        let campaignDetails = await Campaigns.findOne({ hash })
        var ret = await getRemainingFunds(campaignDetails.token, hash, cred)

        return responseHandler.makeResponseData(res, 200, 'Token added', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    } finally {
        cred && lock(cred)
        if (ret && ret.transactionHash) {
            await Campaigns.updateOne(
                { _id: campaignDetails._id },
                {
                    $set: {
                        funds: ['', '0'],
                    },
                }
            )
        }
    }
}

exports.bep20Approval = async (req, res) => {
    try {
        let tokenAddress = req.body.tokenAddress
        let campaignAddress = req.body.campaignAddress
        let account = await getAccount(req, res)
        let allowance = await bep20Approve(
            tokenAddress,
            account.address,
            campaignAddress
        )
        return responseHandler.makeResponseData(res, 200, 'success', {
            token: tokenAddress,
            allowance: allowance,
            spender: campaignAddress,
        })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.erc20Approval = async (req, res) => {
    try {
        let tokenAddress = req.body.tokenAddress
        let campaignAddress = req.body.campaignAddress
        let account = await getAccount(req, res)
        let allowance = await erc20Approve(
            tokenAddress,
            account.address,
            campaignAddress
        )

        return responseHandler.makeResponseData(res, 200, 'success', {
            token: tokenAddress,
            allowance: allowance,
            spender: campaignAddress,
        })
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.bep20Allow = async (req, res) => {
    try {
        let campaignAddress = req.body.campaignAddress
        let amount = req.body.amount
        let bep20TOken = req.body.tokenAddress
        var cred = await unlockBsc(req, res)
        if (!cred) return
        let ret = await bep20Allow(
            bep20TOken,
            cred,
            campaignAddress,
            amount,
            res
        )
        if (!ret) return
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    } finally {
        if (cred) lockBSC(cred)
    }
}

exports.erc20Allow = async (req, res) => {
    try {
        let campaignAddress = req.body.campaignAddress
        let amount = req.body.amount
        let tokenAddress = req.body.tokenAddress
        var cred = await unlock(req, res)
        if (!cred) return

        let ret = await erc20Allow(
            tokenAddress,
            cred,
            campaignAddress,
            amount,
            res
        )
        if (!ret) return
        return responseHandler.makeResponseData(res, 200, 'success', ret)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    } finally {
        if (cred) lockERC20(cred)
    }
}

exports.getLinks = async (req, res) => {
    try {
        const { id_wallet } = req.params
        const limit = +req.query.limit || 50
        const page = +req.query.page || 1
        const skip = limit * (page - 1)
        let arrayOfLinks = []
        let allProms = []

        let query = filterLinks(req, id_wallet)
        var count = await CampaignLink.find(
            { id_wallet },
            { type: { $exists: 0 } }
        ).count()

        let tri =
            req.query.state === 'owner'
                ? [
                      [
                          'waiting_for_validation',
                          'harvest',
                          'already_recovered',
                          'not_enough_budget',
                          'no_gains',
                          'indisponible',
                          'rejected',
                          'none',
                      ],
                      '$type',
                  ]
                : [
                      [
                          'harvest',
                          'already_recovered',
                          'waiting_for_validation',
                          'not_enough_budget',
                          'no_gains',
                          'indisponible',
                          'rejected',
                          'none',
                      ],
                      '$type',
                  ]
        let userLinks = await CampaignLink.aggregate([
            {
                $match: query,
            },
            {
                $addFields: {
                    sort: {
                        $indexOfArray: tri,
                    },
                },
            },
            {
                $sort: {
                    sort: 1,
                    appliedDate: -1,
                    _id: 1,
                },
            },
        ])
            .skip(skip)
            .limit(limit)

        for (var i = 0; i < userLinks.length; i++) {
            var result = userLinks[i]
            let campaign = await Campaigns.findOne(
                { hash: result.id_campaign },
                {
                    fields: {
                        logo: 0,
                        resume: 0,
                        description: 0,
                        tags: 0,
                        cover: 0,
                    },
                }
            )

            if (campaign) {
                let cmp = {}
                const funds = campaign.funds ? campaign.funds[1] : campaign.cost
                ;(cmp._id = campaign._id),
                    (cmp.currency = campaign.token.name),
                    (cmp.title = campaign.title),
                    (cmp.remaining = funds),
                    (cmp.ratio = campaign.ratios),
                    (cmp.bounties = campaign.bounties)
                result.campaign = cmp
                arrayOfLinks.push(result)
            }
        }
        allProms =
            req.query.campaign && req.query.state
                ? await influencersLinks(arrayOfLinks)
                : arrayOfLinks

        var Links = { Links: allProms, count }
        return responseHandler.makeResponseData(res, 200, 'success', Links)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.campaignStatistics = async (req, res) => {
    try {
        var hash = req.params.hash
        var arrayOfUser = []
        var arrayOfnbAbos = []
        var nbTotalUser = 0
        var totalAbos = 0
        let result = {
            facebook: initStat(),
            twitter: initStat(),
            instagram: initStat(),
            youtube: initStat(),
            linkedin: initStat(),
        }
        var links = await CampaignLink.find({ id_campaign: hash })

        for (i = 0; i < links.length; i++) {
            let link = links[i]
            let oracle = link.oracle
            result[oracle] = calcSNStat(result[oracle], link)
            if (arrayOfUser.indexOf(link.id_wallet) === -1) {
                nbTotalUser++
                arrayOfUser.push(link.id_wallet)
            }
            if (
                arrayOfnbAbos.indexOf(link.id_wallet + '|' + link.typeSN) === -1
            ) {
                if (link.abosNumber) totalAbos += +link.abosNumber
                arrayOfUser.push(link.id_wallet + '|' + link.typeSN)
            }
        }
        res.json({
            stat: result,
            creatorParticipate: nbTotalUser,
            reachTotal: totalAbos,
        })
    } catch (err) {
        res.end(
            JSON.stringify({ error: err.message ? err.message : err.error })
        )
    }
}

module.exports.campaignInvested = async (req, res) => {
    try {
        let prices = getPrices()
        let sattPrice$ = prices.SATT.price
        let totalInvested = '0'
        let userCampaigns = await Campaigns.find({
            idNode: '0' + req.user._id,
            hash: { $exists: true },
        })

        userCampaigns.forEach((elem) => {
            totalInvested = new Big(totalInvested).plus(new Big(elem.cost))
        })
        let totalInvestedUSD =
            sattPrice$ *
            parseFloat(new Big(totalInvested).div(etherInWei).toFixed(0))
        totalInvested = new Big(totalInvested).toFixed()

        res.json({ totalInvested, totalInvestedUSD })
    } catch (e) {}
}

exports.rejectLink = async (req, res) => {
    const lang = req.body.lang || 'en'
    const title = req.body.title || ''
    const idCampaign = req.body.idCampaign
    const idLink = req.params.idLink
    const email = req.body.email
    let link = req.body.link
    configureTranslation(lang)
    let reason = req.body.reason
    let idUser = '0' + req.user._id

    const campaign = await Campaigns.findOne(
        { _id: idCampaign },
        {
            fields: {
                logo: 0,
                resume: 0,
                description: 0,
                tags: 0,
                cover: 0,
            },
        }
    )

    try {
        if (idUser === campaign?.idNode) {
            //  let reason = []
            const rejectedLink = await CampaignLink.findOneAndUpdate(
                { id_prom: idLink },
                { $set: { status: 'rejected', type: 'rejected' } },
                { returnOriginal: false }
            )
            let id = req.user._id
            await notificationManager(id, 'cmp_candidate_reject_link', {
                cmp_name: title,
                action: 'link_rejected',
                cmp_link: link,
                cmp_hash: idCampaign,
                promHash: idLink,
            })

            readHTMLFileCampaign(
                __dirname + '/../public/emailtemplate/rejected_link.html',
                'rejectLink',
                title,
                email,
                idCampaign,
                reason
            )

            return responseHandler.makeResponseData(res, 200, 'success', {
                prom: rejectedLink.value,
            })
        } else {
            return responseHandler.makeResponseError(res, 401, 'unothorized')
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.updateStatistics = async (req, res) => {
    try {
        await updateStat()
        return responseHandler.makeResponseData(res, 200, 'success', false)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.coverByCampaign = async (req, res) => {
    try {
        let _id = req.params.id
        let campaign = await Campaigns.findOne({ _id })
        let image = Buffer.from(campaign.cover, 'base64')
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': image.length,
        })
        res.end(image)
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
