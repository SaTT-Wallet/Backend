var rp = require('axios');
const validator = require('validator')
const { Constants, TronConstant } = require('../conf/const')
const Big = require('big.js')
const {
    erc20Connexion,
    bep20Connexion,
    polygonConnexion,
    bttConnexion,
    tronConnexion,
    webTronInstance,
} = require('../blockchainConnexion')
const {
    User,
    GoogleProfile,
    FbProfile,
    LinkedinProfile,
    TwitterProfile,
    Interests,
    Notification,
    FbPage,
    TikTokProfile,
    Wallet,
    Campaigns,
    CampaignLink
} = require('../model/index')
const axios = require('axios')

const contentDisposition = require('content-disposition')

const { responseHandler } = require('../helpers/response-handler')
const makeResponseData = responseHandler.makeResponseData
const makeResponseError = responseHandler.makeResponseError

const { notificationManager, manageTime } = require('../manager/accounts.js')
const {
    synfonyHash,
    configureTranslation,
    readHTMLFileProfile,
} = require('../helpers/utils')

const  {extractFollowerCount}  = require('../helpers/common')
const {
    verifyYoutube,
    verifyFacebook,
    verifyInsta,
    verifyTwitter,
    verifyLinkedin,
    verifytiktok,
    updateFacebookPages,
    tiktokAbos,
    getFacebookUsername,
    verifyThread,
} = require('../manager/oracles')
const {
    getListCryptoByUid
} = require('../web3/wallets')
//var ejs = require('ejs')
const QRCode = require('qrcode')

const mongoose = require('mongoose')
let gfsprofilePic
let gfsUserLegal
const { mongoConnection, oauth } = require('../conf/config')

const connect = mongoose.connect(mongoConnection(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
})

const conn = mongoose.connection

conn.once('open', () => {
    gfsprofilePic = Grid(conn.db, mongoose.mongo)
    gfsprofilePic.collection('user_file')
    gfsUserLegal = Grid(conn.db, mongoose.mongo)
    gfsUserLegal.collection('user_legal')
})

const Grid = require('gridfs-stream')
const GridFsStorage = require('multer-gridfs-storage')
var Long = require('mongodb').Long

const multer = require('multer')
const { ObjectId } = require('mongodb')

const storageUserLegal = new GridFsStorage({
    db: connect,
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = file.originalname
            const fileInfo = {
                filename: filename,
                bucketName: 'user_legal',
            }

            resolve(fileInfo)
        })
    },
})

const storageProfilePic = new GridFsStorage({
    db: connect,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            const filename = file.originalname
            const fileInfo = {
                filename: filename,
                bucketName: 'user_file',
            }

            resolve(fileInfo)
        })
    },
})

module.exports.uploadImageProfile = multer({
    storage: storageProfilePic,
}).single('file')

module.exports.uploadUserLegal = multer({ storage: storageUserLegal }).single(
    'file'
)

