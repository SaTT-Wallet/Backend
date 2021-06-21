const console = require('console');
const { async } = require('hasha');

module.exports = function (app) {
  var nodemailer = require('nodemailer');
  var bad_login_limit = 5;
  var transporter = nodemailer.createTransport(app.config.mailerOptions);
  var  ObjectID = require('mongodb').ObjectID
  var bodyParser = require('body-parser');
  var rp = require('request-promise');
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use( bodyParser.json() )

  const crypto = require('crypto');
  const hasha = require('hasha');
  var handlebars = require('handlebars');
  const fs = require('fs');
  var Twitter = require('twitter');
  var Twitter2 = require('twitter-v2');


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
      var users = await app.db.sn_user().find({email: username.toLowerCase()}).toArray();

      if (users.length) {
        return done(null, false, {error: true, message: 'account_already_used'});
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          username: username.toLowerCase(),
          email: username.toLowerCase(),
          password: synfonyHash(password),
          created: mongodate,
          updated: mongodate,
          idSn: 0,
          locale: "en",
          onBoarding : false,
          enabled: 0,
          confirmation_token: code,
          "userSatt": true
        });

        var users = await app.db.sn_user().find({email: username.toLowerCase()}).toArray();
        const lang = req.query.lang || "en";

        app.i18n.configureTranslation(lang);
        readHTMLFile(__dirname + '/../emails/welcome.html', function(err, html) {
          var template = handlebars.compile(html);
          var replacements = {
            satt_faq : app.config.Satt_faq,
            satt_url: app.config.basedURl,
            imgUrl: app.config.baseEmailImgURl,
            validation_url: app.config.baseUrl + 'auth/activate/' + users[0]._id + "/" + code,
          };

          var htmlToSend = template(replacements);
          var mailOptions = {
            from: app.config.mailSender,
            to: users[0].email.toLowerCase(),
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

      var users = await app.db.sn_user().find({email: username.toLowerCase()}).toArray();
      if (users.length) {
        var user = users[0];
        // if (user.idSn != 0) {
        //   return done(null, false, {error: true, message: 'account_already_used'});
        // }
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
      var users = await app.db.sn_user().find({idOnSn:  profile._json.token_for_business}).toArray()
      if (users.length) {
        return cb('account_already_used&idSn='+users[0].idSn)
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        console.log("--------------")
        console.log(profile.email)
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          scopedId: profile.id,
          idOnSn: profile._json.token_for_business,
          email: profile.email,
          username: profile.name,
          firstName: profile.first_name,
          lastName: profile.displayName,
          created: mongodate,
          onBoarding : false,
          updated: mongodate,
          idSn: 1,
          locale: "en",
          enabled:1,
          confirmation_token: code,
          picLink:profile.photos.length ? profile.photos[0].value : false,
          userSatt: true
        });
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

      var users = await app.db.sn_user().find({idOnSn:  profile._json.token_for_business}).toArray()

      if (users.length) {
        var user = users[0];
        // if(!user.enabled){
        //   return cb('account not verified')
        // }
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


    passport.use('instalink_FbStrategy',new FbStrategy({
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + "callback/facebook_insta",
        profileFields: ['id', 'displayName', 'email', "picture.type(large)", "token_for_business"]
      },
      async function (accessToken, refreshToken, profile, cb) {


        var users = await app.db.sn_user().find({idOnSn:  profile._json.token_for_business}).toArray()
        if (!users.length) {
          return cb('Error: no account')
        } else {
          var longTokenUrl = "https://graph.facebook.com/"+app.config.fbGraphVersion+
          "/oauth/access_token?grant_type=fb_exchange_token&client_id="+app.config.appId+
          "&client_secret="+app.config.appSecret+"&fb_exchange_token="+accessToken;
          var resToken = await rp({uri:longTokenUrl,json: true});
          var longToken = resToken.access_token;



          var instagram_id = false;
          var accountsUrl = "https://graph.facebook.com/"+app.config.fbGraphVersion+"/me/accounts?fields=instagram_business_account,access_token,username&access_token="+accessToken;
          var res = await rp({uri:accountsUrl,json: true})
          while(true) {

            for (var i = 0;i<res.data.length;i++) {
              if(res.data[i].instagram_business_account) {
                instagram_id = res.data[i].instagram_business_account.id;
              }
              await app.db.fbPage().updateOne({id:res.data[i].id},{$set:{UserId:users[0]._id,username:res.data[i].username,token:res.data[i].access_token}},{ upsert: true });
            }
            if( !res.paging.next)
            {
              break;
            }
            res = await rp({uri:res.paging.next,json: true})
         }
         var fbProfile = false;
         fbProfile = await app.db.fbProfile().findOne({UserId:users[0]._id  });
         if(fbProfile) {
           var res_ins = await app.db.fbProfile().updateOne({UserId:users[0]._id  }, { $set: {accessToken:longToken}});
         }
         else {
             profile.accessToken = longToken;
             profile.UserId = users[0]._id;
             profile.instagram_id = instagram_id;
             var res_ins = await app.db.fbProfile().insertOne(profile);
         }

          var mesdiaUrl = "https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+instagram_id+"/media?fields=shortcode,like_count,owner&access_token="+accessToken;
          for (var res = await rp({uri:mesdiaUrl,json: true}); res.paging.next;  res = await rp({uri:res.paging.next,json: true})) {
            for (var i =0;i<res.data.length;i++) {
              var media = res.data[i];
              await app.db.ig_media().insertOne(media);
            }
          }

          return cb(null, {id: users[0]._id, token: accessToken});
        }
      }));

  passport.use('signup_googleStrategy', new GoogleStrategy({
      clientID: app.config.googleClientId,
      clientSecret: app.config.googleClientSecret,
      callbackURL: app.config.baseUrl + "callback/google_signup"
    },
    async function (accessToken, refreshToken, profile, cb) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({$or: [ {idOnSn2: profile.id},{email:profile._json.email}]}).toArray()
      if (users.length) {
        return cb('account_already_used&idSn='+users[0].idSn)
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        var insert = await app.db.sn_user().insertOne({
          _id:Long.fromNumber(await app.account.handleId()),
          idOnSn2: profile.id,
          email: profile.emails.length ? profile.emails[0].value:false,
          username: profile.displayName,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          created: mongodate,
          updated: mongodate,
          idSn: 2,
          onBoarding : false,
          enabled:1,
          locale: profile._json.locale,
          confirmation_token: code,
          userSatt: true,
          picLink:profile.photos.length ? profile.photos[0].value : false
        });
        console.log(profile)
        var users = await app.db.sn_user().find({idOnSn2: profile.id}).toArray();
        var res_ins = await app.db.accessToken().insertOne({client_id: 1, user_id: users[0]._id, token: token, expires_at: date, scope: "user,https://www.googleapis.com/auth/youtubepartner-channel-audit"});
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
        // if (user.idSn != 2) {
        //   return cb('account_already_used') //(null, false, {message: 'account_already_used'});
        // }
        // if(!user.enabled){
        //   return cb('account not verified')
        // }
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

      }
    }));


    passport.use('google_strategy_link', new GoogleStrategy({
      clientID: app.config.googleClientId,
      clientSecret: app.config.googleClientSecret,
      callbackURL: app.config.baseUrl + "callback/googlelink"
    },
    async function (accessToken, refreshToken, profile, cb) {

      var users = await app.db.sn_user().find({idOnSn2: profile.id}).toArray()
      if (users.length) {
        var user = users[0];


        var res = await rp({uri:'https://www.googleapis.com/youtube/v3/channels',qs:{access_token:accessToken,part:"snippet",mine:true},json: true});
        var channelId = res.items[0].id;



        var googleProfile = false;
        googleProfile = await app.db.googleProfile().findOne({UserId:users[0]._id  });
        if(googleProfile) {
          var res_ins = await app.db.googleProfile().updateOne({UserId:users[0]._id  }, { $set: {accessToken:accessToken}});
        }
        else {
            profile.accessToken = accessToken;
            profile.UserId = users[0]._id;
            profile.google_id = profile.id;
            profile.channelId = channelId;

            var res_ins = await app.db.googleProfile().insertOne(profile);
        }

        return cb(null, {id: user._id});
      } else {
        return cb ('Register First')

      }
    }));


    passport.use('twitter_link',new TwitterStrategy({
      consumerKey:app.config.twitter.consumer_key,
      consumerSecret:app.config.twitter.consumer_secret,
      callbackURL: app.config.baseUrl +'callback/twitter',
      passReqToCallback: true
    },
  async function(req, accessToken, tokenSecret, profile, cb) {

    var user_id = req.query.state;

    var tweet = new Twitter({
      consumer_key: app.config.twitter.consumer_key,
      consumer_secret: app.config.twitter.consumer_secret,
      access_token_key: req.accessToken,
      access_token_secret:req.tokenSecret
    });
    var res = await tweet.get('account/verify_credentials',{include_email :true});

    var twitterProfile = await app.db.twitterProfile().findOne({UserId:user_id  });
    if(twitterProfile) {
      var res_ins = await app.db.twitterProfile().updateOne({UserId:user_id  }, { $set: {access_token_key:req.accessToken,access_token_secret:req.tokenSecret}});
    }
    else {
        profile.access_token_key = req.accessToken;
        profile.access_token_secret:req.tokenSecret;
        profile.UserId = user_id;
        profile.username = res.screen_name;
        profile.twitter_id = twwet.id;

        var res_ins = await app.db.twitterProfile().insertOne(profile);
    }

    return cb(null, {id: user_id});
  }));





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
          return cb('account_already_used&idSn='+users[0].idSn);
        } else {
          var mongodate = new Date().toISOString();
          var buff2 = Buffer.alloc(32);
          var code = crypto.randomFillSync(buff2).toString('hex');
          var mydate = mongodate.slice(0, 19).replace('T', ' ');
          var insert = await app.db.sn_user().insertOne({
            _id:Long.fromNumber(await app.account.handleId()),
            idOnSn3: profile.id,
            username: profile.email,
            firstName: profile.first_name,
            lastName: profile.last_name,
            name: profile.username,
            picLink: profile.photo_url,
            created: mongodate,
            onBoarding : false,
            updated: mongodate,
            idSn: 5,
            locale: "en",
            confirmation_token: code,
            enabled:1,
            userSatt: true
          });
          var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray();
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
      console.log("telegram id",profile.id);
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
      if (users.length) {
        var user = users[0];
        // if (user.idSn != 5) {
        //   return cb('account_already_used') //(null, false, {message: 'account_already_used'});
        // }
        // if(!user.enabled){
        //   return cb('account not verified')
        // }
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

  passport.use('connect_google', new GoogleStrategy({
    clientID: app.config.googleClientId,
    clientSecret: app.config.googleClientSecret,
    callbackURL:app.config.baseUrl + "callback/connect/google",
    passReqToCallback: true
  },
  async function (req,accessToken, refreshToken, profile, done) {

    let user_id=+req.query.state;
    console.log(user_id);
    let userExist=await app.db.sn_user().find({idOnSn2:profile.id}).toArray();
    if(userExist.length){

               done(null,profile,{
              status: false,
              message: "account exist"
          })
    }else{
              await app.db.sn_user().updateOne({_id:user_id},{$set: {idOnSn2: profile.id}})
             done (null,profile, {status:true, message:'account_linked_with success'}) //(null, false, {message: 'account_invalide'});
    }
  }));

  passport.use("connect_facebook",new FbStrategy({
    clientID: app.config.appId,
    clientSecret: app.config.appSecret,
    callbackURL: app.config.baseUrl + "callback/connect/facebook",
    passReqToCallback: true,
    profileFields: ['id', 'email', "token_for_business"]
  },
  async function (req,accessToken, refreshToken, profile, cb) {
    let user_id=+req.query.state;
    let users = await app.db.sn_user().find({idOnSn:profile._json.token_for_business}).toArray()
    if(users.length){
      cb(null,profile,{
     status: false,
     message: "account exist"
 })
}else{
     await app.db.sn_user().updateOne({_id:user_id},{$set: {idOnSn: profile._json.token_for_business}})
    cb(null,profile, {
      status:true,
      message:'account_linked_with success'
    })
}
  }))


  passport.use("connect_telegram",new TelegramStrategy({
    botToken: app.config.telegramBotToken,
    passReqToCallback: true,
  },
  async function (req,profile, cb) {
    let user_id=+req.params.idUser;
    let users = await app.db.sn_user().find({idOnSn3: profile.id}).toArray()
    if(users.length){
      cb(null,profile,{message:"account exist"})
}else{
     await app.db.sn_user().updateOne({_id:user_id},{$set: {idOnSn3: profile.id}})
    cb (null,profile, {status:true, message:'account_linked_with success'}) //(null, false, {message: 'account_invalide'});
}
  }))



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

  app.get('/auth/fb_insta', passport.authenticate('instalink_FbStrategy',{ scope: ['email', 'read_insights','read_audience_network_insights','pages_show_list','instagram_basic','instagram_manage_insights','pages_read_engagement'] }));



  app.get('/auth/signup_google', passport.authenticate('signup_googleStrategy', {scope: ['profile','email']}));



  app.get('/auth/google', passport.authenticate('google_strategy', {scope: ['profile','email',]}));

  app.get('/auth/googlelink', passport.authenticate('google_strategy_link', {scope: ['profile','email',"https://www.googleapis.com/auth/youtube.readonly"]}));

app.get('/auth/twitterlink', passport.authenticate('twitter_link', {scope: ['profile','email']}));

  app.get('/auth/signup_telegram', passport.authenticate('signup_telegramStrategy'),
    function(req, res) {
      try {
        var param = {"access_token": req.user.token, "expires_in": req.user.expires_in, "token_type": "bearer", "scope": "user"};
        res.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
      } catch (e) {
        console.log(e)
      }
    },
    authErrorHandler);


app.get('/auth/admin/:userId', async (req, res)=>{
  try {
    const userId = +req.params.userId;
    if(userId === app.config.idNodeAdmin1 || userId === app.config.idNodeAdmin2){
    const token = await app.db.accessToken().findOne({user_id: userId});
    var param = {"access_token": token.token, "expires_in": token.expires_at, "token_type": "bearer", "scope": "user"};
      res.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
    }
} catch (err) {
	res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }
})

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
    authSignInErrorHandler);

  function authErrorHandler(err, req, res, next) {
    console.log(err)
    let message = err.message? err.message:err;
    res.redirect(app.config.basedURl +'/registration?message=' + message);
  }


  function authSignInErrorHandler(err, req, res, next) {
    console.log(err)
    let message = err.message? err.message:err;
    res.redirect(app.config.basedURl +'/login?message=' + message);
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
    authSignInErrorHandler);

    app.get('/callback/facebook_insta',
      passport.authenticate('instalink_FbStrategy'), async function (req, response) {
        try {
          response.end("ok")
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
    authSignInErrorHandler);


    app.get('/callback/googlelink', passport.authenticate('google_strategy_link', {scope: ['profile','email',"https://www.googleapis.com/auth/youtube.readonly"]}), async function (req, response) {
      try {
        response.end("ok")
      } catch (e) {
        console.log(e)
      }
      });

      app.get('/callback/twitter', passport.authenticate('twitter_link', {scope: ['profile','email']}), async function (req, response) {
        try {



          response.end("ok")
        } catch (e) {
          console.log(e)
        }
        });


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
        response.redirect(app.config.basedURl +'/login?message=' + message);
        return;
      }
      if (users[0].confirmation_token != code) {
        let message = "wrong activation";
        response.redirect(app.config.basedURl +'/login?message=' + message);
        //response.end('{error:"wrong activation"}');
        return;
      }
      var update = await app.db.sn_user().updateOne({_id:Long.fromNumber(id)}, {$set: {confirmation_token: "", enabled: 1}})
      let message = "activated";
      response.redirect(app.config.basedURl +'/login?message=' + message);
      //response.end('{message:"activated"}');
    } else {
      let message = "no account";
      response.redirect(app.config.basedURl +'/login?message=' + message);
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
        from: app.config.resetpassword_Email,
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
      if (users[0].password != synfonyHash(oldpass)) {
        response.end('{error:"wrong password"}');
        return;
      }
      var res_ins = await app.db.sn_user().updateOne({_id: id},{ $set:{password: synfonyHash(newpass)}});
      response.end('{message:"changed"}');
    } else {
      response.end('{error:"no account"}');
    }
  });

/**
 * @swagger
 * /v2/auth/passchange:
 *   post:
 *     summary: change password.
 *     description: parametres acceptées :body{user}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               oldpass:
 *                 type: string
 *               newpass:
 *                 type: string
 *     responses:
 *        "200":
 *          description: message:changed
 *        "500":
 *          description: error:wrong password
 */

  app.post('/v2/auth/passchange', async function (req, response) {
    var newpass = req.body.newpass;
    var oldpass = req.body.oldpass;
    var id = req.body.id;
    var users = await app.db.sn_user().find({ _id:Long.fromNumber( id)}).toArray();
    if( users.length) {
      if (users[0].password != synfonyHash(oldpass)) {
        response.end('{error:"wrong password"}').status(500);
        return;
      }
      var res_ins = await app.db.sn_user().updateOne({_id: id},{ $set:{password: synfonyHash(newpass)}});
      response.end('{message:"changed"}').status(200);
    } else {
      response.end('{error:"no account"}').status(500);
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


  app.post('/resend-confirmation-token/:email', async function (req, response) {
    try{
      var email=req.params.email;
      var users = await app.db.sn_user().find({email: email}).toArray();
      const lang = req.query.lang || "en";
      app.i18n.configureTranslation(lang);
      readHTMLFile(__dirname + '/../emails/welcome.html', function(err, html) {
        var template = handlebars.compile(html);
        var replacements = {
          satt_url: app.config.basedURl,
          imgUrl: app.config.baseEmailImgURl,
          validation_url: app.config.baseUrl + 'auth/activate/' + users[0]._id + "/" + users[0].confirmation_token,
        };
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: app.config.mailSender,
          to: users[0].email,
          subject: 'Satt wallet activation',
          html: htmlToSend
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            response.end(JSON.stringify({'message' :'Email sent'}));
          }

	      })
      })

    }catch(err){
      response.end('{"error":"'+(err.message?err.message:err.error)+'"}');

    }

    })

    app.get('/referral', async (req, res) => {
      let referral = req.query.code
      let userId = req.query.userID

        return res.end(JSON.stringify(await app.account.HandleReferral(referral, userId)))
    })



    /**
 * @swagger
 * /auth/social:
 *   post:
 *     summary: login or signup and login with social.
 *     description: parametres acceptées :body{user}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               email:
 *                 type: string
 *               familyName:
 *                 type: string
 *               givenName:
 *                 type: string
 *               idSn:
 *                 type: integer
 *               name:
 *                 type: string
 *               photo:
 *                 type: string
 *     responses:
 *        "200":
 *          description: access_token,expires_in,token_type,scope
 */
    app.post('/auth/social', async(req, res) => {
      try{
        var mongodate = new Date().toISOString();
        snUser={
         email:req.body.email,
         idSn:req.body.idSn,
         picLink:req.body.photo,
         username:req.body.name,
         first_name:req.body.givenName,
         name:req.body.familyName,
         enabled:1,
         created: mongodate,
         updated: mongodate,
         locale:"en",
         idOnSn2:req.body.id
        }


        var user=await app.db.sn_user().findOne({ $and: [{email: snUser.email},{idSn:snUser.idSn}]})
        if(user){
            var date = Math.floor(Date.now() / 1000) + 86400;
            var buff = Buffer.alloc(32);
            var token = crypto.randomFillSync(buff).toString('hex');
            var update = await app.db.accessToken().updateOne({user_id: user._id}, {$set: {token: token, expires_at: date}});
            var token = await app.db.accessToken().findOne({user_id: user._id});
          var param = {"access_token": token.token, "expires_in": token.expires_at, "token_type": "bearer", "scope": "user"};
          res.send(JSON.stringify(param))
        }else {
            var buff = Buffer.alloc(32);
            var token = crypto.randomFillSync(buff).toString('hex');
            var date = Math.floor(Date.now() / 1000) + 86400;
            var user=await app.db.sn_user().insertOne(snUser);
            await app.db.accessToken().insertOne({client_id: 1, user_id: user.ops[0]._id, token: token, expires_at: date, scope: "user"});
            var param = {"access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user"};
            res.send(JSON.stringify(param))
          }

      }catch(err){
        response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
      }

    });

    app.get('/onBoarding', async (req, res) => {
      try{
        let token = req.headers["authorization"].split(" ")[1];
			  const auth = await app.crm.auth(token);
        const id = +auth.id
        await app.db.sn_user().updateOne({_id: Long.fromNumber(id)}, {$set: {onBoarding: true}});
        res.send(JSON.stringify({success : "onBoarding updated"})).status(201);
      }catch (err) {
        res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
       }
    })
    /**
 * @swagger
 * /navigate/v1/{userId}:
 *   post:
 *     summary: redirect to v1 version.
 *     description: parametres acceptées :{userId}.
 *     parameters:
 *       - name: userId
 *         description: id user.
 *     responses:
 *        "redirect":
 *          description: redirect to v1 version
 */
    app.get('/navigate/v1/:userId', async (req, res)=>{
      try {
        const userId = +req.params.userId;
        OAAccessToken = await app.db.query("Select * from OAAccessToken where user_id = '"+userId+"'")
        OARefreshToken = await app.db.query("Select * from OARefreshToken where user_id = '"+userId+"'")
        var param ={"access_token":OAAccessToken[0].token,"expires_in":OAAccessToken[0].espires_at,
        "token_type":"bearer","scope":"user",
        "refresh_token":OARefreshToken[0].token}
          res.redirect(app.config.v1Url +"?token=" + JSON.stringify(param))

    } catch (err) {
      res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
     }
    })


    app.get('/connect/google/:idUser', (req, res,next)=>{
      passport.authenticate('connect_google', {scope: ['profile','email'],state:req.params.idUser})(req,res,next)
    });

  app.get('/callback/connect/google',passport.authenticate('connect_google'), async  (req, res)=> {
    let message = req.authInfo.message
    res.redirect(app.config.basedURl +'/profile/networks?message=' + message);
  });

  app.get('/connect/facebook/:idUser', (req, res,next)=>{
    passport.authenticate('connect_facebook', {state:req.params.idUser})(req,res,next)
  });


  app.get('/callback/connect/facebook',passport.authenticate('connect_facebook'), async  (req, res)=> {
    res.redirect(app.config.basedURl +'/profile/networks?message=' + req.authInfo.message);
  });

  app.put('/updateUserEmail', async (req, res)=>{
    try {

      var users=await app.db.sn_user().find({ $and: [{email:{$regex : /[A-Z]/ }},{userSatt : true}]}).toArray();
      users.forEach(async (user)=>{
        await app.db.sn_user().updateOne({_id:user._id},{$set:{email:user.email.toLowerCase()}});
      })

      res.send(JSON.stringify("success"))

  } catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
   }
  })
  app.get('/connect/telegram/:idUser',
    passport.authenticate('connect_telegram'),
    function(req, res) {
      try {
        res.redirect(app.config.basedURl +"/profile/networks?message=" + req.authInfo.message)
      } catch (e) {
        console.log(e)
      }
    }
    );


  app.get('/callback/connect/telegram',passport.authenticate('connect_telegram'), async  (req, res)=> {
    res.redirect(app.config.basedURl +'/profile/networks?message=' + req.authInfo.message);
  });


  app.put('/deconnect/facebook', async  (req, res) => {
    try{
    let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
    let id = auth.id;
    let user = await app.db.sn_user().updateOne({ _id:Long.fromNumber(id)},{$set:{idOnSn: null}});
    res.end(JSON.stringify({message:"deconnect successfully"})).status(200);

  } catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
   }
  });

  app.put('/deconnect/google', async  (req, res) => {
    try{
    let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
    let id = auth.id;
    let user = await app.db.sn_user().updateOne({ _id:Long.fromNumber(id)},{$set:{idOnSn2: null}});
    res.end(JSON.stringify({message:"deconnect successfully"})).status(200);

  } catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
   }
  });

  app.put('/deconnect/telegram', async  (req, res) => {
    try{
    let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
    let id = auth.id;
    let user = await app.db.sn_user().updateOne({ _id:Long.fromNumber(id)},{$set:{idOnSn3: null}});
    res.end(JSON.stringify({message:"deconnect successfully"})).status(200);

  } catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
   }
  });


  app.post('/check/pass', async  (req, res) => {
    try{
    let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
    let walletpass = req.body.password;
    let id = auth.id;
    let user = await app.db.sn_user().findOne({ _id:Long.fromNumber(id)});
      if (user.password != synfonyHash(walletpass)) {
      res.end(JSON.stringify({message:"Not the same password"})).status(200);
    } else {
      res.end(JSON.stringify({error:"same password"})).status(500);
    }
  } catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
   }
  });

  return app;
}
