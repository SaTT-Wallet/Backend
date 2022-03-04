var passport = require('passport')
var emailStrategy = require('passport-local').Strategy
var Twitter = require('twitter')
var LocalStrategy = require('passport-local').Strategy
var Long = require('mongodb').Long
const crypto = require('crypto')
const hasha = require('hasha')
var rp = require('request-promise')
const jwt = require('jsonwebtoken')
var User = require('../model/user.model')
var FbProfile = require('../model/fbProfile.model')
var TwitterProfile = require('../model/twitterProfile.model')
var GoogleProfile = require('../model/googleProfile.model')
var LinkedinProfile = require('../model/linkedinProfile.model')

const { responseHandler } = require('../helpers/response-handler')

var requirement = require('../helpers/utils')

const {
    readHTMLFileLogin,
    configureTranslation,
    cloneUser,
    generateAccessToken,
    synfonyHash,
} = require('../helpers/utils')

const { updateAndGenerateCode, isBlocked } = require('../manager/accounts.js')

var express = require('express')
var app = express()

var session = require('express-session')

try {
    app.use(
        session({
            secret: 'fe3fF4FFGTSCSHT57UI8I8',
            resave: true,
            saveUninitialized: true,
        })
    ) // session secret
    app.use(passport.session())
} catch (e) {
    console.log(e)
}
passport.serializeUser(function (user, cb) {
    cb(null, user)
})

passport.deserializeUser(async function (id, cb) {
    var user = await User.findOne({ _id: Long.fromNumber(id) })
    cb(null, user)
})

