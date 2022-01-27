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
var TelegramStrategy = require('passport-telegram-official').TelegramStrategy;

var Long = require('mongodb').Long;

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
const {captcha,verifyCaptcha,codeRecover,confirmCode,passRecover,resendConfirmationToken,saveFirebaseAccessToken,updateLastStep,authApple,socialSignUp,socialSignin,getQrCode,verifyQrCode} = require('../controllers/login.controller')
const { 
    emailConnection,
    telegramConnection,
    emailSignup,
    telegramSignup,
    googleAuthSignup,
    facebookAuthSignup,
    googleAuthSignin,
    facebookAuthSignin,
    signup_telegram_function,
    signin_telegram_function,
    verifyAuth
} = require('../middleware/passport.middleware')

function authSignInErrorHandler(err, req, res, next) {
    let message = err.message ? err.message : err;
    res.redirect(app.config.basedURl + '/auth/login?message=' + message);
}

function authErrorHandler(err, req, res, next) {
    console.log(err)
    let message = err.message ? err.message : err;
    res.redirect(app.config.basedURl + '/auth/registration?message=' + message);
}

/**
 * @swagger
 * /auth/captcha:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: get random captcha .
 *     description: return captcha to user to allow authentication action <br> without access_token
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
 *     description: before connection or create a new account you have to check captcha to verify that you are not a bot <br> without access_token.
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
 *     description: user enter his credentials, system check if user params are correct or not <br> without access_token.
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
 *          description: error={"error":true,"message":"invalid_credentials"} or {"error":true,"message":"account_locked",blockedDate:blockedDate}
 */
router.post('/signin/mail',emailConnection)



