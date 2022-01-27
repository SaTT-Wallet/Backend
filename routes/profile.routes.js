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
var FbStrategy = require('passport-facebook').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
let LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
var GoogleStrategy = require('passport-google-oauth20').Strategy;

var session = require('express-session');

let router = express.Router();
router.use(passport.initialize())

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
const {support,FindUserLegalProfile,uploadUserLegal,addUserLegalProfile,UpdateIntersts,AddIntersts,UserInterstes, deleteLinkedinChannels,profilePicture,updateProfile, UserLegalProfile,deleteFacebookChannels, deleteGoogleChannels,account,socialAccounts,checkOnBoarding,requestMoney} = require('../controllers/profile.controller')
const { 
    addFacebookChannel,
    addTwitterChannel,
    addlinkedinChannel,
    addyoutubeChannel,
    verifyAuth
} = require('../middleware/passport.middleware')


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
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
router.get('/account',verifyAuth, account)

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
 *          description: user:{picture} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.get('/picture',verifyAuth, profilePicture)


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
 *               email:
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
 *       "200":
 *          description: err:email already exists, <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
  router.put('/UpdateProfile',verifyAuth, updateProfile)



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
 *          description: legal:[{_id,length,chunkSize, uploadDate,filename,md5,contentType,DataUser:{$ref,$id,$db},idNode,type,validate}] <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.get('/UserLegal',verifyAuth, UserLegalProfile)


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
 *          description: interests:[] <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.get('/UserIntersts',verifyAuth, UserInterstes)



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
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *                      
 *     responses:
 *       "200":
 *          description: err:E11000 duplicate key error collection"<br> 
 *       "500":
 *          description: error:error message
 */
router.post('/AddUserIntersts',verifyAuth, AddIntersts)



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
 *       "200":
 *          description: err:<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
    router.put('/UpdateUserIntersts',verifyAuth, UpdateIntersts)





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
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.delete('/RemoveGoogleChannels',verifyAuth, deleteGoogleChannels)

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
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


    router.delete('/RemoveFacebookChannels',verifyAuth, deleteFacebookChannels)

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
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.delete('/RemoveLinkedInChannels',verifyAuth, deleteLinkedinChannels)




 

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
 *          description: data:{google:[],twitter:[],facebook:[],linkedin:[]}
 *       "500":
 *          description: error:error message
 */
  router.get('/socialAccounts',verifyAuth, socialAccounts)

  /**
 * @swagger
 * /profile/addChannel/facebook:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/facebook/:idUser',(req, res, next) => {
    const state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('facebook_strategy_add_channel', { scope: ['email', 'read_insights', 'pages_show_list', 'instagram_basic', 'instagram_manage_insights', 'pages_read_engagement'], state })(req, res, next)
})
    
passport.use('facebook_strategy_add_channel', new FbStrategy(
app.config.facebookCredentials("profile/callback/addChannel/facebook"),
async(req, accessToken, refreshToken, profile, cb) => {
    addFacebookChannel(req, accessToken, refreshToken, profile, cb)
}));

router.get('/callback/addChannel/facebook',
    passport.authenticate('facebook_strategy_add_channel',
     { failureRedirect: app.config.basedURl + '/home/settings/social-networks?message=access-denied' }),
      async(req, response) => {
        try {
            redirect = req.query.state.split('|')[1];
            let message = req.authInfo.message;
            response.redirect(app.config.basedURl + redirect + '?message=' + message+"&sn=fb");

        } catch (e) {
            console.log(e)
        }
    }
);



  /**
 * @swagger
 * /profile/addChannel/twitter:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/twitter/:idUser',(req, res, next) => {
        var state = req.params.idUser + "|" + req.query.redirect
        req.session.state = state;
        passport.authenticate('twitter_strategy_add_channel', {
            scope: ['profile', 'email'],
            accessType: 'offline',
            prompt: 'consent',
            state: state
        })(req, res, next)
})
    
passport.use('twitter_strategy_add_channel', new TwitterStrategy(app.config.twitterCredentials('profile/callback/addChannel/twitter'),
async (req, accessToken, tokenSecret, profile, cb) => {
    addTwitterChannel(req, accessToken, tokenSecret, profile, cb);
}));

router.get('/callback/addChannel/twitter',
    passport.authenticate('twitter_strategy_add_channel', 
    { failureRedirect: app.config.basedURl + '/home/settings/social-networks?message=access-denied'}), 
    async function(req, response) {
    try {
        redirect = req.session.state.split('|')[1];
        if (req.authInfo.message) {
            message = req.authInfo.message;
        } else {
            message = "account_linked_with_success";
        }
        response.redirect(app.config.basedURl + redirect + '?message=' + message);

    } catch (e) {
        console.log(e)
    }
});

  /**
 * @swagger
 * /profile/addChannel/linkedin:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
   router.get('/addChannel/linkedin/:idUser',(req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('linkedin_strategy_add_channel', { state })(req, res, next)
})

passport.use('linkedin_strategy_add_channel', new LinkedInStrategy(app.config.linkedinCredentials('profile/callback/addChannel/linkedin'), 
async(req, accessToken, refreshToken, profile, done) => {
    addlinkedinChannel(req, accessToken, refreshToken, profile, done)
}));



router.get('/callback/addChannel/linkedin',
passport.authenticate('linkedin_strategy_add_channel'), async(req, res) => {
    try {
        let redirect = req.query.state.split('|')[1];
        let message = req.authInfo.message;
        res.redirect(app.config.basedURl + redirect + '?message=' + message+"&sn=linkd");
    } catch (err) {
        app.account.sysLogError(err);
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
});


  /**
 * @swagger
 * /profile/addChannel/youtube:
 *   get:
 *     tags:
 *     - "auth"
 *     summary: signin with facebook.
 *     description: user asked for signin with facebook, system redirect him to signin facebook page <br> without access_token.
 *     responses:
 *       "200":
 *          description: redirection:param={"access_token":token,"expires_in":expires_in,"token_type":"bearer","scope":"user"}
 */
