var passport = require('passport')
var emailStrategy = require('passport-local').Strategy
var Twitter = require('twitter')
const mongoose = require('mongoose')
const { Captcha } = require('../model/index')
var LocalStrategy = require('passport-local').Strategy
var Long = require('mongodb').Long
const crypto = require('crypto')
var rp = require('axios');
const jwt = require('jsonwebtoken')
var User = require('../model/user.model')
var FbProfile = require('../model/fbProfile.model')
var TwitterProfile = require('../model/twitterProfile.model')
var GoogleProfile = require('../model/googleProfile.model')
var LinkedinProfile = require('../model/linkedinProfile.model')
var TikTokProfile = require('../model/tikTokProfile.model')
const { responseHandler } = require('../helpers/response-handler')
const Tweeter = require('twitter-lite')
const { config, twitterAuth } = require('../conf/config')

const client = new Tweeter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
})

const twitterOauth = (oauth_verifier, oauth_token) => {
    return new Promise(async (resolve, reject) => {
        try {
            const twitterAccount = await client.getAccessToken({
                oauth_verifier,
                oauth_token,
            })
            resolve(twitterAccount)
        } catch (e) {
            reject({ message: e.message })
        }
    })
}

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
const {
    getFacebookPages,
    linkedinAbos,
    tiktokAbos,
} = require('../manager/oracles')
const { Wallet } = require('../model')
const { profile } = require('winston')
const { updateStatforUser } = require('../helpers/common')

try {
    app.use(
        session({
            secret: process.env.SECRET_SESSION,
            resave: false,
            saveUninitialized: true,
            httpOnly: true, // dont let browser javascript access cookie ever
            secure: true, // only use cookie over https
            ephemeral: true, // delete this cookie while browser close
        })
    ) // session secret
    app.use(passport.session())
} catch (e) {}
passport.serializeUser(function (user, cb) {
    cb(null, user)
})

passport.deserializeUser(async function (id, cb) {
    var user = await User.findOne({ _id: Long.fromNumber(id) })
    cb(null, user)
})

const handleSocialMediaSignin = async (query, cb) => {
    try {
        var date = Math.floor(Date.now() / 1000) + 86400
        var user = await User.findOne(query).lean()
        if(!user) return cb('Register First')

            var validAuth = await isBlocked(user, true);

            const response = !validAuth.res && validAuth.auth
            ? { id: user._id, token: generateAccessToken({ _id: user._id }), expires_in: date }
            : {
            error: true,
            message: `account_locked:${user.date_locked}`,
            blockedDate: user.date_locked,
            };

            if (response.error) {
            return cb(response);
          }
      
          await User.updateOne(
            { _id: Long.fromNumber(user._id) },
            { $set: { failed_count: 0 } }
          );
      
          cb(null, response);

    } catch (err) {
        console.error('handleSocialMediaSignin', err)
    } finally {
        user &&
            !validAuth?.res &&
            validAuth?.auth == true &&
            (await updateStatforUser(user._id))
    }
}


const createUser = (
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
  ) => ({
    password: password ?? synfonyHash(crypto.randomUUID()),
    enabled,
    idSn,
    newsLetter: newsLetter ?? false,
    ...(picLink && { picLink }),
    username: username || '',
    email,
    ...(idOnSn && socialId && { [idOnSn]: socialId }),
    ...(firstName && { firstName }),
    ...(lang && { lang }),
    ...(lastName && { lastName })
  });
/*
 * begin signin with email and password
 */

