const { responseHandler } = require('../helpers/response-handler')
const makeResponseData = responseHandler.makeResponseData
const makeResponseError = responseHandler.makeResponseError
const {
    GoogleProfile,
    LinkedinProfile,
    TwitterProfile,
    FbPage,
    TikTokProfile,
    UserExternalWallet,
    CampaignLink,
    Campaigns,
} = require('../model/index')
var rp = require('axios')
const {  oauth } = require('../conf/config')
const { filterLinks } = require('../web3/campaigns')
const {
    verifyYoutube,
    verifyFacebook,
    verifyInsta,
    verifyTwitter,
    verifyLinkedin,
    verifytiktok,
    updateFacebookPages,
    verifyThread,
} = require('../manager/oracles')

exports.createUserFromExternalWallet = async (req, res) => {
    try {
        const userExist = await UserExternalWallet.findOne({
            walletId: req.body.wallet,
        })
        if (!userExist) {
            const workerId = process.pid
            const currentDate = new Date().getTime()
            const uniqueId = parseInt(workerId + currentDate)
            const user = new UserExternalWallet({
                UserId: uniqueId,
                walletId: req.body.wallet,
            })
            const savedUser = await user.save()
            return makeResponseData(
                res,
                200,
                'User created successfully',
                savedUser
            )
        } else
            return makeResponseData(
                res,
                200,
                'User signed In successfully',
                userExist
            )
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalSocialAccounts = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })

        let UserId = user.UserId
        let networks = {}
        let [channelsGoogle, channelsTwitter] = await Promise.all([
            GoogleProfile.find({ UserId }, { accessToken: 0, refreshToken: 0 }),
            TwitterProfile.find(
                { UserId },
                { _raw: 0, access_token_key: 0, access_token_secret: 0 }
            ),
        ])
        let channelsFacebook = await FbPage.find({ UserId }, { token: 0 })
        let channelsLinkedin = await LinkedinProfile.find({
            userId: UserId,
        })
        let channelsTiktok = await TikTokProfile.find(
            { userId: UserId },
            { accessToken: 0, refreshToken: 0 }
        )
        networks.google = channelsGoogle
        networks.twitter = channelsTwitter
        networks.facebook = channelsFacebook
        networks.linkedin = channelsLinkedin?.flatMap((item) =>
            item?.pages.map((elem) => {
                elem = elem.toJSON()
                elem.linkedinId = item.linkedinId
                return elem
            })
        )

        networks.tikTok = channelsTiktok || []
        if (
            !channelsGoogle?.length &&
            !channelsLinkedin?.length &&
            !channelsTwitter?.length &&
            !channelsFacebook?.length &&
            !channelsTiktok?.length
        ) {
            return makeResponseError(res, 204, 'No channel found')
        }
        return makeResponseData(res, 200, 'success', networks)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteTiktokChannel = async (req, res) => {
    try {
        let user = await UserExternalWallet.findOne({
            walletId: req.address,
        })

        let tiktokProfiles = await TikTokProfile.find({
            userId: user.UserId,
        })

        if (tiktokProfiles.length === 0)
            return makeResponseError(res, 204, 'No channel found')
        else {
            await TikTokProfile.deleteMany({ userId: user.UserId })
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteTiktokChannels = async (req, res) => {
    try {
        let user = await UserExternalWallet.findOne({
            walletId: req.address,
        })

        let tiktokProfiles = await TikTokProfile.find({
            userId: user.UserId,
        })

        if (tiktokProfiles.length === 0)
            return makeResponseError(res, 204, 'No channel found')
        else {
            await TikTokProfile.deleteMany({ userId: user.UserId })
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteGoogleChannel = async (req, res) => {
    try {
        const UserId = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        let _id = req.params.id
        let googleProfile = await GoogleProfile.findOne({ _id }).lean()
        if (googleProfile?.UserId !== UserId.UserId)
            return makeResponseError(res, 401, 'unauthorized')
        else {
            await GoogleProfile.deleteOne({ _id })
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteGoogleChannels = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        const result = await GoogleProfile.deleteMany({
            UserId: user.UserId,
        })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 204, 'No channel found')
        } else {
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        console.log({ err })
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteFacebookChannels = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        const result = await FbPage.deleteMany({ UserId: user.UserId })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 204, 'No channel found')
        } else {
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteFacebookChannel = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        let _id = req.params.id
        let facebookProfile = await FbPage.findOne({ _id })
        if (facebookProfile?.UserId !== user.UserId)
            return makeResponseError(res, 401, 'unauthorized')
        else {
            await FbPage.deleteOne({ _id })
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteLinkedinChannels = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        const result = await LinkedinProfile.deleteMany({
            userId: user.UserId,
        })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 204, 'No channel found')
        } else {
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteLinkedinChannel = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        let { organization, linkedinId } = req.params
        let linkedinProfile = await LinkedinProfile.findOne(
            { userId: user.UserId, linkedinId },
            { pages: 1 }
        ).lean()
        if (!linkedinProfile) return makeResponseError(res, 401, 'unauthorized')
        if (linkedinProfile.pages.length === 1) {
            await LinkedinProfile.deleteOne({
                userId: user.UserId,
                linkedinId,
            })
        } else {
            await LinkedinProfile.updateOne(
                { userId: user.UserId, linkedinId },
                { $pull: { pages: { organization } } }
            )
        }
        return makeResponseData(res, 200, 'deleted successfully')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteTwitterChannels = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        const result = await TwitterProfile.deleteMany({
            UserId: user.UserId,
        })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 204, 'No channel found')
        } else {
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteTwitterChannel = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        let _id = req.params.id
        let twitterProfile = await TwitterProfile.findOne({ _id })
        if (twitterProfile?.UserId !== user.UserId)
            return makeResponseError(res, 401, 'unauthorized')
        else {
            await TwitterProfile.deleteOne({ UserId: user.UserId })
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalGetLinks = async (req, res) => {
    try {
        const accountData = req.body.wallet_id
        const limit = +req.query.limit || 50
        const page = +req.query.page || 1
        const skip = limit * (page - 1)
        let arrayOfLinks = []
        let arrayOfTronLinks = []

        let allProms = []
        let query = filterLinks(req, accountData)
        var count =
            (await CampaignLink.find(
                { id_wallet: { $in: [query.id_wallet] } },
                { type: { $exists: 0 } }
            ).countDocuments()) || 0

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
            .allowDiskUse(true)
            .skip(skip)
            .limit(limit)

        for (let i = 0; i < userLinks.length; i++) {
            let result = userLinks[i]
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
                    (cmp.bounties = campaign.bounties),
                    (cmp.remuneration = campaign.remuneration),
                    (cmp.endDate = campaign.endDate),
                    (cmp.type = campaign.type)
                result.campaign = cmp
                arrayOfLinks.push(result)
            }
        }
        allProms =
            req.query.campaign && req.query.state
                ? await influencersLinks(arrayOfLinks)
                : arrayOfLinks

        //repeating same process with tron links

        var Links = {
            Links: [...allProms, ...(req.query.state === 'owner' ? [] : [])],
            count,
        }

        return responseHandler.makeResponseData(res, 200, 'success', Links)
    } catch (err) {
        return makeResponseError(
            response,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.externalVerifyLink = async (req, response) => {
    try {
        const user = await UserExternalWallet.findOne({
            walletId: req.address,
        })
        var userId = user.UserId
        var { typeSN, idUser, idPost } = req.params
        let profileLinedin = null
        if (!typeSN || !idUser || !idPost) {
            return makeResponseError(response, 400, 'please provide all fields')
        }

        var linked = false
        var deactivate = false
        var res = false
        switch (typeSN) {
            case '1':
                let fbProfile = await FbProfile.findOne(
                    { UserId: userId },
                    { accessToken: 1 }
                ).lean()
                await updateFacebookPages(userId, fbProfile.accessToken, false)
                let fbPage = await FbPage.findOne(
                    {
                        UserId: userId,
                        username: idUser,
                    },
                    { token: 1, id: 1 }
                ).lean()
                if (fbProfile && fbPage) {
                    linked = true
                    res = await verifyFacebook(idPost, fbPage)

                    if (res && res.deactivate === true) {
                        deactivate = true
                    }
                }
                break
            case '2':
                var googleProfile = await GoogleProfile.findOne(
                    {
                        UserId: userId,
                    },
                    { refreshToken: 1 }
                ).lean()

                if (googleProfile) {
                    const data = await rp.post(
                        'https://oauth2.googleapis.com/token',
                        {
                            client_id: oauth.google.googleClientId,
                            client_secret: oauth.google.googleClientSecret,
                            refresh_token: googleProfile.refreshToken,
                            grant_type: 'refresh_token',
                        }
                    )
                    const access_token = data.data.access_token
                    await GoogleProfile.updateOne(
                        { UserId: userId },
                        { $set: { accessToken: access_token } }
                    )
                    linked = true
                    res = await verifyYoutube(userId, idPost, access_token)
                    if (res && res.deactivate === true) deactivate = true
                }

                break
            case '3':
                var page = await FbPage.findOne({
                    $and: [
                        { UserId: userId },
                        { instagram_id: { $exists: true } },
                    ],
                })
                if (page) {
                    linked = true
                    res = await verifyInsta(userId, idPost)
                    if (res === 'deactivate') deactivate = true
                }

                break
            case '4':
                var twitterProfile = await TwitterProfile.findOne(
                    {
                        UserId: userId,
                    },
                    { access_token_key: 1, access_token_secret: 1 }
                ).lean()
                if (twitterProfile) {
                    linked = true
                    res = await verifyTwitter(twitterProfile, userId, idPost)
                    if (res === 'deactivate') deactivate = true
                }

                break
            case '5':
                var linkedinProfile = await LinkedinProfile.find(
                    { userId },
                    { accessToken: 1, pages: 1, linkedinId: 1 }
                )
                if (linkedinProfile.length) {
                    linked = true
                    for (let profile of linkedinProfile) {
                        res = await verifyLinkedin(profile, idPost)
                        if (res === true) {
                            profileLinedin = profile
                            break
                        }
                        if (res === 'deactivate') deactivate = true
                    }
                }

                break
            case '6':
                var tiktokProfile = await TikTokProfile.findOne({
                    userId,
                }).lean()
                if (tiktokProfile) {
                    linked = true
                    res = await verifytiktok(tiktokProfile, idPost)
                    if (res === 'deactivate') deactivate = true
                }

                break
            case '7':
                var threads = await FbPage.findOne(
                    {
                        UserId: userId,
                        instagram_id: { $exists: true },
                        threads_id: { $exists: true },
                    },
                    { threads_id: 1, instagram_username: 1 }
                ).lean()

                if (threads) {
                    linked = true
                    res = await verifyThread(
                        idPost,
                        threads.threads_id,
                        threads.instagram_username
                    )

                    if (res === 'deactivate') deactivate = true
                }

                break
            default:
        }

        if (!linked)
            return makeResponseError(response, 406, 'account not linked')
        else if (res === 'lien_invalid')
            return makeResponseError(response, 406, 'invalid link')
        else if (deactivate)
            return makeResponseError(response, 405, 'account deactivated')
        else if (res === 'link_not_found')
            return makeResponseError(response, 406, 'link not found')
        else {
            if (typeSN == '7')
                return makeResponseData(
                    response,
                    200,
                    'success',
                    res ? 'true' : 'false',
                    threads.instagram_username
                )
            else
                return makeResponseData(
                    response,
                    200,
                    'success',
                    res ? 'true' : 'false',
                    res === true && typeSN == '5' && profileLinedin?.linkedinId
                )
        }
    } catch (err) {
        return makeResponseError(
            response,
            500,
            err.message ? err.message : err.error
        )
    }
}
