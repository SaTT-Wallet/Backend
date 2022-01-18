const fs = require('fs');
var handlebars = require('handlebars');
var passport = require('passport');
var emailStrategy = require('passport-local').Strategy;
var TelegramStrategy = require('passport-telegram-official').TelegramStrategy;
var LocalStrategy = require('passport-local').Strategy;
var Long = require('mongodb').Long;
const crypto = require('crypto');
const hasha = require('hasha');
ObjectId = require('mongodb').ObjectID
var readHTMLFile = function(path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function(err, html) {
        if (err) {
            throw err;
            callback(err);
        } else {
            callback(null, html);
        }
    });
};
var synfonyHash = function(pass) {
    var salted = pass + "{" + app.config.symfonySalt + "}";

    var buff = hasha(salted, { encoding: "buffer" });
    var saltBuff = Buffer.from(salted);
    var arr = [];

    for (var i = 1; i < 5000; i++) {
        arr = [buff, saltBuff];
        buff = hasha(Buffer.concat(arr), { algorithm: "sha512", encoding: "buffer" });
    }

    const base64 = buff.toString('base64');
    return base64;
}
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
var session = require('express-session');

try {
    app.use(session({ secret: 'fe3fF4FFGTSCSHT57UI8I8', resave: true, saveUninitialized: true })); // session secret
    app.use(passport.session());
} catch (e) {
    console.log(e)
}
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(app.config.mailerOptions);
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(async function(id, cb) {
    var users = await app.db.sn_user().find({ _id: Long.fromNumber(id) }).toArray();
    cb(null, users[0]);
});

/* 
* begin signin with email and password
*/
passport.use('signinEmailStrategy', new emailStrategy({ passReqToCallback: true },
            async function(req, username, password, done) {
                console.log("salut")
                var date = Math.floor(Date.now() / 1000) + 86400;
                var buff = Buffer.alloc(32);
                var token = crypto.randomFillSync(buff).toString('hex');
        
                var users = await app.db.sn_user().find({ email: username.toLowerCase() }).toArray();
                if (users.length) {
                    console.log("user")
                    var user = users[0];
                    // var res = await app.db.query("Select id,password from user where id='" + user._id + "' ");
                    // if (res.length && !user.password) {
                    //     await app.db.sn_user().updateOne({ _id: Long.fromNumber(user._id) }, { $set: { password: res[0].password } });
                    // }
                    if (user.password == synfonyHash(password)) {
                        console.log("pass")
                        app.account.sysLog("authentification", req.addressIp, `valid ${username}`);
                        let validAuth = await app.account.isBlocked(user, true)
                        if (!validAuth.res && validAuth.auth == true) {
                            var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
                            if (oldToken) {
                                await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token, expires_at: date } });
                                await app.db.sn_user().updateOne({ _id: Long.fromNumber(user._id) }, { $set: { failed_count: 0 } });
                            } else {
                                await app.db.accessToken().insertOne({ client_id: 1, user_id: user._id, token, expires_at: date, scope: "user" });
                            }
        
                            // req.session.user = user._id;
        
                            return done(null, { id: user._id, token: token, expires_in: date, noredirect: req.body.noredirect });
                        } else {
                            return done(null, false, { error: true, message: 'account_locked', blockedDate: validAuth.blockedDate });
                        }
                    } else {
                        let validAuth = await app.account.isBlocked(user, false);
                        app.account.sysLog("authentification", req.addressIp, `invalid ${username} ${password}`);
                        if (validAuth.res) return done(null, false, { error: true, message: 'account_locked', blockedDate: validAuth.blockedDate });
                        return done(null, false, { error: true, message: 'invalid_grant' }); //done("auth failed",null);
                    }
                } else {
                    return done(null, false, { error: true, message: 'invalid_grant' });
                }
            }
));
exports.emailConnection= async(req, res, next) => {
    passport.authenticate('signinEmailStrategy',{session: false},
        (err, user, info) => {
            if (err) {
                return res.end(JSON.stringify(err))
            }

            if (!user) {
                return res.end(JSON.stringify(info))
            }

            req.logIn(user, function(err) {
                req.session.user = user.id;
                var param = { "access_token": user.token, "expires_in": user.expires_in, "token_type": "bearer", "scope": "user" };
                return res.end(JSON.stringify(param))
            });

        })(req, res, next)



} 
/* 
* end signin with email and password
*/


