var express = require('express')
var app = express()

const passport = require('passport')
var FbStrategy = require('passport-facebook').Strategy
var TwitterStrategy = require('passport-twitter').Strategy
let LinkedInStrategy = require('passport-linkedin-oauth2').Strategy
var GoogleStrategy = require('passport-google-oauth20').Strategy
var TelegramStrategy = require('passport-telegram-official').TelegramStrategy

var session = require('express-session')

let router = express.Router()
router.use(passport.initialize())

var Long = require('mongodb').Long

const { User } = require('../model/index')

passport.serializeUser(function (user, cb) {
    cb(null, user)
})

passport.deserializeUser(async function (id, cb) {
    var user = await User.find({ _id: Long.fromNumber(id) })
    cb(null, user)
})
try {
    router.use(
        session({
            secret: 'fe3fF4FFGTSCSHT57UI8I8',
            resave: true,
            saveUninitialized: true,
        })
    )
    router.use(passport.session())
} catch (e) {
    console.log(e)
}
const {
    support,
    FindUserLegalProfile,
    uploadUserLegal,
    addUserLegalProfile,
    UpdateIntersts,
    AddIntersts,
    UserInterstes,
    deleteLinkedinChannels,
    profilePicture,
    updateProfile,
    UserLegalProfile,
    deleteFacebookChannels,
    deleteGoogleChannels,
    account,
    socialAccounts,
    checkOnBoarding,
    requestMoney,
    notificationUpdate,
    changeNotificationsStatus,
    confrimChangeMail,
    getNotifications,
    changeEmail,
    verifyLink,
    addProfilePicture,
    uploadImageProfile,
} = require('../controllers/profile.controller')
const {
    addFacebookChannel,
    addTwitterChannel,
    addlinkedinChannel,
    addyoutubeChannel,
    verifyAuth,
    telegram_connect_function,
    connectTelegramAccount,
    linkGoogleAccount,
    linkFacebookAccount,
} = require('../middleware/passport.middleware')
const {
    facebookCredentials,
    twitterCredentials,
    linkedinCredentials,
    googleCredentials,
} = require('../conf/config')

/**
 * @swagger
 * /profile/account:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get account details.
 *     description: get account details.
 *     responses:
 *       "200":
 *          description: success, <br> {"code":"status code","message":"success","data":"user information"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "500":
 *          description: error:<br> server error
 */
router.get('/account', verifyAuth, account)

/**
 * @swagger
 * /profile/picture:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get user profile.
 *     description: return to user his picture.  <br> without access_token
 *     responses:
 *       "200":
 *          description: success, <br> {"code":"status code","message":"success","data":"success"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "404":
 *          description: error:<br> No file exists
 *       "500":
 *          description: error:<br> server error
 */

router.get('/picture', verifyAuth, profilePicture)

/**
 * @swagger
 * /profile/picture:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: add or update user profile picture.
 *     description: save user picture.  <br> with access_token
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format : base64
 *     responses:
 *       "200":
 *          description: success, <br> {"code":"status code","message":"saved"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "404":
 *          description: error:<br> Only images allowed
 *       "500":
 *          description: error:<br> server error
 */

router.post('/picture', verifyAuth, uploadImageProfile, addProfilePicture)
/**
 * @swagger
 * /profile/UpdateProfile:
 *   put:
 *     tags:
 *     - "profile"
 *     summary: update profile infos.
 *     description: user can update his profile infos <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               birthday:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *               locale:
 *                 type: string
 *               phone:
 *                 type: object
 *                 properties:
 *                    countryCode:
 *                      type: string
 *                    dialCode:
 *                      type: string
 *                    e164Number:
 *                      type: string
 *                    internationalNumber:
 *                      type: string
 *                    nationalNumber:
 *                       type: string
 *                    number:
 *                       type: string
 *                    zipCode:
 *                      type: string
 *
 *     responses:
 *       "201":
 *          description: profile updated, <br> {"code":"status code","message":"profile updated","data":"user information"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "406":
 *          description: error:<br> email already exists
 *       "500":
 *          description: error:<br> server error
 */
