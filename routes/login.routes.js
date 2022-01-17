var express = require('express');
var app = express();
var connection;
(connection = async function (){
 app = await require("../conf/config")(app);
 app = await require("../conf/const")(app);
 app = await require("../db/db")(app);
 app = await require("../web3/provider")(app);
 app = await require("../manager/account")(app);
 app = await require("../manager/i18n")(app);
})();

const passport = require('passport');
let router = express.Router();
router.use(passport.initialize())
var session = require('express-session');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
var FbStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(async function(id, cb) {
    var users = await app.db.sn_user().find({ _id: Long.fromNumber(id) }).toArray();
    cb(null, users[0]);
});
try {
    router.use(session({ secret: 'fe3fF4FFGTSCSHT57UI8I8', resave: true, saveUninitialized: true })); 
    router.use(passport.session());
} catch (e) {
    console.log(e)
}
const {captcha,verifyCaptcha,codeRecover,confirmCode,passRecover,testtest2} = require('../controllers/login.controller')
const { 
    emailConnection,
    facebookConnection,
    facebookConnectionCallback,
    googleConnection,
    googleConnectionCallback,
    telegramConnection,
    emailSignup,
    facebookSignup,
    facebookSignupCallback,
    telegramSignup,
    googleAuthSignup,
    facebookAuthSignup,
    googleAuthSignin,
    facebookAuthSignin,
    
} = require('../middleware/passport.middleware')

function authSignInErrorHandler(err, req, res, next) {
    let message = err.message ? err.message : err;
    res.redirect(app.config.basedURl + '/auth/login?message=' + message);
}

/**
 * @swagger
 * /auth/captcha:
 *   get:
 *     tags:
 *     - "auth"
 *     description: get random captcha
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: captcha:{_id,originalImage,puzzle,position}
 *       "500":
 *          description: error:"error"
 */
router.get('/captcha',captcha)

/**
 * @swagger
 * /auth/verifyCaptcha:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: check if valid captcha .
 *     description: before connection or create a new account you have to check captcha to verify that you are not a bot.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               position:
 *                 type: number
 *     responses:
 *       "200":
 *          description: message:"success"
 *       "500":
 *          description: error:"wrong captcha"
 */
 router.post('/verifyCaptcha',verifyCaptcha)

/**
 * @swagger
 * /auth/signin/mail:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: check if email & password are correct.
 *     description: user enter his email & his password and system check if user & password are correct.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *          description: param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 *       "500":
 *          description: error={"error":true,"message":"invalid_grant"}
 */
router.post('/signin/mail',emailConnection)

 /**
 * @swagger
 * /auth/signin/telegram:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with telegram.
 *     description: connect with telegram.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signin/telegram',telegramConnection)


/**
 * @swagger
 * /auth/passlost:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: get code to recover password.
 *     description: user enter his email he will get a code in his email.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               mail:
 *                 type: string
 *     responses:
 *       "200":
 *          description: message=Email was sent
 *       "500":
 *          description: error=account not exists
 */
 router.post('/passlost',codeRecover)

 /**
 * @swagger
 * /auth/confirmCode:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: check if code correct.
 *     description: user enter the code received in mail and we will check if that code are correct or not.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               email:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       "200":
 *          description: message="code match"
 *       "500":
 *          description: message="code incorrect or code expired"
 */
  router.post('/confirmCode',confirmCode)

  /**
 * @swagger
 * /auth/passrecover:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: check if code correct.
 *     description: user enter the code received in mail and we will check if that code are correct or not.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               newpass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: "successfully"
 *       "500":
 *          description: error:"error"
 */
router.post('/passrecover',passRecover)



/**
 * @swagger
 * /auth/signup/mail:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: signup with email and password.
 *     description: user enter his email & his password and system check if email doesn't exist and will create a new account.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               newsLetter:
 *                 type: boolean
 *     responses:
 *       "200":
 *          description: param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 *       "500":
 *          description: error={error:true,message:'account_already_used'}
 */
 router.post('/signup/mail',emailSignup)


 /**
 * @swagger
 * /auth/signup/facebook:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signup with facebook.
 *     description: signup with facebook.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signup/facebook',async(req, res, next) => {
    passport.authenticate('auth_signup_facebookStrategy')(req,res,next)})
passport.use('auth_signup_facebookStrategy', new FbStrategy(app.config.facebookCredentials("auth/callback/facebook/signup"),
async (req, accessToken, refreshToken, profile, cb) => {
        facebookAuthSignup(req, accessToken, refreshToken, profile, cb)
    })
);   
router.get('/callback/facebook/signup',passport.authenticate('auth_signup_facebookStrategy'), async function(req, response) {
    try {
        var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
        response.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
    } catch (e) {
        console.log(e)
    }
},
authSignInErrorHandler);


/**
 * @swagger
 * /auth/signin/facebook:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with facebook.
 *     description: connect with facebook.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signin/facebook',async(req, res, next) => {
passport.authenticate('facebook_strategy_connection')(req,res,next)})

passport.use("facebook_strategy_connection", 
new FbStrategy(app.config.facebookCredentials("auth/callback/facebook/connection"),
async function(req, accessToken, refreshToken, profile, cb) {
    facebookAuthSignin(req, accessToken, refreshToken, profile, cb)
}))
router.get('/callback/facebook/connection',
passport.authenticate('facebook_strategy_connection'), async function(req, response) {
    try {
        var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
        response.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
    } catch (e) {
        console.log(e)
    }
},
authSignInErrorHandler
);


 /**
 * @swagger
 * /auth/signup/google:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signup with google.
 *     description: signup with google.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signup/google',async(req, res, next) => {
passport.authenticate('auth_signup_googleStrategy', { scope: ['profile', 'email']})(req, res, next)})

passport.use('auth_signup_googleStrategy', new GoogleStrategy(app.config.googleCredentials("auth/callback/google/signup"),
async (req, accessToken, refreshToken, profile, cb)=> {
    googleAuthSignup(req,accessToken,refreshToken,profile,cb);
}));
router.get('/callback/google/signup', 
  passport.authenticate('auth_signup_googleStrategy', { scope: ['profile', 'email'] }), async (req, response) =>{
     var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
  response.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
},
authSignInErrorHandler);


/**
 * @swagger
 * /auth/signin/google:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with google.
 *     description: connect with google.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signin/google',async(req, res, next) => {
passport.authenticate('google_strategy_connection', { scope: ['profile', 'email', ] })(req, res, next)})

passport.use('google_strategy_connection', 
new GoogleStrategy(app.config.googleCredentials("auth/callback/google/connection"),
async function(req, accessToken, refreshToken, profile, cb) {
    googleAuthSignin(req, accessToken, refreshToken, profile, cb)
}));

router.get('/callback/google/connection',
passport.authenticate('google_strategy_connection', { scope: ['profile', 'email'] }), async function(req, response) {
    var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
    response.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
},
authSignInErrorHandler
);

   /**
 * @swagger
 * /auth/signup/telegram:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signup with telegram.
 *     description: signup with telegram.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signup/telegram',telegramSignup)


module.exports = router;