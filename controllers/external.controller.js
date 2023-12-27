const { responseHandler } = require('../helpers/response-handler')
const makeResponseData = responseHandler.makeResponseData
const makeResponseError = responseHandler.makeResponseError
const multer = require('multer');
const { ObjectId } = require('mongodb');

const storageCover = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/')
    },
    filename: (req, file, cb) => {
        cb(
            null,
            new Date().toISOString().replace(/:/g, '-') + file.originalname
        )
    },
})
const {
    Campaigns,
    GoogleProfile,
    LinkedinProfile,
    TwitterProfile,
    FbPage,
    TikTokProfile,
    UserExternalWallet
} = require('../model/index')
var fs = require('fs')

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
const { create } = require('ipfs-http-client')
var mongoose = require('mongoose')
const Grid = require('gridfs-stream')

let gfsKit
const conn = mongoose.connection
conn.once('open', () => {
    gfsKit = Grid(conn.db, mongoose.mongo)
    gfsKit.collection('campaign_kit')
})
exports.createUserFromExternalWallet = async (req, res) =>{   
    try {
        const userExist = await UserExternalWallet.findOne({walletId: req.body.wallet});
        if(!userExist) {
            const workerId = process.pid
            const currentDate = new Date().getTime();
            const uniqueId = parseInt(workerId + currentDate);
            const user = new UserExternalWallet({UserId: uniqueId,walletId: req.body.wallet});
            const savedUser = await user.save();
            return makeResponseData(res, 200, 'User created successfully', savedUser);
        } else return makeResponseData(res, 200, 'User signed In successfully', userExist);

    } catch(err){
        return makeResponseError(res, 500, err.message ? err.message : err.error);
    }
}


exports.campaignsPictureUploadExternal = multer({
    storage: storageCover,
}).single('cover')





exports.externalSocialAccounts = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({walletId: req.address});

        let UserId = user.UserId;
        let networks = {}
        let [channelsGoogle, channelsTwitter] = await Promise.all([
            GoogleProfile.find({ UserId }, { accessToken: 0, refreshToken: 0 }),
            TwitterProfile.find(
                { UserId },
                { _raw: 0, access_token_key: 0, access_token_secret: 0 }
            ),
        ])
        let channelsFacebook = await FbPage.find({ UserId }, { token: 0 })
        let channelsLinkedin = await LinkedinProfile.find({ userId: UserId })
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

exports.externalDeleteTiktokChannel = async (req,res) => {
    try {
        let user = await UserExternalWallet.findOne({walletId: req.address})

        let tiktokProfiles = await TikTokProfile.find({ userId: user.UserId })

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
        let user = await UserExternalWallet.findOne({walletId: req.address})

        let tiktokProfiles = await TikTokProfile.find({ userId: user.UserId })

        if (tiktokProfiles.length === 0)
            return makeResponseError(res, 204, 'No channel found')
        else {
            await TikTokProfile.deleteMany({ userId: user.UserId  })
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
        const UserId = await UserExternalWallet.findOne({walletId: req.address})
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
        const result = await GoogleProfile.deleteMany({ UserId: user.UserId })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 204, 'No channel found')
        } else {
            return makeResponseData(res, 200, 'deleted successfully')
        }
    } catch (err) {
        console.log({err})
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.externalDeleteFacebookChannels = async (req, res) => {
    try {
        const user = await UserExternalWallet.findOne({walletId: req.address})
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
        const result = await LinkedinProfile.deleteMany({ userId: user.UserId })
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
        let { organization, linkedinId } = req.params
        let linkedinProfile = await LinkedinProfile.findOne(
            { userId: user.UserId, linkedinId },
            { pages: 1 }
        ).lean()
        if (!linkedinProfile) return makeResponseError(res, 401, 'unauthorized')
        if (linkedinProfile.pages.length === 1) {
            await LinkedinProfile.deleteOne({ userId: user.UserId, linkedinId })
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
        const result = await TwitterProfile.deleteMany({ UserId: user.UserId })
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
        const user = await UserExternalWallet.findOne({walletId: req.address})
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



module.exports.externalVerifyLink = async (req, response) => {
    try {
        const user = await UserExternalWallet.findOne({walletId: req.address})
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


module.exports.externalSaveCampaign = async (req, res) => {
    try {
        let campaign = req.body
        const user = await UserExternalWallet.findOne({walletId: req.address});

        campaign.idNode = user.UserId
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


module.exports.externalVerifyExpiredToken = (req, res) => {
    return responseHandler.makeResponseData(res, 200, 'success', true)
}


module.exports.externalAccount = async (req, res) => {
    try {
        if (req.user) {
            let {
                password,
                secureCode,
                secret,
                newEmail,
                fireBaseAccessToken,
                ...user
            } = req.user.toObject()

            return makeResponseData(res, 200, 'success', user)
        } else {
            return makeResponseError(res, 204, 'user not found')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}


module.exports.externalUpdate = async (req, res) => {
    try {
        let campaign = req.body
        campaign.updatedAt = Date.now()
        let updatedCampaign = await Campaigns.findOneAndUpdate(
            { _id: req.params.id, idNode: req.body.userId},
            { $set: campaign.values },
            { new: true }
        )

        if (updatedCampaign) {
            return responseHandler.makeResponseData(
                res,
                200,
                'updated',
                updatedCampaign
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                204,
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



module.exports.externalUploadPictureToIPFS = async (req, res) => {
    // using IPFS
    try {
        if (req.file) {
            const { id } = req.params

            // SEARCH COMPAIGN ID
            const campaign = await Campaigns.findOne({
                _id: id,
                idNode: req.body.userId,
            })

            if (campaign) {
                // IPFS CONNECTION
                const ipfs = await ipfsConnect()

                // READ FILE
                const x = fs.readFileSync(req.file.path)

                // ADD TO IPFS
                let buffer = Buffer.from(x)
                let result = await ipfs.add({ content: buffer })

                // REMOVE FILE FROM UPLOADS DIR
                fs.unlinkSync('uploads/' + req.file.filename)

                return responseHandler.makeResponseData(res, 200, result, true)
            } else
                return responseHandler.makeResponseData(
                    res,
                    400,
                    'campaign not found / you are not the owner',
                    false
                )
        } else
            return responseHandler.makeResponseData(
                res,
                400,
                'required picture',
                false
            )
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
const ipfsConnect = async () => {
    const auth =
        'Basic ' +
        Buffer.from(
            process.env.IPFS_PROJECT_ID + ':' + process.env.IPFS_SECRET_KEY
        ).toString('base64')

    const ipfs = await create({
        host: process.env.IPFS_INFURA,
        port: process.env.IPFS_INFURA_PORT,
        protocol: process.env.IPFS_INFURA_PROTOCOL,
        headers: {
            authorization: auth,
        },
    })
    return ipfs
}



module.exports.externalAddKits = async (req, res) => {
    try {
        let file = req.file; // Use singular 'file' instead of 'files'

        let links = 
            typeof req.body.link === 'string'
                ? [req.body.link] // Wrap the single link in an array
                : req.body.link;

        let idCampaign = ObjectId(req.body.campaign);

        if (file) {
            // Update the single file
            await gfsKit.files.updateOne(
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
            );
        }

        if (links) {
            await Promise.all(
                links.map((link) => {
                    return gfsKit.files.insertOne({
                        campaign: {
                            $ref: 'campaign',
                            $id: idCampaign,
                            $db: 'atayen',
                        },
                        link: link,
                    });
                })
            );
        }

        return responseHandler.makeResponseData(res, 200, 'Kit uploaded', false);
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        );
    }
}