const handleSocialMediaSignin = async (query, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne(query)
    if (user) {
        if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`
            return cb({ error: true, message, blockedDate: user.date_locked })
        }
        let userAuth = cloneUser(user)
        let token = generateAccessToken(userAuth)
        return cb(null, { id: user._id, token, expires_in: date })
    } else {
        return cb('Register First')
    }
}

let createUser = (
    enabled,
    idSn,
    lang,
    newsLetter,
    picLink = false,
    username,
    email = null,
    idOnSn,
    socialId,
    firstName = null,
    lastName = null,
    password = null
) => {
    const userObject = {}
    ;(userObject.enabled = enabled),
        (userObject.userSatt = true),
        (userObject.failed_count = 0)
    ;(userObject.onBoarding = false), (userObject.account_locked = false)
    ;(userObject.idSn = idSn), (userObject.newsLetter = newsLetter ?? false)
    userObject.locale = 'en'
    if (picLink) userObject.picLink = picLink
    ;(userObject.username = username), (userObject.email = email)
    if (idOnSn && socialId) userObject[idOnSn] = socialId
    if (firstName) userObject.firstName = firstName
    if (lang) userObject.lang = lang
    if (lastName) userObject.lastName = lastName
    if (lang) userObject.lang = lang

    userObject.password = password ?? synfonyHash(crypto.randomUUID())
    return userObject
}
/*
 * begin signin with email and password
 */
passport.use(
    'signinEmailStrategy',
    new emailStrategy(
        { passReqToCallback: true },
        async (req, username, password, done) => {
            var date = Math.floor(Date.now() / 1000) + 86400
            var user = await User.findOne({ email: username.toLowerCase() })
            if (user) {
                if (user.password == synfonyHash(password)) {
                    console.log(
                        'authentification',
                        req.addressIp,
                        `valid ${username}`
                    )
                    let validAuth = await isBlocked(user, true)
                    if (!validAuth.res && validAuth.auth == true) {
                        let userAuth = cloneUser(user.toObject())
                        let token = generateAccessToken(userAuth)
                        await User.updateOne(
                            { _id: Long.fromNumber(user._id) },
                            { $set: { failed_count: 0 } }
                        )
                        return done(null, {
                            id: user._id,
                            token,
                            expires_in: date,
                            noredirect: req.body.noredirect,
                        })
                    } else {
                        return done(null, false, {
                            error: true,
                            message: 'account_locked',
                            blockedDate: validAuth.blockedDate,
                        })
                    }
                } else {
                    let validAuth = await isBlocked(user, false)
                    console.log(
                        'authentification',
                        req.addressIp,
                        `invalid ${username} ${password}`
                    )
                    if (validAuth.res) {
                        return done(null, false, {
                            error: true,
                            message: 'account_locked',
                            blockedDate: validAuth.blockedDate,
                        })
                    }
                    return done(null, false, {
                        error: true,
                        message: 'invalid_credentials',
                        blockedDate: validAuth.blockedDate,
                    })
                }
            } else {
                console.log(
                    'authentification',
                    req.addressIp,
                    `invalid ${username} ${password}`
                )
                return done(null, false, {
                    error: true,
                    message: 'invalid_credentials',
                })
            }
        }
    )
)
exports.emailConnection = async (req, res, next) => {
    passport.authenticate(
        'signinEmailStrategy',
        { session: false },
        (err, user, info) => {
            if (err) {
                return responseHandler.makeResponseError(res, 401, err)
            }
            if (!user) {
                return responseHandler.makeResponseError(res, 401, info)
            }
            req.logIn(user, function (err) {
                var param = {
                    access_token: user.token,
                    expires_in: user.expires_in,
                    token_type: 'bearer',
                    scope: 'user',
                }
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    param
                )
            })
        }
    )(req, res, next)
}
/*
 * end signin with email and password
 */

/*
 * begin signin with facebook strategy
 */
exports.facebookAuthSignin = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    await handleSocialMediaSignin(
        { idOnSn: profile._json.token_for_business },
        cb
    )
}
/*
 * end signin with email and password
 */

/*
 * begin signin with facebook strategy
 */
exports.facebookAuthSignin = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    await handleSocialMediaSignin(
        { idOnSn: profile._json.token_for_business },
        cb
    )
}
/*
 *end signin with facebook strategy
 */

/*
 *begin signin with google strategy
 */
exports.googleAuthSignin = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    await handleSocialMediaSignin({ idOnSn2: profile.id }, cb)
}
/*
 *end signin with google strategy
 */

/*
 * begin signup with email and password
 */
passport.use(
    'auth_signup_emailStrategy',
    new LocalStrategy({ passReqToCallback: true }, async function (
        req,
        username,
        password,
        done
    ) {
        var date = Math.floor(Date.now() / 1000) + 86400
        let user = await User.findOne({ email: username.toLowerCase() })
        if (user) {
            return done(null, false, {
                error: true,
                message: 'account_already_used',
            })
        } else {
            var createdUser = createUser(
                0,
                0,
                req.body.lang,
                req.body.newsLetter,
                '',
                username.toLowerCase(),
                username.toLowerCase(),
                false,
                false,
                '',
                '',
                synfonyHash(password)
            )
            let user = await new User(createdUser).save()
            createdUser._id = user._id
            let token = generateAccessToken(createdUser)
            const lang = req.query.lang || 'en'
            const code = await updateAndGenerateCode(
                createdUser._id,
                'validation'
            )
            configureTranslation(lang)

            readHTMLFileLogin(
                __dirname +
                    '/../public/emailtemplate/email_validated_code.html',
                'emailValidation',
                null,
                null,
                code,
                user
            )
            return done(null, {
                id: createdUser._id,
                token,
                expires_in: date,
                noredirect: req.body.noredirect,
            })
        }
    })
)
exports.emailSignup = async (req, res, next) => {
    passport.authenticate('auth_signup_emailStrategy', (err, user, info) => {
        if (err) {
            return responseHandler.makeResponseError(res, 401, err)
        }

        if (!user) {
            return responseHandler.makeResponseError(res, 401, info)
        }

        req.logIn(user, function (err) {
            var param = {
                access_token: user.token,
                expires_in: user.expires_in,
                token_type: 'bearer',
                scope: 'user',
            }
            return responseHandler.makeResponseData(res, 200, 'success', param)
        })

        req.logIn(user, function (err) {
            var param = {
                access_token: user.token,
                expires_in: user.expires_in,
                token_type: 'bearer',
                scope: 'user',
            }
            return res.end(JSON.stringify(param))
        })
    })(req, res, next)
}
/*
 * end signin with email and password
 */
/*
 * begin signup with facebook strategy
 */
exports.facebookAuthSignup = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne({
        $or: [
            { idOnSn: profile._json.token_for_business },
            { email: profile._json.email },
        ],
    })
    if (user) {
        return cb('account_already_used&idSn=' + user.idSn)
    } else {
        let createdUser = createUser(
            1,
            1,
            req.body.lang,
            req.body.newsLetter,
            profile.photos.length ? profile.photos[0].value : false,
            profile._json.email,
            profile._json.email,
            'idOnSn',
            profile._json.token_for_business,
            profile._json.name.split(' ')[0],
            profile._json.name.split(' ')[1]
        )
        let user = await new User(createdUser).save()
        createdUser._id = user._id
        let token = generateAccessToken(createdUser)
        return cb(null, { id: createdUser._id, token: token, expires_in: date })
    }
}
/*
 *end signup with facebook strategy
 */

exports.googleAuthSignup = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne({
        $or: [{ idOnSn2: profile.id }, { email: profile._json.email }],
    })
    if (user) {
        return cb('account_already_used&idSn=' + user.idSn)
    } else {
        let createdUser = createUser(
            1,
            2,
            req.body.lang,
            req.body.newsLetter,
            profile.photos.length ? profile.photos[0].value : false,
            profile.displayName,
            profile.emails.length ? profile.emails[0].value : false,
            'idOnSn2',
            profile.id,
            profile.name.givenName,
            profile.name.familyName
        )
        let user = await new User(createdUser).save()
        createdUser._id = user._id
        let token = generateAccessToken(createdUser)
        return cb(null, { id: createdUser._id, token: token, expires_in: date })
    }
}

/*
 *end signup with google strategy
 */

/*
 * begin signup with telegram strategy
 */

exports.telegramSignup = async (req, res) => {
    try {
        var param = {
            access_token: req.user.token,
            expires_in: req.user.expires_in,
            token_type: 'bearer',
            scope: 'user',
        }
        res.redirect(
            process.env.BASED_URL + '/auth/login?token=' + JSON.stringify(param)
        )
    } catch (e) {
        console.log(e)
    }
}

exports.signup_telegram_function = async (req, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne({ idOnSn3: profile.id })
    if (user) {
        return cb('account_already_used&idSn=' + user.idSn)
    } else {
        let createdUser = createUser(
            1,
            5,
            req.body.lang,
            req.body.newsLetter,
            profile.photo_url,
            profile.email,
            '',
            'idOnSn3',
            profile.id,
            profile.first_name,
            profile.last_name
        )
        let user = await new User(createdUser).save()
        createdUser._id = user._id
        let token = generateAccessToken(createdUser)
        return cb(null, { id: createdUser._id, token: token, expires_in: date })
    }
}
/*
 *end signup with telegram strategy
 */

/* 
begin signin with telegram strategy
*/
exports.signin_telegram_function = async (req, profile, cb) => {
    await handleSocialMediaSignin({ idOnSn3: profile.id }, cb)
}
exports.telegramConnection = (req, res) => {
    try {
        var param = {
            access_token: req.user.token,
            expires_in: req.user.expires_in,
            token_type: 'bearer',
            scope: 'user',
        }
        res.redirect(
            process.env.BASED_URL + '/auth/login?token=' + JSON.stringify(param)
        )
    } catch (e) {
        console.log(e)
    }
}
/*
 *end signin with telegram strategy
 */

/*
 * begin connect account with facebook strategy
 */
exports.linkFacebookAccount = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    let state = req.query.state.split('|')
    let user_id = +state[0]
    let user = await User.findOne({
        idOnSn: profile._json.token_for_business,
    })
    if (user) {
        return cb(null, profile, {
            status: false,
            message: 'account exist',
        })
    } else {
        await User.updateOne(
            { _id: user_id },
            { $set: { idOnSn: profile._json.token_for_business } }
        )
        return cb(null, profile, {
            status: true,
            message: 'account_linked_with success',
        })
    }
}
/*
 * end connect account with facebook strategy
 */

/*
 * begin connect account with google strategy
 */
exports.linkGoogleAccount = async (
    req,
    accessToken,
    refreshToken,
    profile,
    done
) => {
    let state = req.query.state.split('|')
    let user_id = +state[0]
    let userExist = await User.findOne({ idOnSn2: profile.id })
    if (userExist) {
        return done(null, profile, {
            status: false,
            message: 'account exist',
        })
    } else {
        await User.updateOne(
            { _id: user_id },
            { $set: { idOnSn2: profile.id } }
        )
        return done(null, profile, {
            status: true,
            message: 'account_linked_with success',
        })
    }
}
/*
 * end connect account with google strategy
 */

/*
 * begin connect account with telegram strategy
 */
exports.connectTelegramAccount = async (req, res) => {
    try {
        if (req.params.redirect == 'security') {
            url = '/home/settings/security'
        } else {
            url = '/social-registration/monetize-telegram'
        }
        res.redirect(
            process.env.BASED_URL + url + '?message=' + req.authInfo.message
        )
    } catch (e) {
        console.log(e)
    }
}
exports.telegram_connect_function = async (req, profile, cb) => {
    let user_id = +req.params.idUser
    let user = await User.findOne({ idOnSn3: profile.id })
    if (user) {
        return cb(null, profile, { message: 'account exist' })
    } else {
        await User.updateOne(
            { _id: user_id },
            { $set: { idOnSn3: profile.id } }
        )
        return cb(null, profile, {
            status: true,
            message: 'account_linked_with success',
        })
    }
}
/*
 * end connect account with telegram strategy
 */

/*
 * begin add facebook channel strategy
 */
exports.addFacebookChannel = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    let longToken = accessToken
    let UserId = +req.query.state.split('|')[0]
    let isInsta = false
    let fbProfile = await FbProfile.findOne({ UserId })
    if (fbProfile) {
        await FbProfile.updateOne(
            { UserId },
            { $set: { accessToken: longToken } }
        )
    } else {
        ;[profile.accessToken, profile.UserId] = [longToken, UserId]
        await FbProfile.create(profile)
    }
    let message = await getFacebookPages(UserId, accessToken, isInsta)
    return cb(null, { id: UserId, token: accessToken }, { message })
}
/*
 * end add facebook channel strategy
 */

/*
 * begin add twitter channel strategy
 */
exports.addTwitterChannel = async (
    req,
    accessToken,
    tokenSecret,
    profile,
    cb
) => {
    let user_id = +req.session.state.split('|')[0]

    var tweet = new Twitter({
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: accessToken,
        access_token_secret: tokenSecret,
    })
    var res = await tweet.get('account/verify_credentials', {
        include_email: true,
    })
    var twitterProfile = await TwitterProfile.findOne({
        $and: [{ UserId: user_id }, { twitter_id: res.id }],
    })
    if (twitterProfile) {
        return cb(null, profile, {
            status: false,
            message: 'account exist',
        })
    } else {
        profile.access_token_key = accessToken
        profile.access_token_secret = tokenSecret
        profile.UserId = user_id
        profile.username = res.screen_name
        profile.subscibers = res.followers_count
        profile.twitter_id = res.id

        await TwitterProfile.create(profile)
    }
    return cb(null, { id: user_id })
}
/*
 * end add twitter channel strategy
 */

/*
 * begin add linkedin channel strategy
 */
exports.addlinkedinChannel = async (
    req,
    accessToken,
    refreshToken,
    profile,
    done
) => {
    let userId = Number(req.query.state.split('|')[0])
    let redirect = req.query.state.split('|')[1]
    let linkedinId = profile.id
    const linkedinData = config.linkedinPages(accessToken)
    let linkedinPages = await rp(linkedinData)
    var linkedinProfile = { accessToken, userId, linkedinId }
    linkedinProfile.pages = []
    if (linkedinPages.elements.length) {
        for (let i = 0; i < linkedinPages.elements.length; i++) {
            elem = linkedinPages.elements[i]
            if (elem.state !== 'REVOKED') {
                elem.subscribers = await linkedinAbos(
                    linkedinProfile,
                    elem.organization
                )
                elem.photo = linkedinPages.elements[i]['organization~'].logoV2
                    ? linkedinPages.elements[i]['organization~'].logoV2[
                          'original~'
                      ].elements[0].identifiers[0].identifier
                    : ''
                delete elem['organization~'].logoV2
                linkedinProfile.pages.push(elem)
            }
        }
    }
    if (!linkedinProfile.pages.length)
        return res.redirect(
            process.env.BASED_URL +
                redirect +
                '?message=channel obligatoire&sn=linkd'
        )

    await LinkedinProfile.updateOne(
        { userId },
        { $set: linkedinProfile },
        { upsert: true }
    )
    return done(null, profile, {
        status: true,
        message: 'account_linked_with_success',
    })
}
/*
 * end add linkedin channel strategy
 */

/*
 * begin add youtube channel strategy
 */
exports.addyoutubeChannel = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    var user_id = +req.query.state.split('|')[0]
    var res = await rp({
        uri: 'https://www.googleapis.com/youtube/v3/channels',
        qs: { access_token: accessToken, part: 'snippet', mine: true },
        json: true,
    })
    if (res.pageInfo.totalResults == 0) {
        return cb(null, profile, {
            message: 'channel obligatoire',
        })
    }
    var channelId = res.items[0].id
    var channelGoogle = await GoogleProfile.find({
        channelId: channelId,
        UserId: user_id,
    })
    if (channelGoogle.length > 0) {
        return cb(null, profile, {
            message: 'account exist',
        })
    } else {
        var result = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/channels',
            qs: {
                id: channelId,
                key: process.env.GDA_TAP_API_KEY,
                part: 'statistics,snippet',
            },
            json: true,
        })
        user_google = {}
        user_google.refreshToken = refreshToken
        user_google.accessToken = accessToken
        user_google.UserId = user_id
        user_google.google_id = profile.id
        user_google.channelTitle = result.items[0].snippet.title
        user_google.channelImage = result.items[0].snippet.thumbnails
        user_google.channelStatistics = result.items[0].statistics
        user_google.channelId = channelId
        await GoogleProfile.create(user_google)

        return cb(null, { id: user_id })
    }
}
/*
 * end add linkedin channel strategy
 */
module.exports.verifyAuth = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]
    if (!token) {
        return responseHandler.makeResponseError(res, 401, 'token required')
    }
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
        if (err) return res.json(err)
        let _id = user?._id ? user?._id : user?._doc._id
        newUser = await User.findOne({ _id })
        req.user = newUser
        console.log(err)
        next()
    })
}

module.exports.createUser = createUser