router.put('/UpdateProfile', verifyAuth, updateProfile)
/**
 * @swagger
 * /profile/UserLegal:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get user legal profile.
 *     description: return to user the legals picture.  <br> with access_token
 *     responses:
 *       "200":
 *          description: success, {"code":"status code","message":"success","data":{"legal":[{_id,length,chunkSize, uploadDate,filename,md5,contentType,DataUser:{$ref,$id,$db},idNode,type,validate}]}}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "500":
 *          description: error:<br> server error
 */

router.get('/UserLegal', verifyAuth, UserLegalProfile)

/**
 * @swagger
 * /profile/UserIntersts:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get user intersts.
 *     description: return to user the list of his intersts.  <br> with access_token
 *     responses:
 *       "200":
 *          description: success, {"code":"status code","message":"success","data":{"interests":[]}}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No interest found
 *       "500":
 *          description: error:<br> server error
 */

router.get('/UserIntersts', verifyAuth, UserInterstes)

/**
 * @swagger
 * /profile/AddUserIntersts:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: add user interests.
 *     description: user can add his intersts list <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               interests:
 *                 type: array+
 *                 items:
 *                  id:
 *                      type: string
 *
 *     responses:
 *       "201":
 *          description: success, {"code":"status code","message":"success","data":{"interests":[],"_id","userId"}}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "500":
 *          description: error:<br> Server error
 */
router.post('/AddUserIntersts', verifyAuth, UpdateIntersts)

/**
 * @swagger
 * /profile/UpdateUserIntersts:
 *   put:
 *     tags:
 *     - "profile"
 *     summary: update user interests.
 *     description: user can update his intersts list<br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               interests:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *
 *     responses:
 *       "201":
 *          description: success, {"code":"status code","message":"success","data":{"interests":[],"_id","userId"}}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "400":
 *          description: error:<br> updated failed
 *       "500":
 *          description: error:<br> server error
 */
router.put('/UpdateUserIntersts', verifyAuth, UpdateIntersts)

/**
 * @swagger
 * /profile/RemoveGoogleChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove google channels.
 *     description: allow user to delete all his google channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: deleted successfully, {"code":"status code","message":"deleted successfully"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No channel found
 *       "500":
 *          description: error:<br> server error
 */

router.delete('/RemoveGoogleChannels', verifyAuth, deleteGoogleChannels)

/**
 * @swagger
 * /profile/RemoveFacebookChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove facebook channels.
 *     description: allow user to delete all his facebook channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: deleted successfully, {"code":"status code","message":"deleted successfully"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No channel found
 *       "500":
 *          description: error:<br> server error
 */

router.delete('/RemoveFacebookChannels', verifyAuth, deleteFacebookChannels)

/**
 * @swagger
 * /profile/RemoveLinkedInChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove linkedin channels.
 *     description: allow user to delete all his linkedin channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: deleted successfully, {"code":"status code","message":"deleted successfully"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No channel found
 *       "500":
 *          description: error:<br> server error
 */

router.delete('/RemoveLinkedInChannels', verifyAuth, deleteLinkedinChannels)

/**
 * @swagger
 * /profile/socialAccounts:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get social accounts.
 *     description: fetch social media linked to user account .
 *     responses:
 *       "200":
 *          description: success, {"code":"status code","message":"success"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No channel found
 *       "500":
 *          description: error:<br> server error
 */
router.get('/socialAccounts', verifyAuth, socialAccounts)