router.get('/addChannel/youtube/:idUser',(req, res, next) => {
    var state = req.params.idUser + '|' + req.query.redirect
    passport.authenticate('youtube_strategy_add_channel', {
        scope: ['profile', 'email', "https://www.googleapis.com/auth/youtube.readonly"],
        accessType: 'offline',
        prompt: 'consent',
        state: state
    })(req, res, next)
})
passport.use('youtube_strategy_add_channel', new GoogleStrategy(app.config.googleCredentials('profile/callback/addChannel/youtube'),
async (req, accessToken, refreshToken, profile, cb) => {
    addyoutubeChannel(req, accessToken, refreshToken, profile, cb)
}));



router.get('/callback/addChannel/youtube',
passport.authenticate('youtube_strategy_add_channel'), async(req, res) => {
    try {
        redirect = req.query.state.split('|')[1]
        if (req.authInfo.message) {
            message = req.authInfo.message;
        } else {
            message = "account_linked_with_success";
        }
        res.redirect(app.config.basedURl + redirect + '?message=' + message);

    } catch (err) {
        app.account.sysLogError(err);
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
});

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
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
  router.get('/onBoarding',verifyAuth, checkOnBoarding)


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
 *               price :
 *                   type: string
 *               currency:
 *                   type: string
 *               name:
 *                   type: string
 *     responses:
 *       "200":
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
    router.post('/receiveMoney',verifyAuth,requestMoney)


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
*       "200":
*          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
*       "500":
*          description: error:error message
*/

router.post('/add/Legalprofile',uploadUserLegal,verifyAuth,addUserLegalProfile)




 /**
 * @swagger
 * /profile/legalUserUpload/{id}:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: update user onboarding status.
 *     description: update user when he enter the website first time.
 *     parameters:
 *       - name: id
 *         description: the  legal id.
 *         in: path
 *         required: true 
 *     responses:
 *       "200":
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
  router.get('/legalUserUpload/:id',verifyAuth, FindUserLegalProfile)




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
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
      router.post('/SattSupport',support)



  module.exports = router;