/* 
* begin signin with facebook strategy
*/
exports.facebookAuthSignin= async (req, accessToken, refreshToken, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');

    var users = await app.db.sn_user().find({ idOnSn: profile._json.token_for_business }).toArray()

    if (users.length) {
        var user = users[0];
        // if(!user.enabled){
        //   return cb('account not verified')
        // }
        if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`
            return cb({ error: true, message, blockedDate: user.date_locked })
        }
        var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
        if (oldToken) {
            var update = await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
        } else {
            var insert = await app.db.accessToken().insertOne({ client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user" });
        }
        /*var res = await app.db.query("delete from OAAccessToken where user_id='"+user._id+"' ");
var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
*/
        req.session.user = users[0]._id;
        return cb(null, { id: user._id, token: token, expires_in: date });
    } else {
        return cb('Register First') // (null, false, {error: true, message: 'account_invalide'});
    }
}
/* 
*end signin with facebook strategy
*/

/* 
*begin signin with google strategy
*/
exports.googleAuthSignin= async (req,accessToken,refreshToken,profile,cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');
    var users = await app.db.sn_user().find({ idOnSn2: profile.id }).toArray()
    if (users.length) {
        var user = users[0];
        if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`
            return cb({ error: true, message, blockedDate: user.date_locked })
        }
        var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
        if (oldToken) {
            var update = await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
        } else {
            var insert = await app.db.accessToken().insertOne({ client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user" });
        }
        req.session.user = user._id;
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        return cb(null, { id: user._id, token: token, expires_in: date });
    } else {
        return cb('Register First') //(null, false, {message: 'account_invalide'});
    }
}
/* 
*end signin with google strategy
*/


/* 
* begin signup with email and password
*/
passport.use('auth_signup_emailStrategy', new LocalStrategy({ passReqToCallback: true },
    async function(req, username, password, done) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);

        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({ email: username.toLowerCase() }).toArray();

        if (users.length) {
            return done(null, false, { error: true, message: 'account_already_used' });
        } else {
            var mongodate = new Date().toISOString();
            var buff2 = Buffer.alloc(32);
            var codex = crypto.randomFillSync(buff2).toString('hex');
            let insert = await app.db.sn_user().insertOne({
                _id: Long.fromNumber(await app.account.handleId()),
                username: username.toLowerCase(),
                email: username.toLowerCase(),
                password: synfonyHash(password),
                created: mongodate,
                updated: mongodate,
                newsLetter: req.body.newsLetter,
                idSn: 0,
                account_locked: false,
                failed_count: 0,
                locale: "en",
                onBoarding: false,
                enabled: 0,
                confirmation_token: codex,
                "userSatt": true
            });

            let users = insert.ops;
            const lang = req.query.lang || "en";
            const code = await app.account.updateAndGenerateCode(users[0]._id, "validation");
            app.i18n.configureTranslation(lang);
            readHTMLFile(__dirname +'/../express/emailtemplate/email_validated_code.html', (err, html) => {
                var template = handlebars.compile(html);
                var replacements = {
                    satt_faq: app.config.Satt_faq,
                    satt_url: app.config.basedURl,
                    code,
                    imgUrl: app.config.baseEmailImgURl,
                };

                var htmlToSend = template(replacements);
                var mailOptions = {
                    from: app.config.mailSender,
                    to: users[0].email.toLowerCase(),
                    subject: 'Satt wallet activation',
                    html: htmlToSend
                };
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        app.account.sysLogError(error);
                    } else {
                        app.account.log('Email sent: ', users[0].email.toLowerCase());
                    }
                });
            });
            // req.session.user = users[0]._id;
            return done(null, { id: users[0]._id, token: token, expires_in: date, noredirect: req.body.noredirect });
        };
    }
));
exports.emailSignup= async(req, res, next) => {
    passport.authenticate('auth_signup_emailStrategy',
            (err, user, info) => {
                if (err) {
                    return res.end(JSON.stringify(err))
                }

                if (!user) {
                    return res.end(JSON.stringify(info))
                }

                req.logIn(user, function(err) {

                    var param = { "access_token": user.token, "expires_in": user.expires_in, "token_type": "bearer", "scope": "user" };
                    return res.end(JSON.stringify(param))
                });

            })(req, res, next);
} 
/* 
* end signin with email and password
*/

