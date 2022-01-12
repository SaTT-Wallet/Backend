let express = require('express');
const passport = require('passport');
let router = express.Router();
router.use(passport.initialize())

const {captcha,verifyCaptcha,codeRecover,confirmCode,passRecover} = require('../controllers/login.controller')
const { 
    emailConnection,
    facebookConnection,
    facebookConnectionCallback,
    googleConnection,
    googleConnectionCallback,
    telegramConnection,
    emailSignup
} = require('../middleware/passport.middleware')

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
 * /auth/mail:
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
router.post('/mail',emailConnection)

/**
 * @swagger
 * /auth/facebook:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with facebook.
 *     description: connect with facebook.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/facebook',facebookConnection)
router.get('/callback/facebook/connection',facebookConnectionCallback);


/**
 * @swagger
 * /auth/google:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with google.
 *     description: connect with google.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
 router.get('/google',googleConnection)
 router.get('/callback/google/connection',googleConnectionCallback);


 /**
 * @swagger
 * /auth/telegram:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: connect with telegram.
 *     description: connect with telegram.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/telegram',telegramConnection)


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
module.exports = router;