/**
 * @swagger
 * /profile/addChannel/facebook/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/facebook/:idUser', (req, res, next) => {
    const state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('facebook_strategy_add_channel', {
        scope: [
            'email',
            'read_insights',
            'pages_show_list',
            'instagram_basic',
            'instagram_manage_insights',
            'pages_read_engagement',
        ],
        state,
    })(req, res, next)
})

passport.use(
    'facebook_strategy_add_channel',
    new FbStrategy(
        facebookCredentials('profile/callback/addChannel/facebook'),
        async (req, accessToken, refreshToken, profile, cb) => {
            addFacebookChannel(req, accessToken, refreshToken, profile, cb)
        }
    )
)

router.get(
    '/callback/addChannel/facebook',
    passport.authenticate('facebook_strategy_add_channel', {
        failureRedirect:
            process.env.BASED_URL +
            '/home/settings/social-networks?message=access-denied',
    }),
    async (req, response) => {
        try {
            redirect = req.query.state.split('|')[1]
            let message = req.authInfo.message
            response.redirect(
                process.env.BASED_URL +
                    redirect +
                    '?message=' +
                    message +
                    '&sn=fb'
            )
        } catch (e) {
            console.log(e)
        }
    }
)

/**
 * @swagger
 * /profile/addChannel/twitter/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: signin with twitter.
 *     description: user asked for signin with twitter, system redirect him to signin with twitter account <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/twitter/:idUser', (req, res, next) => {
    var state = req.params.idUser + '|' + req.query.redirect
    req.session.state = state
    passport.authenticate('twitter_strategy_add_channel', {
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent',
        state: state,
    })(req, res, next)
})

passport.use(
    'twitter_strategy_add_channel',
    new TwitterStrategy(
        twitterCredentials('profile/callback/addChannel/twitter'),
        async (req, accessToken, tokenSecret, profile, cb) => {
            addTwitterChannel(req, accessToken, tokenSecret, profile, cb)
        }
    )
)

router.get(
    '/callback/addChannel/twitter',
    passport.authenticate('twitter_strategy_add_channel', {
        failureRedirect:
            process.env.BASED_URL +
            '/home/settings/social-networks?message=access-denied',
    }),
    async function (req, response) {
        try {
            redirect = req.session.state.split('|')[1]
            if (req.authInfo.message) {
                message = req.authInfo.message
            } else {
                message = 'account_linked_with_success'
            }
            response.redirect(
                process.env.BASED_URL + redirect + '?message=' + message
            )
        } catch (e) {
            console.log(e)
        }
    }
)

/**
 * @swagger
 * /profile/addChannel/linkedin/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: signin with linkedin.
 *     description: user asked for signin with linkedin, system redirect him to signin with linkedin account <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/linkedin/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('linkedin_strategy_add_channel', { state })(
        req,
        res,
        next
    )
})

passport.use(
    'linkedin_strategy_add_channel',
    new LinkedInStrategy(
        linkedinCredentials('profile/callback/addChannel/linkedin'),
        async (req, accessToken, refreshToken, profile, done) => {
            addlinkedinChannel(req, accessToken, refreshToken, profile, done)
        }
    )
)

router.get(
    '/callback/addChannel/linkedin',
    passport.authenticate('linkedin_strategy_add_channel'),
    async (req, res) => {
        try {
            let redirect = req.query.state.split('|')[1]
            let message = req.authInfo.message
            res.redirect(
                process.env.BASED_URL +
                    redirect +
                    '?message=' +
                    message +
                    '&sn=linkd'
            )
        } catch (err) {
            res.end(
                '{"error":"' + (err.message ? err.message : err.error) + '"}'
            )
        }
    }
)

/**
 * @swagger
 * /profile/addChannel/youtube/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: signin with youtube.
 *     description: user asked for signin with youtube, system redirect him to signin with youtube account <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/youtube/:idUser', (req, res, next) => {
    var state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('youtube_strategy_add_channel', {
        scope: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/youtube.readonly',
        ],
        accessType: 'offline',
        prompt: 'consent',
        state: state,
    })(req, res, next)
})
passport.use(
    'youtube_strategy_add_channel',
    new GoogleStrategy(
        googleCredentials('profile/callback/addChannel/youtube'),
        async (req, accessToken, refreshToken, profile, cb) => {
            addyoutubeChannel(req, accessToken, refreshToken, profile, cb)
        }
    )
)

router.get(
    '/callback/addChannel/youtube',
    passport.authenticate('youtube_strategy_add_channel'),
    async (req, res) => {
        try {
            redirect = req.query.state.split('|')[1]
            if (req.authInfo.message) {
                message = req.authInfo.message
            } else {
                message = 'account_linked_with_success'
            }
            res.redirect(
                process.env.BASED_URL + redirect + '?message=' + message
            )
        } catch (err) {
            res.end(
                '{"error":"' + (err.message ? err.message : err.error) + '"}'
            )
        }
    }
)

/**
 * @swagger
 * /profile/onBoarding:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: update user onboarding status.
 *     description: update user when he enter the website first time.
 *     responses:
 *       "200":
 *          description: onBoarding updated, {"code":"status code","message":"onBoarding updated","data":true}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "500":
 *          description: error:<br> server error
 */
