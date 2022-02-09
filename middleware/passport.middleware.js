const fs = require('fs')
var handlebars = require('handlebars')
var passport = require('passport')
var emailStrategy = require('passport-local').Strategy
var TelegramStrategy = require('passport-telegram-official').TelegramStrategy
var Twitter = require('twitter')
var LocalStrategy = require('passport-local').Strategy
var Long = require('mongodb').Long
const crypto = require('crypto')
const hasha = require('hasha')
ObjectId = require('mongodb').ObjectID
var rp = require('request-promise')
const jwt = require('jsonwebtoken')
var User = require('../model/user.model')

var requirement = require('../helpers/utils')
var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            throw err
            callback(err)
        } else {
            callback(null, html)
        }
    })
}
var synfonyHash = function (pass) {
    var salted = pass + '{' + app.config.symfonySalt + '}'

    var buff = hasha(salted, { encoding: 'buffer' })
    var saltBuff = Buffer.from(salted)
    var arr = []

    for (var i = 1; i < 5000; i++) {
        arr = [buff, saltBuff]
        buff = hasha(Buffer.concat(arr), {
            algorithm: 'sha512',
            encoding: 'buffer',
        })
    }

    const base64 = buff.toString('base64')
    return base64
}
var express = require('express')
var app = express()
var connection
;(connection = async function () {
    app = await require('../conf/config')(app)
    app = await require('../conf/const')(app)
    app = await require('../db/db')(app)
    app = await requirement.connection()
    app = await require('../web3/provider')(app)
    app = await require('../manager/account')(app)
    app = await require('../manager/i18n')(app)
    app = await require('../manager/oracle')(app)
    app = await require('../web3/oracle')(app)
})()
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
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport(app.config.mailerOptions)
passport.serializeUser(function (user, cb) {
    cb(null, user)
})

passport.deserializeUser(async function (id, cb) {
    var user = await app.db.sn_user().findOne({ _id: Long.fromNumber(id) })
    cb(null, user)
})

