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
const {account} = require('../controllers/profile.controller')


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
router.get('/account', account)

module.exports = router;