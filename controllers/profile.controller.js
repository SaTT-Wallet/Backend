var rp = require('request-promise')
const {
    User,
    GoogleProfile,
    FbProfile,
    LinkedinProfile,
    TwitterProfile,
    Interests,
    Notification,
    FbPage,
} = require('../model/index')

const { responseHandler } = require('../helpers/response-handler')
const makeResponseData = responseHandler.makeResponseData
const makeResponseError = responseHandler.makeResponseError

const { notificationManager, manageTime } = require('../manager/accounts.js')
const {
    synfonyHash,
    configureTranslation,
    readHTMLFileProfile,
} = require('../helpers/utils')
const {
    verifyYoutube,
    verifyFacebook,
    verifyInsta,
    verifyTwitter,
    verifyLinkedin,
} = require('../manager/oracles')

const QRCode = require('qrcode')

const mongoose = require('mongoose')
let gfsprofilePic
let gfsUserLegal
const { mongoConnection, oauth } = require('../conf/config1')

const conn = mongoose.createConnection(mongoConnection().mongoURI)

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

const storageUserLegal = new GridFsStorage({
    url: mongoConnection().mongoURI,
    options: { useNewUrlParser: true, useUnifiedTopology: true },
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
    url: mongoConnection().mongoURI,
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
//const uploadUserLegal =  multer({storage : storageUserLegal})

module.exports.uploadImageProfile = multer({
    storage: storageProfilePic,
}).single('file')

module.exports.uploadUserLegal = multer({ storage: storageUserLegal }).single(
    'file'
)

exports.account = async (req, res) => {
    try {
        if (req.user) {
            let { password, ...user } = req.user.toObject()
            return makeResponseData(res, 200, 'success', user)
        } else {
            return makeResponseError(res, 404, 'user not found')
        }
    } catch (err) {
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.profilePicture = async (req, response) => {
    try {
        const idUser = req.query.id ? +req.query.id : req.user._id
        gfsprofilePic.files.findOne({ 'user.$id': idUser }, (err, file) => {
            if (!file || file.length === 0) {
                return makeResponseError(response, 404, 'No file exists')
            } else {
                response.writeHead(200, {
                    'Content-Type': 'image/png',
                    'Content-Length': file.length,
                    'Content-Disposition': `attachment; filename=${file.filename}`,
                })
                const readstream = gfsprofilePic.createReadStream(file.filename)
                readstream.pipe(response)
            }
        })
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
                            $ref: 'sn_user',
                            $id: req.user._id,
                            $db: 'atayen',
                        },
                    },
                }
            )
            return makeResponseData(res, 201, 'Saved')
        }
        return makeResponseData(res, 404, 'Only images allowed')
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
        let profile = req.body
        if (profile.email) {
            const user = await User.findOne({
                $and: [{ email: profile.email }, { _id: { $nin: [id] } }],
            })
            if (user) {
                return makeResponseError(res, 406, 'email already exists')
            }
        }
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

        // console.log('body', req.body)
        // console.log('---------', req.file)

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
                            $ref: 'sn_user',
                            $id: Long.fromNumber(id),
                            $db: 'atayen',
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
        return makeResponseError(res, 404, 'Only images allowed')
    } catch (err) {
        console.log(err)
        return makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}