router.get('/onBoarding', verifyAuth, checkOnBoarding)

/**
 * @swagger
 * /profile/receiveMoney:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: request crypto from a satt user.
 *     description: sending an email to another satt user requesting him to send you an amount of crypto.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               to:
 *                 type: string
 *               name :
 *                   type: string
 *               price:
 *                   type: string
 *               cryptoCurrency:
 *                   type: string
 *               message:
 *                   type: string
 *               wallet:
 *                   type: string
 *               lang:
 *                   type: string
 *     responses:
 *       "200":
 *          description: Email was sent, {"code":"status code","message":"Email was sent"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> user not found
 *       "500":
 *          description: error:<br> server error
 */
router.post('/receiveMoney', verifyAuth, requestMoney)

/**
 * @swagger
 * /profile/add/Legalprofile:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: add user legal profile.
 *     description:  add user legal profile  <br> with access_token.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *               file:
 *                 type: string
 *                 format : base64
 *     responses:
 *       "201":
 *          description: legal saved, {"code":"status code","message":"legal saved"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "500":
 *          description: error:<br> server error
 */

router.post(
    '/add/Legalprofile',
    uploadUserLegal,
    verifyAuth,
    addUserLegalProfile
)

/**
 * @swagger
 * /profile/legalUserUpload/{id}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get userLegal file.
 *     description: fetch user kyc file.
 *     parameters:
 *       - name: id
 *         description: the  legal id.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: Downloaded user kyc file from db
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No file exists
 *       "500":
 *          description: error:<br> server error
 */
router.get('/legalUserUpload/:id', verifyAuth, FindUserLegalProfile)

/**
 * @swagger
 * /profile/notification/seen/{id}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: update notification status if it's seen or not by user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: id of the according selected notification by the user.
 *
 *     responses:
 *       "200":
 *          description: notification seen,{"code":"status code","message":"notification seen"}
 *       "400":
 *          description: error:<br> updated failed
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "406":
 *          description: error:<br> id field is missing
 *       "500":
 *          description: error:<br> server error
 */
router.post('/notification/seen/:id', verifyAuth, notificationUpdate)

/**
 * @swagger
 * /profile/notification/issend/clicked:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: update notifications status of the user that are seen.
 *     responses:
 *       "200":
 *          description: Notification clicked,{"code":"status code","message":"Notification clicked"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No notifications found
 *       "500":
 *          description: error:<br> server error
 */
router.get(
    '/notification/issend/clicked',
    verifyAuth,
    changeNotificationsStatus
)

/**
 * @swagger
 * /profile/notifications:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: retrieve all user notifications.
 *     responses:
 *       "200":
 *          description: success,{"code":"status code","message":"success","data":{"isSend","notifications":[]}}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "404":
 *          description: error:<br> No notifications found
 *       "500":
 *          description: error:<br> server error
 */
router.get('/notifications', verifyAuth, getNotifications)

/**
 * @swagger
 * /profile/changeEmail:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: user request change email .
 *     description: allow user to take first step to change his email and it end up with sending an email to user for verification.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               email :
 *                   type: string
 *     responses:
 *       "200":
 *          description: Email was sent,{"code":"status code","message":"Email was sent"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired,
 *       "406":
 *          description: error:<br> wrong password <br> duplicated
 *       "500":
 *          description: error:<br> server error
 */
router.post('/changeEmail', verifyAuth, changeEmail)

/**
 * @swagger
 * /profile/SattSupport:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: satt contact.
 *     description: send email to satt contact.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email :
 *                   type: string
 *               subject:
 *                   type: string
 *               message:
 *                   type: string
 *     responses:
 *       "200":
 *          description: Email was sent,{"code":"status code","message":"Email was sent"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "500":
 *          description: error:<br> server error
 */
