const { async } = require('hasha');

module.exports = function (app) {
  var nodemailer = require('nodemailer');
  var bad_login_limit = 5;
  var transporter = nodemailer.createTransport(app.config.mailerOptions);
  var  ObjectID = require('mongodb').ObjectID
  var bodyParser = require('body-parser');
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use( bodyParser.json() )

  const crypto = require('crypto');
  const hasha = require('hasha');
  var handlebars = require('handlebars');
  const fs = require('fs');


  ObjectId = require('mongodb').ObjectID
  var Long = require('mongodb').Long;

  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  var emailStrategy = require('passport-local').Strategy;
  var FbStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google-oauth20').Strategy;
  var TwitterStrategy = require('passport-twitter').Strategy;
  var TelegramStrategy = require('passport-telegram-official').TelegramStrategy;

  try {
    app.use(passport.initialize());
    app.use(passport.session());
  } catch (e) {
    console.log(e)
  }

  var readHTMLFile = function(path, callback) {
    fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      }
      else {
        callback(null, html);
      }
    });
  };


  var synfonyHash = function (pass) {
    var salted = pass+"{"+app.config.symfonySalt+"}";


    var buff = hasha(salted, {encoding: "buffer"});
    var saltBuff = Buffer.from(salted);
    var arr = [];

    for (var i = 1; i < 5000; i++) {
      arr = [buff, saltBuff];
      buff = hasha(Buffer.concat(arr), {algorithm: "sha512", encoding: "buffer"});
    }

    const base64 = buff.toString('base64');
    return base64;
  }

  passport.use( 'signup_emailStrategy',new LocalStrategy({passReqToCallback: true},
    async function (req, username, password, done) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);

      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({email: username}).toArray();

      if (users.length) {
        return done(null, false, {error: true, message: 'email_already_used'});
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          username: username,
          email: username,
          password: synfonyHash(password),
          created: mongodate,
          updated: mongodate,
          idSn: 0,
          locale: "en",
          enabled: 0,
          confirmation_token: code,
          "userSatt": true
        });

        var users = await app.db.sn_user().find({email: username}).toArray();
        const lang = req.query.lang || "en";

        app.i18n.configureTranslation(lang);
        readHTMLFile(__dirname + '/../emails/welcome.html', function(err, html) {
          var template = handlebars.compile(html);
          var replacements = {
            satt_url: app.config.basedURl,
            imgUrl: app.config.baseEmailImgURl,
            validation_url: app.config.baseUrl + 'auth/activate/' + users[0]._id + "/" + code,
          };

          var htmlToSend = template(replacements);
          var mailOptions = {
            from: app.config.mailSender,
            to: users[0].username,
            subject: 'Satt wallet activation',
            html: htmlToSend
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              console.log('Email sent: ' );
            }
          });
        });

        return done(null, {id: users[0]._id, token: token, expires_in: date, noredirect: req.body.noredirect});
      };
    }
  ));
  passport.use('emailStrategy', new emailStrategy({passReqToCallback: true},
    async function (req, username, password, done) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var maxId = app.db.sn_user().find().sort({_id:-1}).limit(1)

      var users = await app.db.sn_user().find({email: username}).toArray();
      if (users.length) {
        var user = users[0];
        if (user.idSn != 0) {
          return done(null, false, {error: true, message: 'email_already_used'});
        }
        /*if (user.account_locked) {
          return done(null, false, {error: true, message: 'account_locked'});
        }*/
        var res = await app.db.query("Select id,password from user where id='" + user._id + "' ");
        if (res.length && !user.password) {
          await app.db.sn_user().updateOne({_id: Long.fromNumber(user._id)}, {$set: {password: res[0].password}});
        }
        await app.db.sn_user().updateOne({_id: Long.fromNumber(user._id)}, {$set: {account_locked: false, failed_count: 0}});
        if (user.password == synfonyHash(password)) {
          var oldToken = await app.db.accessToken().findOne({user_id: user._id});
          if (oldToken) {
            var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
          } else {
            var insert = await app.db.accessToken().insertOne({client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          }
          //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          return done(null, {id: user._id, token: token, expires_in: date, noredirect: req.body.noredirect});
        } else {
          var failed_count = user.failed_count? user.failed_count + 1 : 1;
          var account_locked = false
          if (failed_count >= bad_login_limit) {
            account_locked = true
          }
          var update = await app.db.sn_user().updateOne({_id: Long.fromNumber(user._id)}, {$set: {account_locked: account_locked, failed_count: failed_count}});
          var users0 = await app.db.sn_user().find({_id: Long.fromNumber(user._id)}).toArray();
          let login_limit = bad_login_limit - failed_count;
          return done(null, false, {error: true, message: 'invalid_grant', login_limit: login_limit, account_locked:account_locked }); //done("auth failed",null);
        }
      } else {
        return done(null, false, {error: true, message: 'account_invalide'});
      }
    }
  ));


  passport.use('signup_FbStrategy',new FbStrategy({
      clientID: app.config.appId,
      clientSecret: app.config.appSecret,
      callbackURL: app.config.baseUrl + "callback/facebook_signup",
      profileFields: ['id', 'displayName', 'email', "picture.type(large)", "token_for_business"]
    },
    async function (accessToken, refreshToken, profile, cb) {

      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({scopedId: profile.id}).toArray()
      if (users.length) {
        return cb('Error: email already Used')
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        console.log("--------------")
        console.log(profile.email)
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          scopedId: profile.id,
          idOnSn: profile.token_for_business,
          email: profile.email,
          username: profile.email,
          first_name: profile.first_name,
          name: profile.displayName,
          created: mongodate,
          updated: mongodate,
          idSn: 1,
          locale: "en",
          enabled:1,
          // picLink: profile.picture.data.url,
          userSatt: true
        });
        var users = await app.db.sn_user().find({email: profile.email}).toArray();
        var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user"});
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
        return cb(null, {id: users[0]._id, token: token, expires_in: date});
      }
    }));
  passport.use("facebook_strategy",new FbStrategy({
      clientID: app.config.appId,
      clientSecret: app.config.appSecret,
      callbackURL: app.config.baseUrl + "callback/facebook",
      profileFields: ['id', 'displayName', 'email', "picture.type(large)", "token_for_business"]
    },
    async function (accessToken, refreshToken, profile, cb) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');

      var users = await app.db.sn_user().find({scopedId: profile.id}).toArray()
      console.log(profile,"user")
      if (users.length) {
        var user = users[0]
        var oldToken = await app.db.accessToken().findOne({user_id: user._id});
        if (oldToken) {
          var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
        } else {
          var insert = await app.db.accessToken().insertOne({client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        }
        /*var res = await app.db.query("delete from OAAccessToken where user_id='"+user._id+"' ");
        var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
*/        return cb(null, {id: user._id, token: token, expires_in: date});
      } else {
        return cb('account_invalide') // (null, false, {error: true, message: 'account_invalide'});
      }
    }))

  passport.use('signup_googleStrategy', new GoogleStrategy({
      clientID: app.config.googleClientId,
      clientSecret: app.config.googleClientSecret,
      callbackURL: app.config.baseUrl + "callback/google_signup"
    },
    async function (accessToken, refreshToken, profile, cb) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({idOnSn2: profile.id}).toArray()

      if (users.length) {
        return cb('email_already_used')
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          idOnSn2: profile.id,
          email: profile.emails.length ? profile.emails[0].value:false,
          username: profile.displayName,
          first_name: profile.name.givenName,
          name: profile.name.familyName,
          created: mongodate,
          updated: mongodate,
          idSn: 2,
          enabled:1,
          locale: profile._json.locale,
          userSatt: true,
          picLink:profile.photos.length ? profile.photos[0].value : false
        });
        console.log(profile)
        var users = await app.db.sn_user().find({idOnSn2: profile.id}).toArray();
        var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user"});
        return cb(null, {id: profile.id, token: token, expires_in: date});
      }
    }));

  passport.use('google_strategy', new GoogleStrategy({
      clientID: app.config.googleClientId,
      clientSecret: app.config.googleClientSecret,
      callbackURL: app.config.baseUrl + "callback/google"
    },
    async function (accessToken, refreshToken, profile, cb) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({idOnSn2: profile.id}).toArray()
      if (users.length) {
        var user = users[0];
        if (user.idSn != 2) {
          return cb('email_already_used') //(null, false, {message: 'email_already_used'});
        }
        var oldToken = await app.db.accessToken().findOne({user_id: user._id});
        if (oldToken) {
          var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
        } else {
          var insert = await app.db.accessToken().insertOne({client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        }
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        return cb(null, {id: user._id, token: token, expires_in: date});
      } else {
        return cb ('Register First') //(null, false, {message: 'account_invalide'});
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var insert = await app.db.sn_user().insertOne({
          idOnSn2: profile.id,
          email: profile.email,
          username: profile.email,
          first_name: profile.given_name,
          name: profile.family_name,
          created: mongodate,
          updated: mongodate,
          idSn: 2,
          enabled:0,
          locale: profile.locale,
          userSatt: true
        });
        var users = await app.db.sn_user().find({email: profile.email}).toArray();
        var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user"});
        return cb(null, {id: users[0]._id, token: token, expires_in: date});
      }
    }));

  /*
  passport.use(new TwitterStrategy({
      consumerKey: app.config.twitterClientId,
      consumerSecret: app.config.twitterClientSecret,
      callbackURL: app.config.baseUrl+"callback/twitter"
    },
    async function(token, tokenSecret, profile, cb) {

       var date = Math.floor(Date.now()/1000)+86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({idOnSn:profile.id}).toArray()
      if(users.length)
      {
          var user = users[0];
          if(user.idSn != 3)
          {
              return done("email already used",null);
          }
          var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
          return cb(null,{id:user._id,token:token,expires_in:date});
      }
      else {
          var mongodate = new Date().toISOString();
          var mydate = mongodate.slice(0, 19).replace('T', ' ');
          var res_ins = await app.db.insert("INSERT INTO user SET ?",{username:profile.email,email:profile.email,created:mydate,updated:mydate,enabled:1});
          var id = res_ins.insertId;
          var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:id,token:token,expires_at:date,scope:"user"});
          var insert = await app.db.sn_user().insertOne({
              _id:id,
              idOnSn2:profile.id,
              email: profile.email,
              first_name:profile.given_name,
              name:profile.family_name,
              created :mongodate,
              updated:mongodate,
              idSn:3,
              locale:profile.locale,
              userSatt: true
          });
      return cb(null,{id:id,token:token,expires_in:date});
    }

    }
  ));
  */

  /*passport.use( 'signup_telegramStrategy',
    new TelegramStrategy({
        clientID: app.config.telegramClientId,
        clientSecret: app.config.telegramClientSecret,
        callbackURL: app.config.baseUrl + "callback/telegram"
      },
      async function (accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
        if (users.length) {
          return cb('email_already_used');
        } else {
          var mongodate = new Date().toISOString();
          var mydate = mongodate.slice(0, 19).replace('T', ' ');
          var insert = await app.db.sn_user().insertOne({
            idOnSn3: profile.id,
            email: profile.email,
            username: profile.email,
            first_name: profile.first_name,
            lastName: profile.last_name,
            name: profile.username,
            picLink: profile.photo_url,
            created: mongodate,
            updated: mongodate,
            idSn: 3,
            locale: "en",
            enabled:1,
            userSatt: true
          });
          var users = await app.db.sn_user().find({email: profile.username}).toArray();
          var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user"});
          return cb(null, {id: users[0]._id, token: token, expires_in: date});
        }
      }
    ));*/
  /*passport.use(
    new TelegramStrategy({
        clientID: app.config.telegramClientId,
        clientSecret: app.config.telegramClientSecret,
        callbackURL: app.config.baseUrl + "callback/telegram"
      },
      async function (accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
        console.log("-----------------req.user.id --------------")
        console.log(users)
        if (users.length) {
          var user = users[0];
          if (user.idSn != 3) {
            return cb('email_already_used') //(null, false, {message: 'email_already_used'});
          }
          var oldToken = await app.db.accessToken().findOne({user_id: user._id});
          if (oldToken) {
            var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
          } else {
            var insert = await app.db.accessToken().insertOne({client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          }
          //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          return cb(null, {id: user._id, token: token, expires_in: date});
        } else {
          return cb ('account_invalide');
        }
      }
    ));*/

  passport.use('signup_telegramStrategy',
    new TelegramStrategy({
        botToken: app.config.telegramBotToken
      },
      async function(profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
        if (users.length) {
          return cb('email_already_used');
        } else {
          var mongodate = new Date().toISOString();
          var mydate = mongodate.slice(0, 19).replace('T', ' ');
          var insert = await app.db.sn_user().insertOne({
            id:Long.fromNumber(await app.account.handleId()),
            idOnSn3: profile.id,
            email: profile.email,
            username: profile.email,
            first_name: profile.first_name,
            lastName: profile.last_name,
            name: profile.username,
            picLink: profile.photo_url,
            created: mongodate,
            updated: mongodate,
            idSn: 3,
            locale: "en",
            enabled:1,
            userSatt: true
          });
          var users = await app.db.sn_user().find({email: profile.username}).toArray();
          var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user"});
          return cb(null, {id: users[0]._id, token: token, expires_in: date});
        }
      }
    ));

  passport.use('telegramStrategy',
    new TelegramStrategy({
      botToken: app.config.telegramBotToken
    },
    async function(profile, cb) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
      if (users.length) {
        var user = users[0];
        if (user.idSn != 3) {
          return cb('email_already_used') //(null, false, {message: 'email_already_used'});
        }
        var oldToken = await app.db.accessToken().findOne({user_id: user._id});
        if (oldToken) {
          var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
        } else {
          var insert = await app.db.accessToken().insertOne({client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        }
        //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
        return cb(null, {id: user._id, token: token, expires_in: date});
      } else {
        return cb ('account_invalide');
      }



    }
  ));

  passport.serializeUser(function (user, cb) {
    cb(null, user.id);
  });

  passport.deserializeUser(async function (id, cb) {
    var users = await app.db.sn_user().find({_id:Long.fromNumber( id)}).toArray();
    cb(null, users[0]);
  });



  app.post('/auth/signup', (req, res, next) => {
    passport.authenticate('signup_emailStrategy',
      (err, user, info) => {
        if (err) {
          return res.end(JSON.stringify(err))
        }

        if (!user) {
          return res.end(JSON.stringify(info))
        }

        req.logIn(user, function(err) {
          var param = {"access_token": user.token, "expires_in": user.expires_in, "token_type": "bearer", "scope": "user"};
          return res.end(JSON.stringify(param))
          //return res.redirect('/');
        });

      })(req, res, next);
  });
  app.post('/auth/email', (req, res, next) => {
    passport.authenticate('emailStrategy',
      (err, user, info) => {
        if (err) {
          return res.end(JSON.stringify(err))
        }

        if (!user) {
          return res.end(JSON.stringify(info))
        }

        req.logIn(user, function(err) {
          var param = {"access_token": user.token, "expires_in": user.expires_in, "token_type": "bearer", "scope": "user"};
          return res.end(JSON.stringify(param))
          //return res.redirect('/');
        });

      })(req, res, next);
  });



  app.get('/auth/signup_fb', passport.authenticate('signup_FbStrategy'));
  app.get('/auth/fb', passport.authenticate('facebook_strategy'));

  app.get('/auth/signup_google', passport.authenticate('signup_googleStrategy', {scope: ['profile','email']}));
  app.get('/auth/google', passport.authenticate('google_strategy', {scope: ['profile','email']}));

  //app.get('/auth/twitter', passport.authenticate('twitter'));

  app.get('/auth/signup_telegram', passport.authenticate('F'),
    function(req, res) {
      try {
        var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
        res.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
      } catch (e) {
        console.log(e)
      }
    },
    authErrorHandler);

  app.get('/auth/telegram',
    passport.authenticate('telegramStrategy'),
    function(req, res) {
      // Successful authentication, redirect home.
      try {
        var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
        res.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
      } catch (e) {
        console.log(e)
      }
    },
    authErrorHandler);

  function authErrorHandler(err, req, res, next) {
    console.log(err)
    let message = err.message? err.message:err;
    res.redirect(app.config.basedURl +'/login?error=1&message=' + message);
  }



  app.get('/callback/facebook_signup',
    passport.authenticate('signup_FbStrategy'), async function (req, response) {
      try {
        var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
        response.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
      } catch (e) {
        console.log(e)
      }
    },
    authErrorHandler);
  app.get('/callback/facebook',
    passport.authenticate('facebook_strategy'), async function (req, response) {
      try {
        var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
        response.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
      } catch (e) {
        console.log(e)
      }
    },
    authErrorHandler);
  app.get('/callback/google_signup', passport.authenticate('signup_googleStrategy', {scope: ['profile','email']}), async function (req, response) {
      var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
      response.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
    },
    authErrorHandler);
  app.get('/callback/google', passport.authenticate('google_strategy', {scope: ['profile','email']}), async function (req, response) {
      //console.log(req.user)
      var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
      response.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
    },
    authErrorHandler);

 /* app.get('/callback/twitter', passport.authenticate('twitter'), async function (req, response) {
    //console.log(req.user)
    var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
    response.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
  });*/


  // route for logging out
  app.get('/logout', function(req, res) {
    req.logout();
    res.end(JSON.stringify(param))
  });

  app.get('/test', function(req, res) {
   app.account.handleId()
  });


  function expiringToken(date){
    return (Math.floor(new Date().getTime()/1000))>date
  }

  function ensureLoggedIn() {
    return async function(req, res, next){
      var UserId;

      var token = req.header('authorization').split(' ')[1]
      var AccessT = await app.db.accessToken().findOne({token:token});
   if(AccessT){
      if(!expiringToken(AccessT.expires_at)){

        if(!AccessT['token']){
          UserId = await app.db.query("Select user_id  from OAAccessToken where token='" +AccessT + "'  ");
          if(!UserId){
            return  res.end("Invalid Access Token")
          }
        }else{
          UserId = AccessT['user_id']
        }

        var user = await app.db.sn_user().findOne({'_id':UserId})

        if(user){
            delete(user.password)
            res.end(JSON.stringify(user))
        }
        else{
          res.end(JSON.stringify({error:"user not found"}))
        }
      }else{
        res.end(JSON.stringify({error:"AC_Token expired"}))
      }
     }else{
      res.end("Invalid Access Token")
     }
    }
  }

  app.get('/auth/account', ensureLoggedIn())

  app.get('/auth/activate/:id/:code', async function (req, response) {
    var code = req.params.code;
    var id = req.params.id;

    console.log(id,"activate with")
    var users = await app.db.sn_user().find({_id:Long.fromNumber(id)}).toArray();


    if( users.length) {
      if (users[0].enabled) {
        //response.end('{error:"account already activated"}');
        let message = "account already activated";
        response.redirect(app.config.basedURl +'/login?error=1&message=' + message);
        return;
      }
      if (users[0].confirmation_token != code) {
        let message = "wrong activation";
        response.redirect(app.config.basedURl +'/login?error=1&message=' + message);
        //response.end('{error:"wrong activation"}');
        return;
      }
      var update = await app.db.sn_user().updateOne({_id:Long.fromNumber(id)}, {$set: {confirmation_token: "", enabled: 1}})
      let message = "activated";
      response.redirect(app.config.basedURl +'/login?message=' + message);
      //response.end('{message:"activated"}');
    } else {
      let message = "no account";
      response.redirect(app.config.basedURl +'/login?error=1&message=' + message);
      //response.end('{error:"no account"}');
    }

  });

  app.post('/auth/passlost', async function (req, response) {
    const lang = req.query.lang || "en";

	app.i18n.configureTranslation(lang);
    var mail = req.body.mail;
    // var res = await app.db.query("Select id from user where email='" + mail + "' ");
    var users = await app.db.sn_user().find({email: mail}).toArray();
    if (!users.length) {
      response.end('{error:"account not exists"}');
      return;
    }
    var buff = Buffer.alloc(64);
    var token = crypto.randomFillSync(buff).toString('hex');
    var update = await app.db.sn_user().updateOne({_id: Long.fromNumber(users[0]._id)}, {$set: {confirmation_token: token}});

    readHTMLFile(__dirname + '/../emails/reset_password.html', function(err, html) {
      var template = handlebars.compile(html);
      var replacements = {
        satt_url: app.config.basedURl,
        imgUrl: app.config.baseEmailImgURl,
        passrecover_url: app.config.baseUrl + 'auth/passrecover',
        user_id: users[0]._id,
        token_: token,
        expiring: Math.floor(Date.now() / 1000) + (60*60)
      };

      var htmlToSend = template(replacements);
      var mailOptions = {
        from: app.config.mailSender,
        to: users[0].email,
        subject: 'Satt wallet password recover',
        html: htmlToSend
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          response.end(JSON.stringify({'message' :'Email was sent to ' + users[0].email}));
        }
      });
    });
  });

  app.post('/auth/passchange', async function (req, response) {

    var newpass = req.body.newpass;
    var oldpass = req.body.oldpass;
    var id = req.body.id;
    var users = await app.db.sn_user().find({ _id:Long.fromNumber( id)}).toArray();
    if( users.length) {
      if (!users[0].enabled) {
        response.end('{error:"account not activated"}');
        return;
      }
      if (users[0].password != synfonyHash(oldpass)) {
        response.end('{error:"wrong password"}');
        return;
      }
      var res_ins = await app.db.sn_user().updateOne({_id: id}, {password: synfonyHash(newpass)});
      response.end('{message:"changed"}');
    } else {
      response.end('{error:"no account"}');
    }

  });

	app.post('/auth/passrecover', async function (req, response) {
	  var newpass = req.body.newpass;
	  var code = req.body.code;
	  var id = req.body.id;
	  var res = await app.db.sn_user().find({ _id:Long.fromNumber(id)}).toArray();
	  if( res.length) {
		if (res[0].confirmation_token != code) {

		  response.end(JSON.stringify({error:"Try again Confirmation Token has changes"}));
		  return;
		}
		//var res_ins = await app.db.sn_user().updateOne({_id: ObjectId(id)}, {password: synfonyHash(newpass), confirmation_token: "", enabled: 1});

		var update = await app.db.sn_user().updateOne({_id: Long.fromNumber(id)}, {$set: {password: synfonyHash(newpass), confirmation_token: "", enabled: 1}});
			console.log(update)

		response.end(JSON.stringify('successfully'));
	  } else {
		response.end(JSON.stringify("Account Not Found"));
		return;
	  }

	});

  return app;
}