/* 
* begin signup with facebook strategy
*/
exports.facebookAuthSignup= async (req,accessToken,refreshToken,profile,cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');
    var users = await app.db.sn_user().find({ idOnSn: profile._json.token_for_business }).toArray()
    if (users.length) {
        return cb('account_already_used&idSn=' + users[0].idSn)
    } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var id = Long.fromNumber(await app.account.handleId())
        await app.db.sn_user().insertOne({
            _id: id,
            scopedId: profile.id,
            idOnSn: profile._json.token_for_business,
            email: profile._json.email,
            username: profile.name,
            firstName: profile.first_name,
            lastName: profile.displayName,
            created: mongodate,
            onBoarding: false,
            account_locked: false,
            newsLetter: req.body.newsLetter,
            failed_count: 0,
            updated: mongodate,
            idSn: 1,
            locale: "en",
            enabled: 1,
            confirmation_token: code,
            picLink: profile.photos.length ? profile.photos[0].value : false,
            userSatt: true
        });
        await app.db.accessToken().insertOne({ client_id: 1, user_id: id, token: token, expires_at: date, scope: "user" });
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
        req.session.user = id;
        return cb(null, { id: id, token: token, expires_in: date });
    }
}
/* 
*end signup with facebook strategy
*/


/* 
* begin signup with google strategy
*/

exports.googleAuthSignup= async (req,accessToken,refreshToken,profile,cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');
    var users = await app.db.sn_user().find({ $or: [{ idOnSn2: profile.id }, { email: profile._json.email }] }).toArray()
    if (users.length) {
        return cb('account_already_used&idSn=' + users[0].idSn)
    } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var insert = await app.db.sn_user().insertOne({
            _id: Long.fromNumber(await app.account.handleId()),
            idOnSn2: profile.id,
            email: profile.emails.length ? profile.emails[0].value : false,
            username: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            created: mongodate,
            updated: mongodate,
            idSn: 2,
            newsLetter: req.body.newsLetter,
            onBoarding: false,
            account_locked: false,
            failed_count: 0,
            enabled: 1,
            locale: profile._json.locale,
            confirmation_token: code,
            userSatt: true,
            picLink: profile.photos.length ? profile.photos[0].value : false
        });
        var users = insert.ops;
        await app.db.accessToken().insertOne({ client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user,https://www.googleapis.com/auth/youtubepartner-channel-audit" });
        return cb(null, { id: profile.id, token: token, expires_in: date });
    }
}

/* 
*end signup with google strategy
*/


/* 
* begin signup with telegram strategy
*/


exports.telegramSignup= async(req, res) => {
            try {
                var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
                res.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
            } catch (e) {
                console.log(e)
            }
} 

exports.signup_telegram_function=async(req, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');
    var users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray()
    if (users.length) {
        return cb('account_already_used&idSn=' + users[0].idSn);
    } else {
        var mongodate = new Date().toISOString();
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var insert = await app.db.sn_user().insertOne({
            _id: Long.fromNumber(await app.account.handleId()),
            idOnSn3: profile.id,
            username: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            name: profile.username,
            newsLetter: req.body.newsLetter,
            picLink: profile.photo_url,
            created: mongodate,
            onBoarding: false,
            account_locked: false,
            failed_count: 0,
            updated: mongodate,
            idSn: 5,
            locale: "en",
            confirmation_token: code,
            enabled: 1,
            userSatt: true
        });
        var users = insert.ops;
        var res_ins = await app.db.accessToken().insertOne({ client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user" });
        req.session.user = users[0]._id;
        return cb(null, { id: users[0]._id, token: token, expires_in: date });
    }
}
/* 
*end signup with telegram strategy
*/


/* 
begin signin with telegram strategy
*/
exports.signin_telegram_function=async(req, profile, cb) => {
    var date = Math.floor(Date.now() / 1000) + 86400;
    var buff = Buffer.alloc(32);
    var token = crypto.randomFillSync(buff).toString('hex');
    var users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray()
    if (users.length) {
        var user = users[0];
        // if (user.idSn != 5) {
        //   return cb('account_already_used') //(null, false, {message: 'account_already_used'});
        // }
        // if(!user.enabled){
        //   return cb('account not verified')
        // }
        if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`
            return cb({ error: true, message, blockedDate: user.date_locked })
        }
        var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
        if (oldToken) {
            var update = await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
        } else {
            var insert = await app.db.accessToken().insertOne({ client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user" });
        }
        req.session.user = user._id;
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        return cb(null, { id: user._id, token: token, expires_in: date });
    } else {
        return cb('account_invalide');
    }
}
exports.telegramConnection= (req, res) => {
    try {
        var param = { "access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user" };
        res.redirect(app.config.basedURl + "/auth/login?token=" + JSON.stringify(param))
    } catch (e) {
        console.log(e)
}
} 
/* 
*end signin with telegram strategy
*/