exports.FindUserLegalProfile = async (req, res) => {
    try {
        const id = req.user._id

        const _id = req.params.id
        gfsUserLegal.files.findOne(_id, (err, file) => {
            if (!file || file.length === 0) {
                return makeResponseError(res, 404, 'No file exists')
            } else {
                if (file.contentType) {
                    contentType = file.contentType
                } else {
                    contentType = file.mimeType
                }
                res.writeHead(200, {
                    'Content-type': contentType,
                    'Content-Length': file.length,
                    'Content-Disposition': `attachment; filename=${file.filename}`,
                })
                const readstream = gfsUserLegal.createReadStream(file.filename)
                readstream.pipe(res)
            }
        })
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
            return makeResponseError(res, 404, 'No channel found')
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

exports.deleteFacebookChannels = async (req, res) => {
    try {
        const UserId = req.user._id
        const result = await FbProfile.deleteMany({ UserId })
        if (result.deletedCount === 0) {
            return makeResponseError(res, 404, 'No channel found')
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

exports.deleteLinkedinChannels = async (req, res) => {
    try {
        const userId = req.user._id
        const result = await LinkedinProfile.deleteMany(
            { userId },
            { $set: { pages: [] } }
        )
        if (result.deletedCount === 0) {
            return makeResponseError(res, 404, 'No channel found')
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

exports.UserInterstes = async (req, res) => {
    try {
        const userId = req.user._id
        let allInterests = []

        const result = await Interests.find({ userId })

        if (!result.length) {
            return makeResponseError(res, 404, 'No interest found')
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

exports.socialAccounts = async (req, res) => {
    try {
        let UserId = req.user._id
        let networks = {}
        let channelsGoogle = await GoogleProfile.find({ UserId })
        let channelsTwitter = await TwitterProfile.find({ UserId })
        let channelsFacebook = await FbProfile.find({ UserId })
        let channelsLinkedin = await LinkedinProfile.find({ userId: UserId })
        networks.google = channelsGoogle
        networks.twitter = channelsTwitter
        networks.facebook = channelsFacebook
        networks.linkedin = channelsLinkedin?.pages || []
        if (
            !channelsGoogle.length &&
            !channelsLinkedin.length &&
            !channelsTwitter.length &&
            !channelsFacebook.length
        ) {
            return makeResponseError(res, 404, 'No channel found')
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
        const result = await User.updateOne(
            { _id },
            { $set: { onBoarding: true } }
        )
        if (result.nModified === 0) {
            return makeResponseError(res, 404, 'user not found')
        }
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
        let lang = /*req.query.lang ??*/ 'en'
        configureTranslation(lang)
        const id = req.user._id
        let code = await QRCode.toDataURL(req.body.wallet)

        await notificationManager(id, 'send_demande_satt_event', {
            name: req.body.to,
            price: req.body.price,
            currency: req.body.currency,
        })

        var result = await User.findOne({ email: req.body.to })
        if (result) {
            await notificationManager(result._id, 'demande_satt_event', {
                name: req.body.name,
                price: req.body.price,
                currency: req.body.currency,
            })
        } else {
            return makeResponseError(res, 404, 'user not found')
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
    const validateEmail = /\S+@\S+\.\S+/

    try {
        if (validateEmail.test(req.body.email)) {
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
            { $and: [{ idNode }, { isSend: false }] },
            { $set: { isSeen: true } }
        )
        if (result.nModified === 0) {
            return makeResponseError(res, 404, 'No notifications found')
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
        const arrayNotifications = await Notification.find({ idNode })

        if (arrayNotifications.length === 0) {
            return makeResponseError(res, 404, 'No notifications found')
        }

        const limit = parseInt(req.query.limit) || 50
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
        const isSend = await Notification.find({
            idNode,
            isSend: false,
        })
        notifications.isSend = isSend.length
        notifications.notifications = arrayNotifications.slice(
            startIndex,
            endIndex
        )
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
    var email = req.body.email
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
            newEmail.expiring = Date.now() + 3600 * 20
            newEmail.code = code

            const result = await User.updateOne(
                { _id: Long.fromNumber(req.user._id) },
                { $set: { newEmail } }
            )

            let requestDate = manageTime()
            let ip =
                req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
            if (ip) ip = ip.split(':')[3]

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
        // console.log('error', err)
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

module.exports.verifyLink = async (req, response) => {
    try {
        var userId = req.user._id
        var typeSN = req.params.typeSN
        var idUser = req.params.idUser
        var idPost = req.params.idPost

        if (!typeSN || !idUser || !idPost) {
            return makeResponseError(response, 400, 'please provide all fields')
        }

        var linked = false
        var deactivate = false
        var res = false
        switch (typeSN) {
            case '1':
                var fbProfile = await FbProfile.findOne({ UserId: userId })

                if (fbProfile) {
                    linked = true
                    res = await verifyFacebook(userId, idUser, idPost)

                    if (res && res.deactivate === true) {
                        deactivate = true
                    }
                }
                break
            case '2':
                var googleProfile = await GoogleProfile.findOne({
                    UserId: userId,
                })

                if (googleProfile) {
                    var options = {
                        method: 'POST',
                        uri: 'https://oauth2.googleapis.com/token',
                        body: {
                            client_id: oauth.google.googleClientId,
                            client_secret: oauth.google.googleClientSecret,
                            refresh_token: googleProfile.refreshToken,
                            grant_type: 'refresh_token',
                        },
                        json: true,
                    }

                    var result = await rp(options)
                    await GoogleProfile.updateOne(
                        { UserId: userId },
                        { $set: { accessToken: result.access_token } }
                    )
                    linked = true
                    res = await verifyYoutube(userId, idPost)
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
                var twitterProfile = await TwitterProfile.findOne({
                    UserId: userId,
                })
                if (twitterProfile) {
                    linked = true
                    res = await verifyTwitter(userId, idPost)
                    if (res === 'deactivate') deactivate = true
                }

                break
            case '5':
                var linkedinProfile = await LinkedinProfile.findOne({ userId })
                if (linkedinProfile && linkedinProfile.pages.length > 0) {
                    linked = true
                    res = await verifyLinkedin(linkedinProfile, idPost)
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
        else
            return makeResponseData(
                response,
                200,
                'success',
                res ? 'true' : 'false'
            )
    } catch (err) {
        // console.log('err', err)
        return makeResponseError(
            response,
            500,
            err.message ? err.message : err.error
        )
    }
}