/**
 * @swagger
 * /auth/passlost:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: get code to recover password.
 *     description: user receive one code in his email to recover his password <br> without access_token.
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
 *     description: user check if the code that he received in his email is correct or not <br> without access_token.
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
 *          description: message="code_is_matched"
 *       "500":
 *          description: message="wrong code or code expired"
 */
  router.post('/confirmCode',confirmCode)

  /**
 * @swagger
 * /auth/passrecover:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: change password.
 *     description: user change his password, system check if email and access_token are matched or not <br> without access_token.
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
 *          description:"successfully" or "unauthorized"
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
 *     description: user enter his credentials to create a new account, system check if email exist or not <br> without access_token.
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
 *     description: user asked for signup with facebook, system redirect him to signup facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signup/facebook',async(req, res, next) => {
    passport.authenticate('auth_signup_facebookStrategy',app.config.persmissionsObjFb)
    (req,res,next)
})
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
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
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
 *     description: user asked for signup with google, system redirect him to signup google page <br> without access_token.
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
 *     summary: signin with google.
 *     description: user asked for signin with google, system redirect him to signin google page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/signin/google',async(req, res, next) => {
passport.authenticate('google_strategy_connection', { scope: ['profile', 'email', ] })(req, res, next)})

passport.use('google_strategy_connection', 
new GoogleStrategy(app.config.googleCredentials("auth/callback/google/connection"),
async (req, accessToken, refreshToken, profile, cb)=> {
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
 *     description: user asked for signup with telegram, system show modal interface of telegram signup <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
// router.get('/signup/telegram',telegramSignup)
router.get('/signup/telegram',
passport.authenticate('auth_signup_telegramStrategy'),
telegramSignup,authErrorHandler
)
passport.use('auth_signup_telegramStrategy',
new TelegramStrategy({
        botToken: app.config.telegramBotToken,
        passReqToCallback: true
    },
    async function(req, profile, cb) {
    signup_telegram_function(req, profile, cb)
    }
));

 /**
 * @swagger
 * /auth/signin/telegram:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signin with telegram.
 *     description: user asked for signin with telegram, system show modal interface of telegram signup <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
  router.get('/signin/telegram',
  passport.authenticate('telegramStrategyConnection'),
  telegramConnection,authSignInErrorHandler
  )
  passport.use('telegramStrategyConnection',
    new TelegramStrategy({
        botToken: app.config.telegramBotToken,
        passReqToCallback: true
    },
    async function(req, profile, cb) {
    signin_telegram_function(req, profile, cb)
    }
));

/**
 * @swagger
 * /auth/resend/confirmationToken:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: resend confirmation code.
 *     description: user enter his email, system check if email exist and will generate new code without access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       "200":
 *          description: message:"Email sent"
 *       "500":
 *          description: error:error message
 */
 router.post('/resend/confirmationToken',resendConfirmationToken)

 /**
 * @swagger
 * /auth/save/firebaseAccessToken:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: save firebase access token.
 *     description: system allow user to save his firebase token to use notification .
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               fb_accesstoken:
 *                 type: string
 *     responses:
 *       "200":
 *          description: message:"success"
 *       "500":
 *          description: error:error message
 */
  router.post('/save/firebaseAccessToken',verifyAuth,saveFirebaseAccessToken)

   /**
 * @swagger
 * /auth/updateLastStep:
 *   put:
 *     tags:
 *     - "auth"
 *     summary: update last step.
 *     description: system redirect user to page complete profile to verify his information and confirm his email .
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               completed:
 *                 type: boolean
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       "200":
 *          description: data= <br> {message:"updated successfully"} <br> {message:"updated successfully with same email"} <br> {message:"email already exists"}
 *       "500":
 *          description: error:error message
 */
 router.put('/updateLastStep',updateLastStep)

 /**
 * @swagger
 * /auth/apple:
 *   post:
 *     tags:
 *     - "auth"
 *     summary: auth for apple.
 *     description: user enter his credentials to login , system check if email exist or not <br> without access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               id_apple:
 *                 type: string
 *               mail:
 *                 type: string
 *               idSN:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       "200":
 *          description: param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 *       "500":
 *          description: error={error:true,message:'account_already_used'}
 */
  router.post('/apple',authApple)



  /**
  * @swagger
  * /auth/socialSignup:
  *   post:
  *     tags:
  *     - "auth"
  *     summary: register with social for apple.
  *     description: user enter his credentials to register , system check if email exist or not <br> without access_token.
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:      # Request body contents
  *             type: object
  *             properties:
  *               name:
  *                 type: string
  *               idSn:
  *                 type: string
  *               id:
  *                 type: string
  *               photo:
  *                 type: string
  *               givenName:
  *                 type: string
  *               familyName:
  *                 type: string
  *     responses:
  *       "200":
  *          description: param={"account_doesnt_exist"}
  *       "500":
  *          description: error={error:true,message:'account_already_used'}
  */
   router.post('/socialSignup',socialSignUp)
 
 
 
 
  /**
  * @swagger
  * /auth/socialSignin:
  *   post:
  *     tags:
  *     - "auth"
  *     summary: auth with social for apple.
  *     description: user enter his credentials to login , system check if email exist or not <br> without access_token.
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:      # Request body contents
  *             type: object
  *             properties:
  *               idSn:
  *                 type: string
  *               id:
  *                 type: string
 
  *     responses:
  *       "200":
  *          description: param={"account_doesnt_exist"}
  *       "500":
  *          description: error={error:true,message:'account_already_used'}
  */
router.post('/socialSignin',socialSignin)
 
 /**
 * @swagger
 * /auth/qrCode/:id:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: setting double authentication for user.
 *     description: setting user google authentication.
 *     parameters:
 *       - name: id
 *         description: userId.
 *     responses:
 *        "200":
 *          description: data
 *        "500":
 *          description: error:error message
 */
router.get('/qrCode/:id',getQrCode)

  /**
  * @swagger
  * /auth/verifyQrCode:
  *   post:
  *     tags:
  *     - "auth"
  *     summary: auth with social for apple.
  *     description: user enter his credentials to login , system check if email exist or not <br> without access_token.
  *     requestBody:
  *       content:
  *         application/json:
  *           schema:      # Request body contents
  *             type: object
  *             properties:
  *               code:
  *                 type: number
  *               id:
  *                 type: string
 
  *     responses:
  *       "200":
  *          description: { verifiedCode: verified }
  *       "500":
  *          description: error={error:true,message:'account_already_used'}
  */
router.post('/verifyQrCode',verifyQrCode);

module.exports = router;