const signinWithEmail = async (
    req,
    username,
    password,
    done,
    fromSignup = false
) => {
    try {
        var date = Math.floor(Date.now() / 1000) + 86400
        var user = await User.findOne({ email: username.toLowerCase() }).lean()
        if (!user) {
            return done(null, false, {
              error: true,
              message: 'user not found',
            });
          }
          
        const isPasswordMatch = user.password === synfonyHash(password);
        var validAuth = await isBlocked(user, isPasswordMatch);

        if (!isPasswordMatch) {
            if (validAuth.res) {
              return done(null, false, {
                error: true,
                message: 'account_locked',
                blockedDate: validAuth.blockedDate,
              });
            }
      
            return done(null, false, {
              error: true,
              message: (!fromSignup && 'invalid_credentials') ||
                (user.idSn === 2 && 'account_already_used') ||
                'account_exists',
              ...(!fromSignup && { blockedDate: validAuth.blockedDate }),
            });
          }
      
          if (!validAuth.res && validAuth.auth === true) {
            const token = generateAccessToken({ _id: user._id });
      
            await User.updateOne(
              { _id: Long.fromNumber(user._id) },
              { $set: { failed_count: 0 } }
            );
      
            return done(null, {
              id: user._id,
              token,
              expires_in: date,
              noredirect: req.body.noredirect,
              loggedIn: true,
            });
          }
      
          return done(null, false, {
            error: true,
            message: 'account_locked',
            blockedDate: validAuth.blockedDate,
          });
    } catch (err) {
        console.error('singin catch', err)
    } finally {
        user &&
            !validAuth?.res &&
            validAuth?.auth == true &&
            (await updateStatforUser(user._id))
    }
}
passport.use(
    'signinEmailStrategy',
    new emailStrategy(
        { passReqToCallback: true },
        async (req, username, password, done) => {
            await signinWithEmail(req, username, password, done)
        }
    )
)
exports.emailConnection = async (req, res, next) => {
    // Verify captcha 
    let _id = req.body._id
        let position = +req.body.position

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return responseHandler.makeResponseError(
                res,
                400,
                'Please provide a valid id!'
            )
        }
        let captcha = await Captcha.findOne({
            $and: [
                { _id },
                { position: { $gte: position - 5, $lte: position + 5 } },
            ],
        })
        if (captcha) {
            /*return responseHandler.makeResponseData(
                res,
                200,
                'success',
                captcha
            )*/
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
                    req.logIn(user,  (err) => {
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

        } else {
            return responseHandler.makeResponseError(
                res,
                401,
                'wrong captcha',
                false
            )
        }



    
}
/*
 * end signin with email and password
 */

/*
 * begin satt wallet connect
 */
passport.use(
    'sattConnectStrategy',
    new emailStrategy(
        { passReqToCallback: true },
        async (req, username, password, done) => {
            var date = Math.floor(Date.now() / 1000) + 86400
            var user = await User.findOne({
                email: username.toLowerCase(),
            }).lean()
            if (user) {
                if (user.password === synfonyHash(password)) {
                    let validAuth = await isBlocked(user, true)
                    if (!validAuth.res && validAuth.auth === true) {
                        //let userAuth = cloneUser(user)
                        let token = generateAccessToken({ _id: user._id })
                        await User.updateOne(
                            { _id: Long.fromNumber(user._id) },
                            { $set: { failed_count: 0 } }
                        )
                        if (user.hasWallet === true) {
                            let account = await Wallet.findOne({
                                UserId: user._id,
                            })
                            let address = '0x' + account.keystore.address
                            let keystore = account.keystore
                            return done(null, {
                                id: user._id,
                                token,
                                expires_in: date,
                                address,
                                keystore,
                                noredirect: req.body.noredirect,
                            })
                        } else {
                            return done(null, false, {
                                error: true,
                                message: 'Wallet not found',
                            })
                        }
                    } else {
                        return done(null, false, {
                            error: true,
                            message: 'account_locked',
                            blockedDate: validAuth.blockedDate,
                        })
                    }
                } else {
                    let validAuth = await isBlocked(user, false)
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
                return done(null, false, {
                    error: true,
                    message: 'user not found',
                })
            }
        }
    )
)
exports.sattConnect = async (req, res, next) => {
    passport.authenticate(
        'sattConnectStrategy',
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
                    address: user.address,
                    keystore: user.keystore,
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
 * end satt wallet connect
 */

/*
 * begin signin with facebook strategy
 */

/*
 * end signin with email and password
 */

/*
 * begin signin with facebook strategy
 */
exports.facebookAuthSignin = async (
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
        let user = await User.findOne({ email: username.toLowerCase() }).lean()
        if (user) {
            return await signinWithEmail(req, username, password, done, true)
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
            let token = generateAccessToken({ _id: user._id })
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
                loggedIn: user.loggedIn,
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
    profile,
    cb
) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne(
        { idOnSn: profile._json.token_for_business },
        { idOnSn: 1 }
    ).lean()
    if (user) {
        await handleSocialMediaSignin(
            { idOnSn: profile._json.token_for_business },
            cb
        )
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
        let token = generateAccessToken({ _id: user._id })
        return cb(null, { id: createdUser._id, token: token, expires_in: date })
    }
}
/*
 *end signup with facebook strategy
 */

exports.googleAuthSignup = async (
    req,
    profile,
    cb
) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne({ idOnSn2: profile.id }).lean()
    let wallet = user && (await Wallet.findOne({ UserId: user._id }).lean())

    if (user && wallet) {
        // return cb('account_already_used&idSn=' + user.idSn)
        await handleSocialMediaSignin({ idOnSn2: profile.id }, cb)
    } else {

        let createdUser = createUser(
            1,
            2,
            req.body.lang,
            req.body.newsLetter,
            profile.photos.length ? profile.photos[0].value : false,
            profile.displayName,
            profile.emails[0].value,
            'idOnSn2',
            profile.id,
            profile.name.givenName,
            profile.name.familyName
        )
        
        let user = await new User(createdUser).save()
        createdUser._id = user._id
        let token = generateAccessToken({ _id: createdUser._id })
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
    } catch (e) {}
}

exports.signup_telegram_function = async (req, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400
    var user = await User.findOne({ idOnSn3: profile.id })
    if (user) {
        // return cb('account_already_used&idSn=' + user.idSn)
        // let token = generateAccessToken(user)
        // return cb(null, { id: user._id, token: token, expires_in: date })
        await handleSocialMediaSignin({ idOnSn3: profile.id }, cb)
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
        let token = generateAccessToken({_id : user._id})
        console.log('create user telegram')
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
            access_token: req.user?.token,
            expires_in: req.user?.expires_in,
            token_type: 'bearer',
            scope: 'user',
        }
        res.redirect(
            process.env.BASED_URL + '/auth/login?token=' + JSON.stringify(param)
        )
    } catch (e) {
        console.error(e)
    }
}
/*
 *end signin with telegram strategy
 */


/*
 * begin connect account with facebook strategy
 */
 exports.linkSocialAccount = async ({ req, profile, done, token_field, id_field }) =>{
    let state = req.query.state.split('|');
    let user_id = +state[0];
    let response = { status: false, message: 'account exist' };
    let id = id_field ? profile._json[id_field] : profile.id;

    if (!(await User.exists({ [token_field]: id }))) {
        await User.updateOne({ _id: user_id }, { $set: { [token_field]: id, completed: true } });
        response = { status: true, message: 'account_linked_with success' };
    }

    return done(null, profile, response);
}

/*
 * end connect account with google strategy
 */

/*
 * begin connect account with telegram strategy
 */
exports.connectTelegramAccount = async (req, res) => {
    try {
        url = '/home/settings/security'

        res.redirect(
            process.env.BASED_URL + url + '?message=' + req.authInfo.message
        )
    } catch (e) {}
}
exports.telegram_connect_function = async (req, profile, cb) => {
    let user_id = +req.params.idUser
   
    if (await User.exists({ idOnSn3: profile.id })) {
        return cb(null, profile, { message: 'account exist' })
    } else {
        await User.updateOne(
            { _id: user_id },
        
            { $set: { idOnSn3: profile.id, completed: true } }
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
    profile,
    cb
) => {
    let longToken = accessToken
    let UserId = +req.query.state.split('|')[0]
    let isInsta = false

    if (await FbProfile.exists({ UserId })) {
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
exports.addTwitterChannel = async (req, res) => {
    let user_id = +req.query.u
    let redirect = req.query.r
    const { oauth_verifier, oauth_token } = req.query
    var {oauth_token : accountToken,oauth_token_secret} = await twitterOauth(oauth_verifier, oauth_token)

    const userAuth = new Twitter(
        twitterAuth(
            accountToken,
            oauth_token_secret
        )
    )
     const { id, id_str, screen_name, name, followers_count, profile_image_url } = await userAuth.get('account/verify_credentials', {
        include_email: true,
    })

    if (await TwitterProfile.exists({UserId: user_id ,  twitter_id: id })) {
        return res.redirect(
            process.env.BASED_URL +
                redirect +
                '?message=' +
                'account exist' +
                '&sn=twitter'
        )
    } else {
        let profile = { _json: {} }
        profile.access_token_key = accountToken
        profile.access_token_secret = oauth_token_secret
        profile.UserId = user_id
        profile.username = screen_name
        profile.subscibers = followers_count
        profile.twitter_id = id
        profile.id = id_str
        profile.displayName = name
        profile.photos = [{ value: profile_image_url }]
        profile._json.followers_count = followers_count
        await TwitterProfile.create(profile)
    }
    // return cb(null, { id: user_id })
    res.redirect(
        process.env.BASED_URL +
            redirect +
            '?message=' +
            'account_linked_with_success' +
            '&sn=twitter'
    )
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

    let profileData = await LinkedinProfile.findOne({
        userId,
        linkedinId,
    }).lean()

    if (profileData) {
        return done(null, profile, {
            status: false,
            message: 'account exist',
        })
    }

    let linkedinPages = (await rp.get('https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(*, organization~(localizedName,logoV2(original~:playableStreams))))',{
        headers : {
            Authorization: 'Bearer ' + accessToken,
            'X-Restli-Protocol-Version': '2.0.0'
        }
    })).data
    
    var linkedinProfile = { accessToken, refreshToken, userId, linkedinId }
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
        return done(null, profile, {
            message: 'channel obligatoire',
        })

    // await LinkedinProfile.updateOne({ userId }, linkedinProfile, {
    //     upsert: true,
    // })
    await LinkedinProfile.create(linkedinProfile)
    return done(null, profile, {
        status: true,
        message: 'account_linked_with_success',
    })
}
/*
 * end add linkedin channel strategy
 */
/*
 * begin add facebook channel strategy
 */
exports.addTikTokChannel = async (
    req,
    accessToken,
    refreshToken,
    profile,
    cb
) => {
 
    let userId = +req.query.state.split('|')[0]

    try {
        let profileData = await TikTokProfile.findOne({
            $and: [
                { userId: userId },
                {
                    userTiktokId: profile.id,
                },
            ],
        }).lean()

        if (!profileData) {
            ;[
                profile.accessToken,
                profile.userId,
                profile.userTiktokId,
                profile.refreshToken,
            ] = [accessToken, userId, profile.id, refreshToken]
            
            if(profile.username[0]!== '@')
            {
                profile.username= '@'+profile.username
            }
            profile.followers = await tiktokAbos(userId, accessToken)
            await TikTokProfile.create(profile)
            return cb(null, profile, {
                status: true,
                message: 'account_linked_with_success',
            })
        } else {
            return cb(null, profile, {
                status: false,
                message: 'account exist',
            })
        }
    } catch (error) {
        console.error(error, 'addTikTokChannel')
    }
}

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

    var res = await rp.get('https://www.googleapis.com/youtube/v3/channels', {params :{
              access_token: accessToken,
            part: 'snippet,statistics',
            mine: true,
    }})
    if (res?.data?.pageInfo?.totalResults == 0) {
        return cb(null, profile, {
            message: 'channel obligatoire',
        })
    }
    var channelId = res.data?.items[0].id
    var channelGoogle = await GoogleProfile.findOne({
        channelId: channelId,
        UserId: user_id,
    })

    if (channelGoogle) {
        refreshToken &&
            (channelGoogle.refreshToken = refreshToken) &&
            (await channelGoogle.save())
        return cb(null, profile, {
            message: 'account exist',
        })
    } else {
        user_google = {}
        user_google.refreshToken = refreshToken
        user_google.accessToken = accessToken
        user_google.UserId = user_id
        user_google.google_id = profile.id
        user_google.channelTitle = res?.data?.items[0]?.snippet.title
        user_google.channelImage = res?.data?.items[0]?.snippet.thumbnails
        user_google.channelStatistics = res?.data?.items[0]?.statistics
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

        if (!newUser) {
            return responseHandler.makeResponseError(res, 401, 'Invalid token')
        }
        req.user = newUser
        next()
    })
}
module.exports.verifyAuthGetQuote = (req, res, next) => {
    const authHeader = req.headers['authorization']
    const token = authHeader?.split(' ')[1]
    if (!!token) {
        jwt.verify(
            token,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, user) => {
                if (err) return res.json(err)
                let _id = user?._id ? user?._id : user?._doc._id
                newUser = await User.findOne({ _id })

                if (!newUser) {
                    return responseHandler.makeResponseError(
                        res,
                        401,
                        'Invalid token'
                    )
                }
                req.user = newUser
                next()
            }
        )
    } else {
        req.user = { _id: Math.floor(1000 + Math.random() * 9000) + '' }
        next()
    }
}

module.exports.createUser = createUser