router.post('/SattSupport', support)

/**
 * @swagger
 * /profile/connect/facebook/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: link account with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/connect/facebook/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('link_facebook_account', { state })(req, res, next)
})

passport.use(
    'link_facebook_account',
    new FbStrategy(
        facebookCredentials('profile/callback/link/facebook'),
        async (req, accessToken, refreshToken, profile, cb) => {
            linkFacebookAccount(req, accessToken, refreshToken, profile, cb)
        }
    )
)

router.get(
    '/callback/link/facebook',
    passport.authenticate('link_facebook_account', {
        failureRedirect:
            process.env.BASED_URL +
            '/home/settings/social-networks?message=access-denied',
    }),
    async (req, response) => {
        try {
            let state = req.query.state.split('|')
            let url = state[1]
            response.redirect(
                process.env.BASED_URL + url + '?message=' + req.authInfo.message
            )
        } catch (e) {
            console.log(e)
        }
    }
)

/**
 * @swagger
 * /profile/connect/google/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: link account with google.
 *     description: user asked for signin with google, system redirect him to signin google to page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/connect/google/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('link_google_account', {
        scope: ['profile', 'email'],
        state: state,
    })(req, res, next)
})

passport.use(
    'link_google_account',
    new GoogleStrategy(
        googleCredentials('profile/callback/link/google'),
        async (req, accessToken, refreshToken, profile, done) => {
            linkGoogleAccount(req, accessToken, refreshToken, profile, done)
        }
    )
)

router.get(
    '/callback/link/google',
    passport.authenticate('link_google_account', {
        failureRedirect:
            process.env.BASED_URL +
            '/home/settings/social-networks?message=access-denied',
    }),
    async (req, res) => {
        try {
            let state = req.query.state.split('|')
            let url = state[1]
            let message = req.authInfo.message
            res.redirect(process.env.BASED_URL + url + '?message=' + message)
        } catch (e) {
            console.log(e)
        }
    }
)

/**
 * @swagger
 * /profile/connect/telegram/{idUser}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: link account with telegram.
 *     description: user asked for signin with telegram, system redirect him to signin telegram page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get(
    '/connect/telegram/:idUser',
    passport.authenticate('link_telegram_account'),
    connectTelegramAccount
)

passport.use(
    'link_telegram_account',
    new TelegramStrategy(
        {
            botToken: process.env.TELEGRAM_BOT_TOKEN,
            passReqToCallback: true,
        },
        async (req, profile, cb) => {
            telegram_connect_function(req, profile, cb)
        }
    )
)

/**
 * @swagger
 * /profile/confirmChangeEmail:
 *   post:
 *     tags:
 *     - "profile"
 *     summary: confirm change email .
 *     description: the user must send the code that he had received in his new email.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               code:
 *                 type: number
 *     responses:
 *       "200":
 *          description: email changed,{"code":"status code","message":"email changed"}
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "406":
 *          description: error:<br> code incorrect
 *       "500":
 *          description: error:<br> server error
 */
router.post('/confirmChangeEmail', verifyAuth, confrimChangeMail)

/**
 * @swagger
 * /profile/link/verify/{typeSN}/{idUser}/{idPost}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: confirm change email .
 *     description: the user must send the code that he had received in his new email.
 *     parameters:
 *       - name: typeSN
 *         description: typeSN.
 *         in: path
 *         required: true
 *       - name: idUser
 *         description: idUser.
 *         in: path
 *         required: true
 *       - name: idPost
 *         description: idPost.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: email changed,{"code":"status code","message":"email changed"}
 *       "400":
 *          description: error:<br> please provide all fields
 *       "401":
 *          description: error:<br> Invalid Access Token <br> AC_Token expired
 *       "405":
 *          description: error:<br> account deactivated <br> no user session <br>
 *       "406":
 *          description: error:<br> account not linked <br> invalid link <br>
 *       "500":
 *          description: error:<br> server error
 */
router.get('/link/verify/:typeSN/:idUser/:idPost', verifyAuth, verifyLink)
module.exports = router