const handleSocialMediaSignin = async (query, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await app.db.sn_user().findOne(query)
    if (user) {
        if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`
            return cb({ error: true, message, blockedDate: user.date_locked })
        }
        let userAuth = app.cloneUser(user)
        let token = app.generateAccessToken(userAuth)
        return cb(null, { id: user._id, token, expires_in: date })
    } else {
        return cb('Register First')
    }
}

let createUser = (
    enabled,
    idSn,
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
    if (lastName) userObject.firstName = lastName
    if (password) userObject.password = password
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
            var user = await app.db
                .sn_user()
                .findOne({ email: username.toLowerCase() })
            if (user) {
                if (user.password == synfonyHash(password)) {
                    app.account.sysLog(
                        'authentification',
                        req.addressIp,
                        `valid ${username}`
                    )
                    let validAuth = await app.account.isBlocked(user, true)
                    if (!validAuth.res && validAuth.auth == true) {
                        let userAuth = app.cloneUser(user)
                        let token = app.generateAccessToken(userAuth)
                        await app.db
                            .sn_user()
                            .updateOne(
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
                    let validAuth = await app.account.isBlocked(user, false)
                    app.account.sysLog(
                        'authentification',
                        req.addressIp,
                        `invalid ${username} ${password}`
                    )
                    if (validAuth.res)
                        return done(null, false, {
                            error: true,
                            message: 'account_locked',
                            blockedDate: validAuth.blockedDate,
                        })
                    return done(null, false, {
                        error: true,
                        message: 'invalid_credentials',
                    })
                }
            } else {
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
                return res.end(JSON.stringify(err))
            }

            if (!user) {
                return res.end(JSON.stringify(info))
            }

            req.logIn(user, function (err) {
                req.session.user = user.id
                var param = {
                    access_token: user.token,
                    expires_in: user.expires_in,
                    token_type: 'bearer',
                    scope: 'user',
                }
                return res.end(JSON.stringify(param))
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
        var user = await User.findOne({ email: username.toLowerCase() })
        if (user) {
            return done(null, false, {
                error: true,
                message: 'account_already_used',
            })
        } else {
            let createdUser = createUser(
                0,
                0,
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
            let user = new User(createdUser).save()
            let token = app.generateAccessToken(createdUser)
            const lang = req.query.lang || 'en'
            const code = await app.account.updateAndGenerateCode(
                createdUser._id,
                'validation'
            )
            app.i18n.configureTranslation(lang)
            readHTMLFile(
                __dirname +
                    '/../public/emailtemplate/email_validated_code.html',
                (err, html) => {
                    var template = handlebars.compile(html)
                    var replacements = {
                        satt_faq: app.config.Satt_faq,
                        satt_url: app.config.basedURl,
                        code,
                        imgUrl: app.config.baseEmailImgURl,
                    }
                    var htmlToSend = template(replacements)
                    var mailOptions = {
                        from: app.config.mailSender,
                        to: createdUser.email.toLowerCase(),
                        subject: 'Satt wallet activation',
                        html: htmlToSend,
                    }
                    transporter.sendMail(mailOptions, (error, info) => {
                        if (error) {
                            app.account.sysLogError(error)
                        } else {
                            app.account.log(
                                'Email sent: ',
                                createdUser.email.toLowerCase()
                            )
                        }
                    })
                }
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
            return res.end(JSON.stringify(err))
        }

        if (!user) {
            return res.end(JSON.stringify(info))
        }

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
    var user = await app.db
        .sn_user()
        .findOne({ idOnSn: profile._json.token_for_business })
    if (user) {
        return cb('account_already_used&idSn=' + user.idSn)
    } else {
        /*var mongodate = new Date().toISOString();
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var id = Long.fromNumber(await app.account.handleId())*/
        let createdUser = createUser(
            1,
            Long.fromNumber(await app.account.handleId()),
            1,
            req.body.newsLetter,
            profile.photos.length ? profile.photos[0].value : false,
            profile.name,
            profile._json.email,
            'idOnSn',
            profile._json.token_for_business,
            profile.first_name,
            profile.displayName
        )
        // let insert = await app.db.sn_user().insertOne({
        //     _id: id,
        //     idOnSn: profile._json.token_for_business,
        //     email: profile._json.email,
        //     username: profile.name,
        //     firstName: profile.first_name,
        //     lastName: profile.displayName,
        //     created: mongodate,
        //     onBoarding: false,
        //     account_locked: false,
        //     newsLetter: req.body.newsLetter,
        //     failed_count: 0,
        //     updated: mongodate,
        //     idSn: 1,
        //     locale: "en",
        //     enabled: 1,
        //     confirmation_token: code,
        //     picLink: profile.photos.length ? profile.photos[0].value : false,
        //     userSatt: true
        // });
        let insert = await app.db.sn_user().insertOne(createdUser)
        let token = app.generateAccessToken(insert.ops[0])
        return cb(null, { id: id, token: token, expires_in: date })
    }
}
/*
 *end signup with facebook strategy
 */

/*
 * begin signup with google strategy
 */

exports.googleAuthSignup = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var users = await app.db
        .sn_user()
        .find({
            $or: [{ idOnSn2: profile.id }, { email: profile._json.email }],
        })
        .toArray()
    if (users.length) {
        return cb('account_already_used&idSn=' + users[0].idSn)
    } else {
        /*var mongodate = new Date().toISOString();
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');*/
        let createdUser = createUser(
            1,
            Long.fromNumber(await app.account.handleId()),
            2,
            req.body.newsLetter,
            profile.photos.length ? profile.photos[0].value : false,
            profile.displayName,
            profile.emails.length ? profile.emails[0].value : false,
            'idOnSn2',
            profile.id,
            profile.name.givenName,
            profile.name.familyName
        )
        // var insert = await app.db.sn_user().insertOne({
        //     _id: Long.fromNumber(await app.account.handleId()),
        //     idOnSn2: profile.id,
        //     email: profile.emails.length ? profile.emails[0].value : false,
        //     username: profile.displayName,
        //     firstName: profile.name.givenName,
        //     lastName: profile.name.familyName,
        //     created: mongodate,
        //     updated: mongodate,
        //     idSn: 2,
        //     newsLetter: req.body.newsLetter,
        //     onBoarding: false,
        //     account_locked: false,
        //     failed_count: 0,
        //     enabled: 1,
        //     locale: profile._json.locale,
        //     confirmation_token: code,
        //     userSatt: true,
        //     picLink: profile.photos.length ? profile.photos[0].value : false
        // });
        let insert = await app.db.sn_user().insertOne(createdUser)
        var users = insert.ops
        let token = app.generateAccessToken(users[0])
        return cb(null, { id: profile.id, token: token, expires_in: date })
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
            app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
        )
    } catch (e) {
        console.log(e)
    }
}

exports.signup_telegram_function = async (req, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray()
    if (users.length) {
        return cb('account_already_used&idSn=' + users[0].idSn)
    } else {
        // var mongodate = new Date().toISOString();
        // var buff2 = Buffer.alloc(32);
        // var code = crypto.randomFillSync(buff2).toString('hex');
        let createdUser = createUser(
            1,
            Long.fromNumber(await app.account.handleId()),
            5,
            req.body.newsLetter,
            profile.photo_url,
            profile.email,
            '',
            'idOnSn3',
            profile.id,
            profile.first_name,
            profile.last_name
        )
        // var insert = await app.db.sn_user().insertOne({
        //     _id: Long.fromNumber(await app.account.handleId()),
        //     idOnSn3: profile.id,
        //     username: profile.email,
        //     firstName: profile.first_name,
        //     lastName: profile.last_name,
        //     name: profile.username,
        //     newsLetter: req.body.newsLetter ?? false,
        //     picLink: profile.photo_url,
        //     created: mongodate,
        //     onBoarding: false,
        //     account_locked: false,
        //     failed_count: 0,
        //     updated: mongodate,
        //     idSn: 5,
        //     locale: "en",
        //     confirmation_token: code,
        //     enabled: 1,
        //     userSatt: true
        // });
        let insert = await app.db.sn_user().insertOne(createdUser)
        var users = insert.ops
        let token = app.generateAccessToken(users[0])
        return cb(null, { id: users[0]._id, token: token, expires_in: date })
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
            app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
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
    let users = await app.db
        .sn_user()
        .find({
            $or: [
                { idOnSn: profile._json.token_for_business },
                { email: profile._json.email },
            ],
        })
        .toArray()
    if (users.length) {
        cb(null, profile, {
            status: false,
            message: 'account exist',
        })
    } else {
        await app.db.sn_user().updateOne(
            { _id: user_id },
            {
                $set: {
                    idOnSn: profile._json.token_for_business,
                    email: profile._json.email,
                },
            }
        )
        cb(null, profile, {
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
    let userExist = await app.db
        .sn_user()
        .find({ $or: [{ idOnSn2: profile.id }] })
        .toArray()
    if (userExist.length) {
        done(null, profile, {
            status: false,
            message: 'account exist',
        })
    } else {
        await app.db.sn_user().updateOne(
            { _id: user_id },
            {
                $set: {
                    idOnSn2: profile.id,
                    email: profile.emails[0].value,
                },
            }
        )
        done(null, profile, {
            status: true,
            message: 'account_linked_with success',
        }) //(null, false, {message: 'account_invalide'});
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
            app.config.basedURl + url + '?message=' + req.authInfo.message
        )
    } catch (e) {
        console.log(e)
    }
}
exports.telegram_connect_function = async (req, profile, cb) => {
    let user_id = +req.params.idUser
    let users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray()
    if (users.length) {
        cb(null, profile, { message: 'account exist' })
    } else {
        await app.db
            .sn_user()
            .updateOne({ _id: user_id }, { $set: { idOnSn3: profile.id } })
        cb(null, profile, {
            status: true,
            message: 'account_linked_with success',
        }) //(null, false, {message: 'account_invalide'});
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
    let fbProfile = await app.db.fbProfile().findOne({ UserId })
    let message = await app.account.getFacebookPages(
        UserId,
        accessToken,
        isInsta
    )
    if (fbProfile) {
        await app.db
            .fbProfile()
            .updateOne({ UserId }, { $set: { accessToken: longToken } })
    } else {
        ;[profile.accessToken, profile.UserId] = [longToken, UserId]
        await app.db.fbProfile().insertOne(profile)
    }
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
        consumer_key: app.config.twitter.consumer_key,
        consumer_secret: app.config.twitter.consumer_secret,
        access_token_key: accessToken,
        access_token_secret: tokenSecret,
    })
    var res = await tweet.get('account/verify_credentials', {
        include_email: true,
    })
    var twitterProfile = await app.db
        .twitterProfile()
        .findOne({ $and: [{ UserId: user_id }, { twitter_id: res.id }] })
    if (twitterProfile) {
        cb(null, profile, {
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

        var res_ins = await app.db.twitterProfile().insertOne(profile)
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
    userId = Number(req.query.state.split('|')[0])
    linkedinId = profile.id
    const linkedinData = {
        url: 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(*, organization~(localizedName,logoV2(original~:playableStreams))))',
        method: 'GET',
        headers: {
            Authorization: 'Bearer ' + accessToken,
            'X-Restli-Protocol-Version': '2.0.0',
        },
        json: true,
    }
    let redirect = req.query.state.split('|')[1]
    let linkedinPages = await rp(linkedinData)

    var linkedinProfile = { accessToken, userId, linkedinId }
    linkedinProfile.pages = []
    if (linkedinPages.elements.length) {
        for (let i = 0; i < linkedinPages.elements.length; i++) {
            elem = linkedinPages.elements[i]
            if (elem.state !== 'REVOKED') {
                elem.subscribers = await app.oracle.linkedinAbos(
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
            app.config.basedURl +
                redirect +
                '?message=channel obligatoire&sn=linkd'
        )
    await app.db
        .linkedinProfile()
        .updateOne({ userId }, { $set: linkedinProfile }, { upsert: true })
    done(null, profile, {
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
    console.log('result', res)
    if (res.pageInfo.totalResults == 0) {
        cb(null, profile, {
            message: 'channel obligatoire',
        })
    }
    var channelId = res.items[0].id
    var channelGoogle = await app.db
        .googleProfile()
        .find({ channelId: channelId, UserId: user_id })
        .toArray()
    if (channelGoogle.length > 0) {
        cb(null, profile, {
            message: 'account exist',
        })
    } else {
        var result = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/channels',
            qs: {
                id: channelId,
                key: app.config.gdataApiKey,
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
        await app.db.googleProfile().insertOne(user_google)

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
        return res.end(JSON.stringify({ error: 'token required' }))
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) return res.json(err)

        req.user = user

        next()
    })
}