exports.account = async (req, res) => {
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


exports.notificationDecision = async (req, res) => {
    try {
        if (!req.user) {
            return makeResponseData(res, 200, 'user-not-found', false);
        }
        const user = req.user.toObject();
        const requiredFields = [
            'firstName', 'lastName', 'address', 'email',
            'phone', 'gender', 'city', 'zipCode',
            'country', 'birthday'
        ];
        const count = requiredFields.reduce((acc, field) => {
            if (user[field] && user[field] !== '') {
                return acc + 1;
            }
            return acc;
        }, 0);
        const percentProf = (count * 100) / requiredFields.length;
        if (percentProf < 100) {
            return makeResponseData(res, 200, 'showing-complete-profile', percentProf);
        } else {
                const wallet = await Wallet.findOne({UserId: req.user._id});
                if(!!wallet) {
                    // GET SATT BALANCE
                    let sattBalance = Big(0);
                    const Web3BEP20 = await bep20Connexion()
                    const Web3ETH = await erc20Connexion()
                    const networks = [
                        { name: 'bep20', web3: Web3BEP20.eth, abi: Constants.token.abi, smarContract:  process.env.TOKEN_SATT_BEP20_CONTRACT },
                        { name: 'erc20', web3: Web3ETH.eth, abi: Constants.token.abi , smarContract:  process.env.TOKEN_SATT_CONTRACT},
                    ];
                    for (const networkObj of networks) {
                        let contract = new networkObj.web3.Contract(networkObj.abi, networkObj.smarContract);
                        if(user.hasWallet && !!wallet.keystore.address) {
                            const balance = await contract.methods.balanceOf(`0x${wallet.keystore.address}`).call();
                            sattBalance += Big(balance);
                        }
                        if(user.hasWalletV2 && !!wallet.walletV2.keystore.address) {
                            const balance = await contract.methods.balanceOf(`0x${wallet.walletV2.keystore.address}`).call();
                            sattBalance += Big(balance);
                        }
                    }
                    if(Number(sattBalance) === 0) {
                        return makeResponseData(res, 200, 'showing-buy-satt', true);
                    } else {
                        let gasBalance = 0;
                        for (const networkObj of networks) {
                            if(user.hasWallet && !!wallet.keystore.address) {
                                const balance = await networkObj.web3.getBalance(`0x${wallet.keystore.address}`);
                                gasBalance += Big(balance);
                            }
                            if(user.hasWalletV2 && !!wallet.walletV2.keystore.address) {
                                const balance = await networkObj.web3.getBalance(`0x${wallet.walletV2.keystore.address}`);
                                gasBalance += Big(balance);
                            }
                        }
                        if(Number(gasBalance) === 0) {
                            return makeResponseData(res, 200, 'showing-buy-fees', true);
                        } else {
                            // CHECK NEW AD POOLS
                            const campaignActive = await Campaigns.findOne({type: 'apply'}).sort({ _id: -1 });
                            if(!!campaignActive) return makeResponseData(res, 200, 'showing-campaign', campaignActive.coverMobile);
                            else {
                                const randomNum = Math.floor(Math.random() * 3) + 1;
                                return makeResponseData(res, 200, 'showing-random-number', randomNum);
                            }   
                        } 
                    }
               
                } else {
                    return makeResponseData(res, 200, 'wallet-not-found', false);
                }
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        );
    }
};


exports.profilePicture = async (req, response) => {
    try {
        const idUser = req.query.id ? +req.query.id : req.user._id;
    let file = await gfsprofilePic.files.findOne({ 'user.$id': idUser })
    if (!file || file.length === 0) {
        return makeResponseError(response, 204, 'No file exists')
    } else {
        response.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': file.length,
            'Content-Disposition': contentDisposition(file.filename),
        })
        const readstream = gfsprofilePic.createReadStream(file.filename)
        readstream.pipe(response)
    }
    } catch (err) {
        return makeResponseError(
            response,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.addProfilePicture = async (req, res) => {
    try {
        
        if (req.file) {
            await gfsprofilePic.files.findOneAndDelete({
                'user.$id': req.user._id,
            })
            await gfsprofilePic.files.updateOne(
                { _id: req.file.id },
                {
                    $set: {
                        user: {
                            $ref: 'user',
                            $id: req.user._id,
                            $db: 'nodesatt',
                        },
                    },
                }
            )
            return makeResponseData(res, 201, 'Saved')
        }
        return makeResponseData(res, 204, 'Only images allowed')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const id = req.user._id
        let { email, ...profile } = req.body

        const updatedProfile = await User.findOneAndUpdate(
            { _id: id },
            { $set: profile },
            { new: true }
        ).select('-password')

        if (updatedProfile.nModified === 0) {
            return makeResponseError(res, 400, 'update failed')
        }

        return makeResponseData(res, 201, 'profile updated', updatedProfile)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.UserLegalProfile = async (req, res) => {
    try {
        const idNode = '0' + req.user._id
        const files = await gfsUserLegal.files.find({ idNode }).toArray()
        userLegal = {}
        userLegal.legal = files
        for (var i = 0; i < userLegal.legal.length; i++) {
            if (userLegal.legal[i].validate == 'validate') {
                userLegal.legal[i].validate = true
            }
        }
        return makeResponseData(res, 200, 'success', userLegal)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.addUserLegalProfile = async (req, res) => {
    try {
        const id = req.user._id
        const idNode = '0' + id
        let type = req.body.type
        if (type && req.file) {
            await gfsUserLegal.files.deleteMany({
                $and: [{ idNode }, { type }],
            })
            const updatedLegalProfile = await gfsUserLegal.files.updateMany(
                { _id: req.file.id },
                {
                    $set: {
                        idNode,
                        DataUser: {
                            $ref: 'user',
                            $id: Long.fromNumber(id),
                            $db: 'nodesatt',
                        },
                        validate: false,
                        type,
                    },
                },
                {
                    new: true,
                }
            )

            await notificationManager(id, 'save_legal_file_event', {
                type,
            })
            return makeResponseData(res, 201, 'legal saved')
        }
        return makeResponseError(res, 204, 'Only images allowed')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.FindUserLegalProfile = async (req, res) => {
    try {
        const _id = req.params.id
        let file = await gfsUserLegal.files.findOne({ _id: ObjectId(_id) })
        if (!file || file.length === 0) {
            return makeResponseError(res, 204, 'No file exists')
        } else {
            let contentType = file?.contentType && file.contentType || file.mimeType
            res.writeHead(200, {
                'Content-type': contentType,
                'Content-Length': file.length,
                'Content-Disposition': contentDisposition(file.filename),
            })
            const readstream = gfsUserLegal.createReadStream(file.filename)
            readstream.pipe(res)
        }
        
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.deleteTwitterChannels = async (req, res) => {
    try {
        const UserId = req.user._id
        const result = await TwitterProfile.deleteMany({ UserId })
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

exports.deleteTwitterChannel = async (req, res) => {
    try {
        let UserId = req.user._id
        let _id = req.params.id
        let twitterProfile = await TwitterProfile.findOne({ _id })
        if (twitterProfile?.UserId !== UserId)
            return makeResponseError(res, 401, 'unauthorized')
        else {
            await TwitterProfile.deleteOne({ UserId })
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

exports.deleteGoogleChannels = async (req, res) => {
    try {
        const UserId = req.user._id
        const result = await GoogleProfile.deleteMany({ UserId })
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

exports.deleteGoogleChannel = async (req, res) => {
    try {
        let UserId = req.user._id
        let _id = req.params.id
        let googleProfile = await GoogleProfile.findOne({ _id }).lean()
        if (googleProfile?.UserId !== UserId)
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

exports.deleteFacebookChannels = async (req, res) => {
    try {
        const UserId = req.user._id
        const result = await FbPage.deleteMany({ UserId })
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

exports.deleteFacebookChannel = async (req, res) => {
    try {
        let UserId = req.user._id
        let _id = req.params.id
        let facebookProfile = await FbPage.findOne({ _id })
        if (facebookProfile?.UserId !== UserId)
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
exports.deleteLinkedinChannels = async (req, res) => {
    try {
        const userId = req.user._id
        const result = await LinkedinProfile.deleteMany({ userId })
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

exports.deleteLinkedinChannel = async (req, res) => {
    try {
        let userId = req.user._id
        let { organization, linkedinId } = req.params
        let linkedinProfile = await LinkedinProfile.findOne(
            { userId, linkedinId },
            { pages: 1 }
        ).lean()
        if (!linkedinProfile) return makeResponseError(res, 401, 'unauthorized')
        if (linkedinProfile.pages.length === 1) {
            await LinkedinProfile.deleteOne({ userId, linkedinId })
        } else {
            await LinkedinProfile.updateOne(
                { userId, linkedinId },
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

exports.deleteTiktokChannel = async (req, res) => {
    try {
        let userId = +req.user._id
        let tiktokProfile = await TikTokProfile.findOneAndDelete({ userId })
        if (!tiktokProfile) return makeResponseError(res, 401, 'unauthorized')
        return makeResponseData(res, 200, 'deleted successfully')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.deleteTiktokChannels = async (req, res) => {
    try {
        let userId = req.user._id

        let tiktokProfiles = await TikTokProfile.find({ userId })

        if (tiktokProfiles.length === 0)
            return makeResponseError(res, 204, 'No channel found')
        else {
            await TikTokProfile.deleteMany({ userId })
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
exports.UserInterstes = async (req, res) => {
    try {
        const userId = req.user._id
        let allInterests = []

        const result = await Interests.find({ userId })

        if (!result.length) {
            return makeResponseError(res, 204, 'No interest found')
        } else if (result.length >= 2) {
            result.forEach((item, index) => {
                allInterests = [...allInterests, ...item.interests]
            })
        } else {
            allInterests = [...result[0].interests]
        }

        return makeResponseData(res, 200, 'success', allInterests)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.UpdateIntersts = async (req, res) => {
    try {
        let id = req.user._id
        let userInterests = req.body.interests

        const interests = await Interests.findOneAndUpdate(
            { userId: id },
            { $set: { interests: userInterests } },
            {
                new: true,
                upsert: true,
            }
        )
        if (interests.nModified === 0) {
            return makeResponseError(res, 400, 'updated failed')
        }
        return makeResponseData(res, 201, 'success', interests)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.tiktokApiAbos = async (req, res) => {
    try {
        let abos = await tiktokAbos(req.params.idUser)
        return makeResponseData(res, 200, 'success', abos)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.socialAccounts = async (req, res) => {
    try {
        let UserId = req.user._id
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

module.exports.checkOnBoarding = async (req, res) => {
    try {
        const _id = req.user._id
        const userUpdated = User.updateOne(
            { _id },
            { $set: { onBoarding: true } }
        )
        const firstNotif = notificationManager(_id, 'buy_some_gas', {
            action: 'buy_some_gas',
        })
        const secondNotif = notificationManager(_id, 'invite_friends', {
            action: 'Invite your friends',
        })
        const thirdNotif = notificationManager(_id, 'join_on_social', {
            action: 'Join us on social',
        })
        await Promise.allSettled([
            userUpdated,
            firstNotif,
            secondNotif,
            thirdNotif,
        ])
        return makeResponseData(res, 201, 'onBoarding updated', true)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.requestMoney = async (req, res) => {
    try {
        let lang = req.body.lang || 'en'
        var message = req.body.message
        configureTranslation(lang)
        const id = req.user._id
        let code = await QRCode.toDataURL(req.body.wallet)

        var result = await User.findOne({ email: req.body.to })

        if (result) {
            await notificationManager(id, 'send_demande_satt_event', {
                name: req.body.to,
                price: req.body.price,
                currency: req.body.cryptoCurrency,
                message,
                wallet: req.body.wallet,
            })
            await notificationManager(result._id, 'demande_satt_event', {
                name: req.body.name,
                price: req.body.price,
                currency: req.body.cryptoCurrency,
                message,
                wallet: req.body.wallet,
            })
        }
        readHTMLFileProfile(
            __dirname + '/../public/emailtemplate/notification.html',
            'notification',
            req.body,
            null,
            null,
            code
        )

        return makeResponseData(res, 202, 'Email was sent to ' + req.body.to)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.support = async (req, res) => {
    try {
        if (validator.isEmail(req.body.email)) {
            readHTMLFileProfile(
                __dirname + '/../public/emailtemplate/contact_support.html',
                'contact_support',
                req.body
            )
            return makeResponseData(res, 200, 'Email was sent')
        } else {
            return makeResponseError(
                res,
                400,
                'please provide a valid email address!'
            )
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.notificationUpdate = async (req, res) => {
    let _id = req.params.id

    if (_id === '{_id}' || !_id) {
        return makeResponseError(res, 406, '_id field is missing')
    }

    try {
        const result = await Notification.updateOne(_id, {
            $set: { isSeen: true },
        })
        if (result.nModified === 0) {
            return makeResponseError(res, 400, 'updated failed')
        }
        return makeResponseData(res, 201, 'notification seen')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.changeNotificationsStatus = async (req, res) => {
    try {
        const idNode = '0' + req.user._id
        const result = await Notification.updateMany(
            { idNode, isSeen: false },
            { $set: { isSeen: true } }
        )

        if (result.nModified === 0) {
            return makeResponseError(res, 204, 'No notifications found')
        }
        return makeResponseData(res, 200, 'Notification clicked')
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.getNotifications = async (req, res) => {
    try {
        const idNode = '0' + req.user._id
        const typesToExclude = ['buy_some_gas', 'invite_friends', 'join_on_social'];
        const startDate = new Date(process.env.STARTDATE_NOTIFICATION);
        const arrayNotifications = await Notification.find({ 
            idNode,
            createdAt: { $gte: startDate },
            $and: [
                {type: { $nin: typesToExclude}}
            ]
        }).sort({
            createdAt: 'desc',
        })
        
        
        if (arrayNotifications.length === 0) {
            return makeResponseError(res, 204, 'No notifications found')
        }

        const limit = parseInt(req.query.limit) || 10000000
        //const limit = 10;
        const page = parseInt(req.query.page) || 1
        const startIndex = (page - 1) * limit
        const endIndex = page * limit

        const notifications = {}
        if (endIndex < arrayNotifications.length) {
            notifications.next = {
                page: page + 1,
                limit: limit,
            }
        }
        if (startIndex > 0) {
            notifications.previous = {
                page: page - 1,
                limit: limit,
            }
        }
        const isSeen = await Notification.find({
            idNode,
            isSeen: false,
        })
        notifications.isSeen = isSeen.length
        notifications.notifications = arrayNotifications.slice(
            startIndex,
            endIndex
        )
        
        const notificationTasks =  notifications.notifications.map(async notification => {

            switch (notification.type) {
                case 'cmp_candidate_insert_link':
                case 'cmp_candidate_reject_link':
                case 'apply_campaign':
                case 'cmp_candidate_accept_link':
                    const link = await CampaignLink.findOne({ _id: notification.label.linkHash || notification.label.promHash || notification.label.linkId });
                    notification.label.linkExist = Boolean(link);
                    notification.label.link = link || null;
                    break;
        
                case 'create_campaign':
                    const campaign = await Campaigns.findOne({ hash: notification.label.cmp.hash });
                    notification.label.cmp_update = campaign || null;
                    break;
            }
          });
          
          // Wait for all tasks to complete
        await Promise.all(notificationTasks);


        
        return makeResponseData(res, 200, 'success', notifications)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.changeEmail = async (req, res) => {
    var pass = req.body.pass
    var email = req.body.email.toLowerCase()
    var user = req.user

    try {
        if (user.password != synfonyHash(pass)) {
            return makeResponseError(res, 406, 'wrong password')
        }
        var existUser = await User.findOne({ email })
        if (existUser) {
            return makeResponseError(res, 406, 'duplicated email')
        } else {
            const code = Math.floor(100000 + Math.random() * 900000)
            newEmail = {}
            newEmail.email = email
            newEmail.expiring = Date.now() + 3600 * 20 * 5
            newEmail.code = code

            const result = await User.updateOne(
                { _id: Long.fromNumber(req.user._id) },
                { $set: { newEmail } }
            )

            let requestDate = manageTime()
            let ip =
                req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
            //if (ip) ip = ip.split(':')[3]

            const lang = req.query.lang || 'en'
            configureTranslation(lang)

            // let subject = (lang == "en") ? "Satt wallet change email" : "";

            readHTMLFileProfile(
                __dirname + '/../public/emailtemplate/changeEmail.html',
                'changeEmail',
                null,
                ip,
                requestDate,
                code,
                newEmail
            )
            return makeResponseData(res, 200, 'Email was sent to ' + email)
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
module.exports.confrimChangeMail = async (req, res) => {
    try {
        var id = req.user._id
        var code = req.body.code
        var user = await User.findOne({ _id: Long.fromNumber(id) }).select(
            'newEmail'
        )

        if (Date.now() >= user.newEmail.expiring) {
            return makeResponseError(res, 401, 'code expired')
        } else if (user.newEmail.code != code) {
            return makeResponseError(res, 406, 'code incorrect')
        } else {
            var newEmail = user.newEmail.email
            await User.updateOne(
                { _id: Long.fromNumber(id) },
                { $set: { email: newEmail } }
            )
            return makeResponseData(res, 200, 'email changed')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.checkThreads = async (req, res) => {
 try{
   let instaAccount = await FbPage.findOne({UserId : req.user._id, instagram_username : {$exists : true}});
   if(!instaAccount) return makeResponseData(res, 200,'instagram_not_found')
   if(instaAccount.threads_id) return makeResponseData(res, 200, 'threads_already_added')
   return makeResponseData(res, 200, true)
 }catch (err) {
    return makeResponseError(
        res,
        500,
        err.message ? err.message : err.error
    )
 }
}

module.exports.verifyLink = async (req, response) => {
    try {
        var userId = req.user._id
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
                   
                    const data = await rp.post('https://oauth2.googleapis.com/token', {
                                client_id: oauth.google.googleClientId,
                                client_secret: oauth.google.googleClientSecret,
                                refresh_token: googleProfile.refreshToken,
                                grant_type: 'refresh_token',
                            })
                    const access_token = data.data.access_token;
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
                var threads = await FbPage.findOne({             
                         UserId: userId, 
                        instagram_id: { $exists: true } ,
                        threads_id: { $exists: true }  
                },{threads_id : 1, instagram_username: 1}).lean()
     
                if (threads) {
                    linked = true
                    res = await verifyThread(idPost,threads.threads_id, threads.instagram_username)
                
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
        else if (res === 'link_not_found') return makeResponseError(response, 406, 'link not found')
        else {
            if(typeSN == '7') return makeResponseData(
                response,
                200,
                'success',
                res ? 'true' : 'false',
                threads.instagram_username
            )

            else return makeResponseData(
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
module.exports.convertIdToFbUsername = async (req, res) => {
    try {
        idUser = req.user._id
        var idLink = req.params.id
        let usernamefb = await getFacebookUsername(idUser, idLink)
        return makeResponseData(
            res,
            200,
            'get username successfully',
            usernamefb
        )
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.ShareByActivity = async (req, res) => {
    try {
        let userId = req.user._id
        let activityURN = req.params.activity
        let linkedinProfile = await LinkedinProfile.findOne({ userId },{accessToken :1}).lean()

        let postData = await rp.get(process.env.LINKEDIN_FIRST_URL_ADRR_FIRST + activityURN,{headers:{
            Authorization: 'Bearer ' + linkedinProfile.accessToken,
        }})
       
        let urn = `urn:li:activity:${activityURN}`

        let sharedId = postData.data.results[urn]['domainEntity']
        return makeResponseData(res, 200, 'success', sharedId)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.ProfilPrivacy = async (req, res) => {
    try {
        let privacy = ''
        let userId = req.user._id
        let tiktokProfile = await TikTokProfile.findOne({ userId })
        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${process.env.TIKTOK_KEY}&grant_type=refresh_token&refresh_token=${tiktokProfile.refreshToken}`
        let resMedia = await rp.get(getUrl)
        const linkedinData = await{
            url: 'https://open.tiktokapis.com/v2/video/list/?fields=cover_image_url,id,title',
            method: 'POST',
            body: {
                max_count: 20,
            },
            headers: {
                Authorization: 'Bearer ' + resMedia?.data.data.access_token,
            },
            json: true,
        }
        let postData = await rp.post('https://open.tiktokapis.com/v2/video/list/?fields=cover_image_url,id,title',{
            max_count: 20,
        },{headers :{
            Authorization: 'Bearer ' + resMedia?.data.data.access_token,
        }})
        if (postData.data.data.videos.length === 0) {
            privacy = 'private'
        } else {
            privacy = 'public'
        }

        return makeResponseData(res, 200, 'success', privacy)
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

module.exports.addThreadsAccount = async (req,res) => {
    try {
        const instaAccount = await FbPage.findOne({UserId : req.user._id, instagram_username : {$exists : true}});
        if(!instaAccount) return makeResponseData(res, 200,'instagram_not_found')
        if(instaAccount.threads_id) return makeResponseData(res, 200,'threads_already_added')
        const user = await axios.get(`https://www.threads.net/@${instaAccount.instagram_username}`);
        let text = user.data.replace(/\s/g, '').replace(/\s/g, '');
        const userID = text.match(/"user_id":"(\d+)"/)?.[1]
        if(!userID) return makeResponseData(res, 200,'threads_not_found')
        const followers = extractFollowerCount(user.data.split('Followers')[0].split("content=")[user.data.split('Followers')[0].split("content=").length - 1].trim())
        const lsdToken = getLsdToken(text)
        const currentUser = await fetchUserThreadData(lsdToken, userID);
        if(currentUser) {
            const userPicture = await axios.get(currentUser.profile_pic_url, { responseType: 'arraybuffer' })
            const base64String = Buffer.from(userPicture.data, 'binary').toString('base64');
            await FbPage.updateOne({UserId : req.user._id,
                instagram_username: instaAccount.instagram_username,
            }, {threads_id: currentUser.pk, threads_picture: base64String ? base64String : currentUser.profile_pic_url, threads_followers : followers})
            return makeResponseData(res, 200, 'threads_account_added', {username: instaAccount.instagram_username, picture: base64String ? base64String : currentUser.profile_pic_url, id: currentUser.pk,threads_followers : followers})
        } 
        return makeResponseData(res, 200, 'error')
    } catch(err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}



module.exports.removeThreadsAccount = async (req, res) => {
    try {
      // Find the instaAccount
      const instaAccount = await FbPage.findOne({
        UserId: req.user._id,
        threads_id: req.params.id,
        instagram_username: { $exists: true },
      });
  
      // Set the default response data message
      let responseDataMessage = 'no_threads_found';
  
      // Check if the instaAccount exists
      if (!instaAccount) {
        responseDataMessage = 'instagram_not_found';
      } else if (instaAccount.threads_id) {
        // Check if threads_id exists and update the FbPage document
        await FbPage.updateOne(
          {
            UserId: req.user._id,
            threads_id: req.params.id,
          },
          { $unset: { threads_id: 1, threads_picture: 1, threads_followers: 1 } }
        );
        responseDataMessage = 'deleted successfully';
      }
  
      return makeResponseData(res, 200, responseDataMessage);
    } catch (error) {
      // Handle any errors that might occur during the process
      return makeResponseError(
        res,
        500,
        err.message ? err.message : err.error
    );
    }
  };









const getLsdToken = text => text.match(/"LSD",\[\],{"token":"(\w+)"},\d+\]/)?.[1];


const fetchUserThreadData = async (token, userID) => {
  const data = {
    lsd: token,
    variables: `{"userID": ${userID}}`,
    doc_id: '23996318473300828',
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'X-ASBD-ID': '129477',
    'X-FB-LSD': token,
    'X-IG-App-ID': '5587632691339264',
  };

  const response = await axios.post(
    'https://www.threads.net/api/graphql',
    data,
    {
      headers: headers,
      transformRequest: [(data) => {
        return Object.entries(data)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
      }],
    }
    );

    const user = response?.data?.data?.userData?.user
    return user;
}
