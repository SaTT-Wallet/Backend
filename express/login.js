const console = require('console');
const { auth } = require('google-auth-library');
const { async } = require('hasha');

module.exports = function (app) {
  var nodemailer = require('nodemailer');

  var transporter = nodemailer.createTransport(app.config.mailerOptions);
  var ObjectID = require('mongodb').ObjectID;
  var bodyParser = require('body-parser');
  var rp = require('request-promise');
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  const crypto = require('crypto');
  const hasha = require('hasha');
  var handlebars = require('handlebars');
  const fs = require('fs');
  var Twitter = require('twitter');
  var Twitter2 = require('twitter-v2');
  ObjectId = require('mongodb').ObjectID;
  var Long = require('mongodb').Long;
  var passport = require('passport');
  var LocalStrategy = require('passport-local').Strategy;
  var emailStrategy = require('passport-local').Strategy;
  var FbStrategy = require('passport-facebook').Strategy;
  var GoogleStrategy = require('passport-google-oauth20').Strategy;
  let LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
  var TwitterStrategy = require('passport-twitter').Strategy;
  var TelegramStrategy = require('passport-telegram-official').TelegramStrategy;
  var session = require('express-session');
  const speakeasy = require('speakeasy');
  const qrcode = require('qrcode');

  try {
    app.use(
      session({ secret: 'fe3fF4FFGTSCSHT57UI8I8', resave: true, saveUninitialized: true })
    ); // session secret
    app.use(passport.initialize());
    app.use(passport.session());
  } catch (e) {
    console.log(e);
  }

  var readHTMLFile = function (path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      } else {
        callback(null, html);
      }
    });
  };

  var synfonyHash = function (pass) {
    var salted = pass + '{' + app.config.symfonySalt + '}';

    var buff = hasha(salted, { encoding: 'buffer' });
    var saltBuff = Buffer.from(salted);
    var arr = [];

    for (var i = 1; i < 5000; i++) {
      arr = [buff, saltBuff];
      buff = hasha(Buffer.concat(arr), { algorithm: 'sha512', encoding: 'buffer' });
    }

    const base64 = buff.toString('base64');
    return base64;
  };

  app.use((req, res, next) => {
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip) ip = ip.split(':')[3];
    req.addressIp = ip;
    next();
  });

  passport.use(
    'signup_emailStrategy',
    new LocalStrategy({ passReqToCallback: true }, async function (
      req,
      username,
      password,
      done
    ) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);

      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db
        .sn_user()
        .find({ email: username.toLowerCase() })
        .toArray();

      if (users.length) {
        return done(null, false, { error: true, message: 'account_already_used' });
      } else {
        var mongodate = new Date().toISOString();
        var mydate = mongodate.slice(0, 19).replace('T', ' ');
        var buff2 = Buffer.alloc(32);
        var code = crypto.randomFillSync(buff2).toString('hex');
        let _id = await app.account.handleId();
        let insert = await app.db.sn_user().insertOne({
          _id: Long.fromNumber(_id),
          username: username.toLowerCase(),
          email: username.toLowerCase(),
          password: synfonyHash(password),
          created: mongodate,
          updated: mongodate,
          newsLetter: req.body.newsLetter,
          idSn: 0,
          account_locked: false,
          failed_count: 0,

          locale: 'en',
          onBoarding: false,
          enabled: 0,
          confirmation_token: code,
          userSatt: true,
        });
        let user = await app.db.sn_user().findOne({ _id: insert.insertedId });
        const lang = req.query.lang || 'en';
        const validationCode = await app.account.updateAndGenerateCode(
          user._id,
          'validation'
        );
        app.i18n.configureTranslation(lang);
        readHTMLFile(__dirname + '/../emails/welcome.html', (err, html) => {
          var template = handlebars.compile(html);
          var replacements = {
            satt_faq: app.config.Satt_faq,
            satt_url: app.config.basedURl,
            // code,
            imgUrl: app.config.baseEmailImgURl,
            validation_url:
              app.config.baseUrl + 'auth/activate/' + user._id + '/' + validationCode,
          };

          var htmlToSend = template(replacements);
          var mailOptions = {
            from: app.config.mailSender,
            to: user.email.toLowerCase(),
            subject: 'Satt wallet activation',
            html: htmlToSend,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              app.account.sysLogError(error);
            } else {
              app.account.log('Email sent: ', user.email.toLowerCase());
            }
          });
        });
        req.session.user = user._id;
        return done(null, {
          id: user._id,
          token: token,
          expires_in: date,
          noredirect: req.body.noredirect,
        });
      }
    })
  );

  passport.use(
    'emailStrategy',
    new emailStrategy({ passReqToCallback: true }, async function (
      req,
      username,
      password,
      done
    ) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');

      var users = await app.db
        .sn_user()
        .find({ email: username.toLowerCase() })
        .toArray();

      if (users.length) {
        var user = users[0];
        // var res = await app.db.query(
        //   `Select id,password from user where id=${user._id} `
        // );
        // if (res.length && !user.password) {
        //   await app.db
        //     .sn_user()
        //     .updateOne(
        //       { _id: Long.fromNumber(user._id) },
        //       { $set: { password: res[0].password } }
        //     );
        // }
        if (user.password == synfonyHash(password)) {
          app.account.sysLog('authentification', req.addressIp, `valid ${username}`);
          let validAuth = await app.account.isBlocked(user, true);
          if (!validAuth.res && validAuth.auth == true) {
            var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
            if (oldToken) {
              await app.db
                .accessToken()
                .updateOne({ user_id: user._id }, { $set: { token, expires_at: date } });
              await app.db
                .sn_user()
                .updateOne(
                  { _id: Long.fromNumber(user._id) },
                  { $set: { failed_count: 0 } }
                );
            } else {
              await app.db.accessToken().insertOne({
                client_id: 1,
                user_id: user._id,
                token,
                expires_at: date,
                scope: 'user',
              });
            }

            req.session.user = user._id;

            return done(null, {
              id: user._id,
              token: token,
              expires_in: date,
              noredirect: req.body.noredirect,
            });
          } else {
            return done(null, false, {
              error: true,
              message: 'account_locked',
              blockedDate: validAuth.blockedDate,
            });
          }
        } else {
          let validAuth = await app.account.isBlocked(user, false);
          app.account.sysLog(
            'authentification',
            req.addressIp,
            `invalid ${username} ${password}`
          );
          if (validAuth.res)
            return done(null, false, {
              error: true,
              message: 'account_locked',
              blockedDate: validAuth.blockedDate,
            });
          return done(null, false, { error: true, message: 'invalid_grant' }); //done("auth failed",null);
        }
      } else {
        return done(null, false, { error: true, message: 'invalid_grant' });
      }
    })
  );

  passport.use(
    'signup_FbStrategy',
    new FbStrategy(
      {
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + 'callback/facebook_signup',
        profileFields: [
          'id',
          'displayName',
          'email',
          'picture.type(large)',
          'token_for_business',
        ],
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db
          .sn_user()
          .find({ idOnSn: profile._json.token_for_business })
          .toArray();
        if (users.length) {
          return cb('account_already_used&idSn=' + users[0].idSn);
        } else {
          var mongodate = new Date().toISOString();
          var mydate = mongodate.slice(0, 19).replace('T', ' ');
          var buff2 = Buffer.alloc(32);
          var code = crypto.randomFillSync(buff2).toString('hex');
          var id = Long.fromNumber(await app.account.handleId());
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
            locale: 'en',
            enabled: 1,
            confirmation_token: code,
            picLink: profile.photos.length ? profile.photos[0].value : false,
            userSatt: true,
          });
          await app.db.accessToken().insertOne({
            client_id: 1,
            user_id: id,
            token: token,
            expires_at: date,
            scope: 'user',
          });
          //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?",{client_id:1,user_id:user._id,token:token,expires_at:date,scope:"user"});
          req.session.user = id;
          return cb(null, { id: id, token: token, expires_in: date });
        }
      }
    )
  );
  passport.use(
    'facebook_strategy',
    new FbStrategy(
      {
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + 'callback/facebook',
        profileFields: [
          'id',
          'displayName',
          'email',
          'picture.type(large)',
          'token_for_business',
        ],
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');

        var users = await app.db
          .sn_user()
          .find({ idOnSn: profile._json.token_for_business })
          .toArray();

        if (users.length) {
          var user = users[0];
          // if(!user.enabled){
          //   return cb('account not verified')
          // }
          if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`;
            return cb({ error: true, message, blockedDate: user.date_locked });
          }
          var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
          if (oldToken) {
            var update = await app.db
              .accessToken()
              .updateOne(
                { user_id: user._id },
                { $set: { token: token, expires_at: date } }
              );
          } else {
            var insert = await app.db.accessToken().insertOne({
              client_id: 1,
              user_id: user._id,
              token: token,
              expires_at: date,
              scope: 'user',
            });
          }
          /*var res = await app.db.query("delete from OAAccessToken where user_id='"+user._id+"' ");
        var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
*/
          req.session.user = users[0]._id;
          return cb(null, { id: user._id, token: token, expires_in: date });
        } else {
          return cb('Register First'); // (null, false, {error: true, message: 'account_invalide'});
        }
      }
    )
  );

  passport.use(
    'instalink_FbStrategy',
    new FbStrategy(
      {
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + 'callback/facebook_insta',
        profileFields: [
          'id',
          'displayName',
          'email',
          'picture.type(large)',
          'token_for_business',
        ],
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        let info = req.query.state.split(' ');
        var user_id = +info[0];
        var fbProfile = false;
        var message = 'account_linked_with_success';
        var isInsta = false;

        var longTokenUrl =
          'https://graph.facebook.com/' +
          app.config.fbGraphVersion +
          '/oauth/access_token?grant_type=fb_exchange_token&client_id=' +
          app.config.appId +
          '&client_secret=' +
          app.config.appSecret +
          '&fb_exchange_token=' +
          accessToken;
        var resToken = await rp({ uri: longTokenUrl, json: true });
        var longToken = resToken.access_token;
        var instagram_id = false;
        var accountsUrl =
          'https://graph.facebook.com/' +
          app.config.fbGraphVersion +
          '/me/accounts?fields=instagram_business_account,access_token,username,name,picture&access_token=' +
          accessToken;
        var res = await rp({ uri: accountsUrl, json: true });
        if (res.data.length === 0)
          return cb(
            null,
            { id: user_id, token: accessToken },
            { message: 'channel_obligatoire' }
          );

        while (true) {
          for (var i = 0; i < res.data.length; i++) {
            let page = {
              UserId: user_id,
              username: res.data[i].username,
              token: res.data[i].access_token,
              picture: res.data[i].picture.data.url,
              name: res.data[i].name,
            };
            if (res.data[i].instagram_business_account) {
              if (!isInsta) {
                message += '_instagram_facebook';
                isInsta = true;
              }
              instagram_id = res.data[i].instagram_business_account.id;
              page.instagram_id = instagram_id;
              var media =
                'https://graph.facebook.com/' +
                app.config.fbGraphVersion +
                '/' +
                instagram_id +
                '?fields=username&access_token=' +
                accessToken;
              var resMedia = await rp({ uri: media, json: true });
              page.instagram_username = resMedia.username;
            }

            await app.db
              .fbPage()
              .updateOne({ id: res.data[i].id }, { $set: page }, { upsert: true });
          }
          if (!res.paging || !res.paging.next) {
            break;
          }
          res = await rp({ uri: res.paging.next, json: true });
        }
        fbProfile = await app.db.fbProfile().findOne({ UserId: user_id });
        if (fbProfile) {
          var res_ins = await app.db
            .fbProfile()
            .updateOne({ UserId: user_id }, { $set: { accessToken: longToken } });
        } else {
          profile.accessToken = longToken;
          profile.UserId = user_id;
        }

        var res_ins = await app.db.fbProfile().insertOne(profile);

        if (!isInsta && res.data.length > 0) message += '_facebook';

        return cb(null, { id: user_id, token: accessToken }, { message: message });
      }
    )
  );

  passport.use(
    'facebook_strategy_add_channel',
    new FbStrategy(
      {
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + 'callback/facebookChannel',
        profileFields: [
          'id',
          'displayName',
          'email',
          'picture.type(large)',
          'token_for_business',
        ],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, cb) => {
        const longTokenUrl =
          'https://graph.facebook.com/' +
          app.config.fbGraphVersion +
          '/oauth/access_token?grant_type=fb_exchange_token&client_id=' +
          app.config.appId +
          '&client_secret=' +
          app.config.appSecret +
          '&fb_exchange_token=' +
          accessToken;
        let resToken = await rp({ uri: longTokenUrl, json: true });
        let longToken = resToken.access_token;
        let UserId = +req.query.state.split('|')[0];
        let isInsta = false;
        let fbProfile = await app.db.fbProfile().findOne({ UserId });
        // if(fbProfile && fbProfile.id !== profile.id){
        //   cb (null,profile,{
        //     message: "external_account"
        // })
        // }
        //  else{
        let message = await app.account.getFacebookPages(UserId, accessToken, isInsta);
        if (fbProfile) {
          await app.db
            .fbProfile()
            .updateOne({ UserId }, { $set: { accessToken: longToken } });
        } else {
          [profile.accessToken, profile.UserId] = [longToken, UserId];
          await app.db.fbProfile().insertOne(profile);
        }
        return cb(null, { id: UserId, token: accessToken }, { message });
        // }
      }
    )
  );

  app.delete('/google/all/channels', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      await app.db.googleProfile().deleteMany({ UserId: auth.id });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/facebook/all/channels', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      let UserId = auth.id;
      await app.db.fbPage().deleteMany({ UserId });
      await app.db.fbProfile().deleteMany({ UserId });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/linkedin/all/channels', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      let userId = auth.id;
      await app.db.linkedinProfile().updateOne({ userId }, { $set: { pages: [] } });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  passport.use(
    'signup_googleStrategy',
    new GoogleStrategy(
      {
        clientID: app.config.googleClientId,
        clientSecret: app.config.googleClientSecret,
        callbackURL: app.config.baseUrl + 'callback/google_signup',
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db
          .sn_user()
          .find({ $or: [{ idOnSn2: profile.id }, { email: profile._json.email }] })
          .toArray();
        if (users.length) {
          return cb('account_already_used&idSn=' + users[0].idSn);
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
            picLink: profile.photos.length ? profile.photos[0].value : false,
          });
          console.log(profile);
          var users = insert.ops;
          var res_ins = await app.db.accessToken().insertOne({
            client_id: 1,
            user_id: users[0]._id,
            token: token,
            expires_at: date,
            scope: 'user,https://www.googleapis.com/auth/youtubepartner-channel-audit',
          });
          req.session.user = users[0]._id;
          return cb(null, { id: profile.id, token: token, expires_in: date });
        }
      }
    )
  );

  passport.use(
    'google_strategy',
    new GoogleStrategy(
      {
        clientID: app.config.googleClientId,
        clientSecret: app.config.googleClientSecret,
        callbackURL: app.config.baseUrl + 'callback/google',
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({ idOnSn2: profile.id }).toArray();
        if (users.length) {
          var user = users[0];
          // if (user.idSn != 2) {
          //   return cb('account_already_used') //(null, false, {message: 'account_already_used'});
          // }
          // if(!user.enabled){
          //   return cb('account not verified')
          // }
          if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`;
            return cb({ error: true, message, blockedDate: user.date_locked });
          }
          var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
          if (oldToken) {
            var update = await app.db
              .accessToken()
              .updateOne(
                { user_id: user._id },
                { $set: { token: token, expires_at: date } }
              );
          } else {
            var insert = await app.db.accessToken().insertOne({
              client_id: 1,
              user_id: user._id,
              token: token,
              expires_at: date,
              scope: 'user',
            });
          }
          req.session.user = user._id;
          //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          return cb(null, { id: user._id, token: token, expires_in: date });
        } else {
          return cb('Register First'); //(null, false, {message: 'account_invalide'});
        }
      }
    )
  );

  passport.use(
    'google_strategy_link',
    new GoogleStrategy(
      {
        clientID: app.config.googleClientId,
        clientSecret: app.config.googleClientSecret,
        callbackURL: app.config.baseUrl + 'callback/googlelink',
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        let info = req.query.state.split(' ');
        var user_id = +info[0];
        var res = await rp({
          uri: 'https://www.googleapis.com/youtube/v3/channels',
          qs: { access_token: accessToken, part: 'snippet', mine: true },
          json: true,
        });

        if (res.pageInfo.totalResults == 0) {
          cb(null, profile, {
            message: 'channel obligatoire',
          });
        }
        var channelId = res.items[0].id;
        var googleProfile = false;
        googleProfile = await app.db.googleProfile().findOne({ UserId: user_id });
        if (googleProfile) {
          var options = {
            method: 'POST',
            uri: 'https://oauth2.googleapis.com/token',
            body: {
              client_id: app.config.googleClientId,
              client_secret: app.config.googleClientSecret,
              refresh_token: refreshToken,
              grant_type: 'refresh_token',
            },
            json: true,
          };
          result = await rp(options);
          await app.db
            .googleProfile()
            .updateOne(
              { UserId: user_id },
              { $set: { accessToken: result.accessToken } }
            );
        } else {
          var result = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/channels',
            qs: {
              id: channelId,
              key: app.config.gdataApiKey,
              part: 'statistics,snippet',
            },
            json: true,
          });
          user_google = {};
          user_google.refreshToken = refreshToken;
          user_google.accessToken = accessToken;
          user_google.UserId = user_id;
          user_google.google_id = profile.id;
          user_google.channelTitle = result.items[0].snippet.title;
          user_google.channelImage = result.items[0].snippet.thumbnails;
          user_google.channelStatistics = result.items[0].statistics;
          user_google.channelId = channelId;
          await app.db.googleProfile().insertOne(user_google);
        }

        return cb(null, { id: user_id });
      }
    )
  );

  passport.use(
    'google_strategy_add_channel',
    new GoogleStrategy(
      {
        clientID: app.config.googleClientId,
        clientSecret: app.config.googleClientSecret,
        callbackURL: app.config.baseUrl + 'callback/googleChannel',
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        var user_id = +req.query.state.split('|')[0];
        var res = await rp({
          uri: 'https://www.googleapis.com/youtube/v3/channels',
          qs: { access_token: accessToken, part: 'snippet', mine: true },
          json: true,
        });
        console.log('result', res);
        if (res.pageInfo.totalResults == 0) {
          cb(null, profile, {
            message: 'channel obligatoire',
          });
        }
        var channelId = res.items[0].id;
        var channelGoogle = await app.db
          .googleProfile()
          .find({ channelId: channelId, UserId: user_id })
          .toArray();
        if (channelGoogle.length > 0) {
          cb(null, profile, {
            message: 'account exist',
          });
        } else {
          var result = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/channels',
            qs: {
              id: channelId,
              key: app.config.gdataApiKey,
              part: 'statistics,snippet',
            },
            json: true,
          });
          user_google = {};
          user_google.refreshToken = refreshToken;
          user_google.accessToken = accessToken;
          user_google.UserId = user_id;
          user_google.google_id = profile.id;
          user_google.channelTitle = result.items[0].snippet.title;
          user_google.channelImage = result.items[0].snippet.thumbnails;
          user_google.channelStatistics = result.items[0].statistics;
          user_google.channelId = channelId;
          await app.db.googleProfile().insertOne(user_google);

          return cb(null, { id: user_id });
        }
      }
    )
  );

  app.get('/socialAccounts', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      var auth = await app.crm.auth(token);
      var UserId = +auth.id;
      let networks = {};
      var channelsGoogle = await app.db.googleProfile().find({ UserId }).toArray();
      var channelsTwitter = await app.db.twitterProfile().find({ UserId }).toArray();
      let channelsFacebook = await app.db.fbPage().find({ UserId }).toArray();
      let channelsLinkedin = await app.db.linkedinProfile().findOne({ userId: UserId });

      networks.google = channelsGoogle;
      networks.twitter = channelsTwitter;
      networks.facebook = channelsFacebook;
      networks.linkedin = channelsLinkedin?.pages || [];
      response.send(JSON.stringify(networks));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/googleChannels/:id', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      await app.crm.auth(token);
      var id = req.params.id;
      await app.db.googleProfile().deleteOne({ _id: app.ObjectId(id) });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/twitter/:id', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      await app.crm.auth(token);
      var id = req.params.id;
      await app.db.twitterProfile().deleteOne({ _id: app.ObjectId(id) });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/google/all/channels', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      await app.db.googleProfile().deleteMany({ UserId: auth.id });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.delete('/facebookChannels/:id', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      await app.crm.auth(token);
      var id = req.params.id;
      await app.db.fbPage().deleteOne({ _id: app.ObjectId(id) });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });
  app.get('/twitter/all', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      await app.db.twitterProfile().deleteMany({ UserId: auth.id });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });
  app.delete('/linkedinChannels/:organization', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      var organization = req.params.organization;
      await app.db
        .linkedinProfile()
        .updateOne({ userId: auth.id }, { $pull: { pages: { organization } } });
      response.end(JSON.stringify({ message: 'deleted successfully' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  passport.use(
    'twitter_link',
    new TwitterStrategy(
      {
        consumerKey: app.config.twitter.consumer_key,
        consumerSecret: app.config.twitter.consumer_secret,
        callbackURL: app.config.baseUrl + 'callback/twitter',
        passReqToCallback: true,
      },
      async function (req, accessToken, tokenSecret, profile, cb) {
        let info = req.session.state.split(' ');
        var user_id = +info[0];

        var tweet = new Twitter({
          consumer_key: app.config.twitter.consumer_key,
          consumer_secret: app.config.twitter.consumer_secret,
          access_token_key: accessToken,
          access_token_secret: tokenSecret,
        });
        var res = await tweet.get('account/verify_credentials', { include_email: true });

        var twitterProfile = await app.db.twitterProfile().findOne({ UserId: user_id });
        if (twitterProfile) {
          var res_ins = await app.db.twitterProfile().updateOne(
            { UserId: user_id },
            {
              $set: { access_token_key: accessToken, access_token_secret: tokenSecret },
            }
          );
        } else {
          profile.access_token_key = accessToken;
          profile.access_token_secret = tokenSecret;
          profile.UserId = user_id;
          profile.subscibers = res.followers_count;
          profile.username = res.screen_name;
          profile.twitter_id = res.id;

          var res_ins = await app.db.twitterProfile().insertOne(profile);
        }
        return cb(null, { id: user_id });
      }
    )
  );

  passport.use(
    'add_twitter_link',
    new TwitterStrategy(
      {
        consumerKey: app.config.twitter.consumer_key,
        consumerSecret: app.config.twitter.consumer_secret,
        callbackURL: app.config.baseUrl + 'callback/add/twitter',
        passReqToCallback: true,
      },
      async function (req, accessToken, tokenSecret, profile, cb) {
        let user_id = +req.session.state.split('|')[0];

        var tweet = new Twitter({
          consumer_key: app.config.twitter.consumer_key,
          consumer_secret: app.config.twitter.consumer_secret,
          access_token_key: accessToken,
          access_token_secret: tokenSecret,
        });
        var res = await tweet.get('account/verify_credentials', { include_email: true });
        var twitterProfile = await app.db
          .twitterProfile()
          .findOne({ $and: [{ UserId: user_id }, { twitter_id: res.id }] });
        if (twitterProfile) {
          cb(null, profile, {
            status: false,
            message: 'account exist',
          });
        } else {
          profile.access_token_key = accessToken;
          profile.access_token_secret = tokenSecret;
          profile.UserId = user_id;
          profile.username = res.screen_name;
          profile.subscibers = res.followers_count;
          profile.twitter_id = res.id;

          var res_ins = await app.db.twitterProfile().insertOne(profile);
        }
        return cb(null, { id: user_id });
      }
    )
  );

  passport.use(
    'signup_telegramStrategy',
    new TelegramStrategy(
      {
        botToken: app.config.telegramBotToken,
        passReqToCallback: true,
      },
      async function (req, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray();
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
            locale: 'en',
            confirmation_token: code,
            enabled: 1,
            userSatt: true,
          });
          var users = insert.ops;
          var res_ins = await app.db.accessToken().insertOne({
            client_id: 1,
            user_id: users[0]._id,
            token: token,
            expires_at: date,
            scope: 'user',
          });
          req.session.user = users[0]._id;
          return cb(null, { id: users[0]._id, token: token, expires_in: date });
        }
      }
    )
  );

  passport.use(
    'telegramStrategy',
    new TelegramStrategy(
      {
        botToken: app.config.telegramBotToken,
        passReqToCallback: true,
      },
      async function (req, profile, cb) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray();
        if (users.length) {
          var user = users[0];
          // if (user.idSn != 5) {
          //   return cb('account_already_used') //(null, false, {message: 'account_already_used'});
          // }
          // if(!user.enabled){
          //   return cb('account not verified')
          // }
          if (user.account_locked) {
            let message = `account_locked:${user.date_locked}`;
            return cb({ error: true, message, blockedDate: user.date_locked });
          }
          var oldToken = await app.db.accessToken().findOne({ user_id: user._id });
          if (oldToken) {
            var update = await app.db
              .accessToken()
              .updateOne(
                { user_id: user._id },
                { $set: { token: token, expires_at: date } }
              );
          } else {
            var insert = await app.db.accessToken().insertOne({
              client_id: 1,
              user_id: user._id,
              token: token,
              expires_at: date,
              scope: 'user',
            });
          }
          req.session.user = user._id;
          //var res_ins = await app.db.insert("INSERT INTO OAAccessToken SET ?", {client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user"});
          return cb(null, { id: user._id, token: token, expires_in: date });
        } else {
          return cb('account_invalide');
        }
      }
    )
  );

  passport.use(
    'connect_google',
    new GoogleStrategy(
      {
        clientID: app.config.googleClientId,
        clientSecret: app.config.googleClientSecret,
        callbackURL: app.config.baseUrl + 'callback/connect/google',
        passReqToCallback: true,
      },
      async function (req, accessToken, refreshToken, profile, done) {
        let state = req.query.state.split('|');
        let user_id = +state[0];
        let userExist = await app.db.sn_user().find({ idOnSn2: profile.id }).toArray();
        if (userExist.length) {
          done(null, profile, {
            status: false,
            message: 'account exist',
          });
        } else {
          await app.db
            .sn_user()
            .updateOne({ _id: user_id }, { $set: { idOnSn2: profile.id } });
          done(null, profile, { status: true, message: 'account_linked_with success' }); //(null, false, {message: 'account_invalide'});
        }
      }
    )
  );

  passport.use(
    'connect_facebook',
    new FbStrategy(
      {
        clientID: app.config.appId,
        clientSecret: app.config.appSecret,
        callbackURL: app.config.baseUrl + 'callback/connect/facebook',
        passReqToCallback: true,
        profileFields: ['id', 'email', 'token_for_business'],
      },
      async function (req, accessToken, refreshToken, profile, cb) {
        let state = req.query.state.split('|');
        let user_id = +state[0];
        let users = await app.db
          .sn_user()
          .find({ idOnSn: profile._json.token_for_business })
          .toArray();
        if (users.length) {
          cb(null, profile, {
            status: false,
            message: 'account exist',
          });
        } else {
          await app.db
            .sn_user()
            .updateOne(
              { _id: user_id },
              { $set: { idOnSn: profile._json.token_for_business } }
            );
          cb(null, profile, {
            status: true,
            message: 'account_linked_with success',
          });
        }
      }
    )
  );

  passport.use(
    'connect_telegram',
    new TelegramStrategy(
      {
        botToken: app.config.telegramBotToken,
        passReqToCallback: true,
      },
      async function (req, profile, cb) {
        let user_id = +req.params.idUser;

        let users = await app.db.sn_user().find({ idOnSn3: profile.id }).toArray();
        if (users.length) {
          cb(null, profile, { message: 'account exist' });
        } else {
          await app.db
            .sn_user()
            .updateOne({ _id: user_id }, { $set: { idOnSn3: profile.id } });
          cb(null, profile, { status: true, message: 'account_linked_with success' }); //(null, false, {message: 'account_invalide'});
        }
      }
    )
  );

  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(async function (id, cb) {
    var users = await app.db
      .sn_user()
      .find({ _id: Long.fromNumber(id) })
      .toArray();
    cb(null, users[0]);
  });

  app.post('/auth/signup', (req, res, next) => {
    passport.authenticate('signup_emailStrategy', (err, user, info) => {
      if (err) {
        return res.end(JSON.stringify(err));
      }

      if (!user) {
        return res.end(JSON.stringify(info));
      }

      req.logIn(user, function (err) {
        var param = {
          access_token: user.token,
          expires_in: user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        return res.end(JSON.stringify(param));
        //return res.redirect('/');
      });
    })(req, res, next);
  });

  passport.use(
    'signup_emailStrategy_code',
    new LocalStrategy({ passReqToCallback: true }, async function (
      req,
      username,
      password,
      done
    ) {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);

      var token = crypto.randomFillSync(buff).toString('hex');
      var users = await app.db
        .sn_user()
        .find({ email: username.toLowerCase() })
        .toArray();

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
          locale: 'en',
          onBoarding: false,
          enabled: 0,
          confirmation_token: codex,
          userSatt: true,
        });

        let users = insert.ops;
        const lang = req.query.lang || 'en';
        const code = await app.account.updateAndGenerateCode(users[0]._id, 'validation');
        app.i18n.configureTranslation(lang);
        readHTMLFile(
          __dirname + '/emailtemplate/email_validated_code.html',
          (err, html) => {
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
              html: htmlToSend,
            };
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                app.account.sysLogError(error);
              } else {
                app.account.log('Email sent: ', users[0].email.toLowerCase());
              }
            });
          }
        );
        req.session.user = users[0]._id;
        return done(null, {
          id: users[0]._id,
          token: token,
          expires_in: date,
          noredirect: req.body.noredirect,
        });
      }
    })
  );

  app.post('/v2/auth/signup', (req, res, next) => {
    passport.authenticate('signup_emailStrategy_code', (err, user, info) => {
      if (err) {
        return res.end(JSON.stringify(err));
      }

      if (!user) {
        return res.end(JSON.stringify(info));
      }

      req.logIn(user, function (err) {
        var param = {
          access_token: user.token,
          expires_in: user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        return res.end(JSON.stringify(param));
        //return res.redirect('/');
      });
    })(req, res, next);
  });

  app.post('/auth/email', (req, res, next) => {
    passport.authenticate('emailStrategy', (err, user, info) => {
      if (err) {
        return res.end(JSON.stringify(err));
      }

      if (!user) {
        return res.end(JSON.stringify(info));
      }

      req.logIn(user, function (err) {
        req.session.user = user.id;
        var param = {
          access_token: user.token,
          expires_in: user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        return res.end(JSON.stringify(param));
        //return res.redirect('/');
      });
    })(req, res, next);
  });

  app.get('/auth/signup_fb', passport.authenticate('signup_FbStrategy'));

  app.get('/auth/fb', passport.authenticate('facebook_strategy'));

  app.get('/link/fb_insta/:idUser/:idCampaign', (req, res, next) => {
    var state = req.params.idUser + ' ' + req.params.idCampaign;

    passport.authenticate('instalink_FbStrategy', {
      scope: [
        'email',
        'read_insights',
        'read_audience_network_insights',
        'pages_show_list',
        'instagram_basic',
        'instagram_manage_insights',
        'pages_read_engagement',
      ],
      state: state,
    })(req, res, next);
  });

  app.get(
    '/auth/signup_google',
    passport.authenticate('signup_googleStrategy', { scope: ['profile', 'email'] })
  );

  app.get(
    '/auth/google',
    passport.authenticate('google_strategy', { scope: ['profile', 'email'] })
  );

  app.get('/link/google/:idUser/:idCampaign', (req, res, next) => {
    var state = req.params.idUser + ' ' + req.params.idCampaign;

    passport.authenticate('google_strategy_link', {
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
      accessType: 'offline',
      prompt: 'consent',
      state: state,
    })(req, res, next);
  });

  app.get('/addChannel/google/:idUser', (req, res, next) => {
    var state = req.params.idUser + '|' + req.query.redirect;

    passport.authenticate('google_strategy_add_channel', {
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
      accessType: 'offline',
      prompt: 'consent',
      state: state,
    })(req, res, next);
  });

  // app.get('/addChannel/facebook/:idUser', (req, res,next)=>{
  //   var state=req.params.idUser

  // passport.authenticate('facebook_strategy_add_channel', {scope: ['publish_actions', 'manage_pages'],
  //        accessType: 'offline',
  //   	   prompt: 'consent',
  //   state:state})(req,res,next)
  // });

  app.get('/addChannel/facebook/:idUser', (req, res, next) => {
    const state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('facebook_strategy_add_channel', {
      scope: [
        'email',
        'read_insights',
        'read_audience_network_insights',
        'pages_show_list',
        'instagram_basic',
        'instagram_manage_insights',
        'pages_read_engagement',
      ],
      state,
    })(req, res, next);
  });

  app.get('/link/twitter/:idUser/:idCampaign', (req, res, next) => {
    var state = req.params.idUser + ' ' + req.params.idCampaign;
    req.session.state = state;
    passport.authenticate('twitter_link', {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent',
      state: state,
    })(req, res, next);
  });

  app.get('/addChannel/twitter/:idUser', (req, res, next) => {
    var state = req.params.idUser + '|' + req.query.redirect;
    req.session.state = state;
    passport.authenticate('add_twitter_link', {
      scope: ['profile', 'email'],
      accessType: 'offline',
      prompt: 'consent',
      state: state,
    })(req, res, next);
  });

  app.get(
    '/auth/signup_telegram',
    passport.authenticate('signup_telegramStrategy'),
    function (req, res) {
      try {
        var param = {
          access_token: req.user.token,
          expires_in: req.user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        res.redirect(app.config.basedURl + '/auth/login?token=' + JSON.stringify(param));
      } catch (e) {
        console.log(e);
      }
    },
    authErrorHandler
  );

  app.get(
    '/auth/telegram',
    passport.authenticate('telegramStrategy'),
    function (req, res) {
      // Successful authentication, redirect home.
      try {
        var param = {
          access_token: req.user.token,
          expires_in: req.user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        res.redirect(app.config.basedURl + '/auth/login?token=' + JSON.stringify(param));
      } catch (e) {
        console.log(e);
      }
    },
    authSignInErrorHandler
  );

  function authErrorHandler(err, req, res, next) {
    console.log(err);
    let message = err.message ? err.message : err;
    res.redirect(app.config.basedURl + '/auth/registration?message=' + message);
  }

  function authSignInErrorHandler(err, req, res, next) {
    console.log(err);
    let message = err.message ? err.message : err;
    res.redirect(app.config.basedURl + '/auth/login?message=' + message);
  }
  app.get(
    '/callback/facebook_signup',
    passport.authenticate('signup_FbStrategy'),
    async function (req, response) {
      try {
        var param = {
          access_token: req.user.token,
          expires_in: req.user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        response.redirect(
          app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
        );
      } catch (e) {
        console.log(e);
      }
    },
    authErrorHandler
  );

  app.get(
    '/callback/facebook',
    passport.authenticate('facebook_strategy'),
    async function (req, response) {
      try {
        var param = {
          access_token: req.user.token,
          expires_in: req.user.expires_in,
          token_type: 'bearer',
          scope: 'user',
        };
        response.redirect(
          app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
        );
      } catch (e) {
        console.log(e);
      }
    },
    authSignInErrorHandler
  );

  app.get(
    '/callback/facebook_insta',
    passport.authenticate('instalink_FbStrategy'),
    async function (req, response) {
      try {
        message = req.authInfo.message;
        let info = req.query.state.split(' ');
        campaign_id = info[1];
        response.redirect(
          app.config.basedURl + '/part/' + campaign_id + '?message=' + message
        );
      } catch (e) {
        console.log(e);
      }
    },
    authErrorHandler
  );

  app.get(
    '/callback/google_signup',
    passport.authenticate('signup_googleStrategy', { scope: ['profile', 'email'] }),
    async function (req, response) {
      var param = {
        access_token: req.user.token,
        expires_in: req.user.expires_in,
        token_type: 'bearer',
        scope: 'user',
      };
      response.redirect(
        app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
      );
    },
    authErrorHandler
  );

  app.get(
    '/callback/google',
    passport.authenticate('google_strategy', { scope: ['profile', 'email'] }),
    async function (req, response) {
      //console.log(req.user)
      var param = {
        access_token: req.user.token,
        expires_in: req.user.expires_in,
        token_type: 'bearer',
        scope: 'user',
      };
      response.redirect(
        app.config.basedURl + '/auth/login?token=' + JSON.stringify(param)
      );
    },
    authSignInErrorHandler
  );

  app.get(
    '/callback/googlelink',
    passport.authenticate('google_strategy_link', {
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
    }),
    async function (req, response) {
      try {
        if (req.authInfo.message) {
          message = req.authInfo.message;
        } else {
          message = 'account_linked_with_success';
        }
        let info = req.query.state.split(' ');
        campaign_id = info[1];
        response.redirect(
          app.config.basedURl + '/part/' + campaign_id + '?message=' + message
        );
      } catch (e) {
        console.log(e);
      }
    }
  );

  app.get(
    '/callback/googleChannel',
    passport.authenticate('google_strategy_add_channel', {
      failureRedirect:
        app.config.basedURl + '/home/settings/social-networks?message=access-denied',
    }),
    async function (req, response) {
      try {
        redirect = req.query.state.split('|')[1];
        if (req.authInfo.message) {
          message = req.authInfo.message;
        } else {
          message = 'account_linked_with_success';
        }
        response.redirect(app.config.basedURl + redirect + '?message=' + message);
      } catch (e) {
        console.log(e);
      }
    }
  );

  app.get(
    '/callback/facebookChannel',
    passport.authenticate('facebook_strategy_add_channel', {
      failureRedirect:
        app.config.basedURl + '/home/settings/social-networks?message=access-denied',
    }),
    async (req, response) => {
      try {
        redirect = req.query.state.split('|')[1];
        let message = req.authInfo.message;
        response.redirect(
          app.config.basedURl + redirect + '?message=' + message + '&sn=fb'
        );
      } catch (e) {
        console.log(e);
      }
    }
  );

  app.get(
    '/callback/twitter',
    passport.authenticate('twitter_link', { scope: ['profile', 'email'] }),
    async function (req, response) {
      try {
        if (req.authInfo.message) {
          message = req.authInfo.message;
        } else {
          message = 'account_linked_with_success';
        }
        let info = req.session.state.split(' ');
        campaign_id = info[1];
        response.redirect(
          app.config.basedURl + '/part/' + campaign_id + '?message=' + message
        );
      } catch (e) {
        console.log(e);
      }
    }
  );
  app.get(
    '/callback/add/twitter',
    passport.authenticate('add_twitter_link', {
      failureRedirect:
        app.config.basedURl + ' /home/settings/social-networks?message=access-denied',
    }),
    async function (req, response) {
      try {
        redirect = req.session.state.split('|')[1];
        if (req.authInfo.message) {
          message = req.authInfo.message;
        } else {
          message = 'account_linked_with_success';
        }
        response.redirect(app.config.basedURl + redirect + '?message=' + message);
      } catch (e) {
        console.log(e);
      }
    }
  );

  // route for logging out
  app.get('/logout', function (req, res) {
    req.logout();
    res.end(JSON.stringify(param));
  });

  app.get('/test', function (req, res) {
    app.account.handleId();
  });

  function expiringToken(date) {
    return Math.floor(new Date().getTime() / 1000) > date;
  }

  function ensureLoggedIn() {
    return async function (req, res, next) {
      var UserId;

      var token = req.header('authorization').split(' ')[1];
      var AccessT = await app.db.accessToken().findOne({ token: token });
      if (AccessT) {
        if (!expiringToken(AccessT.expires_at)) {
          if (!AccessT['token']) {
            UserId = await app.db.query(
              "Select user_id  from OAAccessToken where token='" + AccessT + "'  "
            );
            if (!UserId) {
              return res.end('Invalid Access Token');
            }
          } else {
            UserId = AccessT['user_id'];
          }

          var user = await app.db
            .sn_user()
            .findOne({ _id: UserId }, { fields: { password: 0 } });

          if (user) {
            res.end(JSON.stringify(user));
          } else {
            res.end(JSON.stringify({ error: 'user not found' }));
          }
        } else {
          res.end(JSON.stringify({ error: 'AC_Token expired' }));
        }
      } else {
        res.end(JSON.stringify({ error: 'Invalid Access Token' }));
      }
    };
  }

  app.get('/auth/account', ensureLoggedIn());

  app.get('/auth/activate/:id/:code', async function (req, response) {
    var code = req.params.code;
    var id = req.params.id;

    console.log(id, 'activate with');
    var users = await app.db
      .sn_user()
      .find({ _id: Long.fromNumber(id) })
      .toArray();

    if (users.length) {
      if (users[0].enabled) {
        //response.end('{error:"account already activated"}');
        let message = 'account already activated';
        response.redirect(app.config.basedURl + '/auth/login?message=' + message);
        return;
      }
      if (users[0].confirmation_token != code) {
        let message = 'wrong activation';
        response.redirect(app.config.basedURl + '/auth/login?message=' + message);
        //response.end('{error:"wrong activation"}');
        return;
      }
      var update = await app.db
        .sn_user()
        .updateOne(
          { _id: Long.fromNumber(id) },
          { $set: { confirmation_token: '', enabled: 1 } }
        );
      let message = 'activated';
      response.redirect(app.config.basedURl + '/auth/login?message=' + message);
      //response.end('{message:"activated"}');
    } else {
      let message = 'no account';
      response.redirect(app.config.basedURl + '/auth/login?message=' + message);
      //response.end('{error:"no account"}');
    }
  });

  app.post('/auth/passlost', async (req, response) => {
    try {
      let dateNow = Math.floor(Date.now() / 1000);
      const lang = req.query.lang || 'en';
      app.i18n.configureTranslation(lang);
      var mail = req.body.mail;
      // var res = await app.db.query("Select id from user where email='" + mail + "' ");
      var users = await app.db.sn_user().find({ email: mail.toLowerCase() }).toArray();
      if (!users.length) {
        response.end('{error:"account not exists"}');
        return;
      }
      if (
        users[0].account_locked &&
        app.account.differenceBetweenDates(users[0].date_locked, dateNow) <
          app.config.lockedPeriod
      ) {
        response.end(
          JSON.stringify({
            error: true,
            message: 'account_locked',
            blockedDate: users[0].date_locked,
          })
        );
        return;
      }
      var buff = Buffer.alloc(64);
      var token = crypto.randomFillSync(buff).toString('hex');
      await app.db
        .sn_user()
        .updateOne(
          { _id: Long.fromNumber(users[0]._id) },
          { $set: { confirmation_token: token } }
        );
      let requestDate = app.account.manageTime();
      let ip = req.addressIp;

      readHTMLFile(__dirname + '/../emails/reset_password.html', (err, html) => {
        var template = handlebars.compile(html);
        var replacements = {
          ip,
          requestDate,
          satt_url: app.config.basedURl,
          imgUrl: app.config.baseEmailImgURl,
          passrecover_url: app.config.baseUrl + 'auth/passrecover',
          user_id: users[0]._id,
          token_: token,
          satt_faq: app.config.Satt_faq,
          expiring: dateNow + 60 * 60,
        };

        var htmlToSend = template(replacements);
        var mailOptions = {
          from: app.config.resetpassword_Email,
          to: users[0].email,
          subject: 'Satt wallet password recover',
          html: htmlToSend,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            response.end(
              JSON.stringify({ message: 'Email was sent to ' + users[0].email })
            );
          }
        });
      });
    } catch (err) {
      response.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.post('/v2/auth/passlost', async (req, response) => {
    try {
      let dateNow = Math.floor(Date.now() / 1000);
      const lang = req.query.lang || 'en';
      app.i18n.configureTranslation(lang);
      let email = req.body.mail.toLowerCase();

      let users = await app.db.sn_user().find({ email }).toArray();
      if (!users.length) {
        response.end('{error:"account not exists"}');
        return;
      }
      if (
        users[0].account_locked &&
        app.account.differenceBetweenDates(users[0].date_locked, dateNow) <
          app.config.lockedPeriod
      ) {
        response.end(
          JSON.stringify({
            error: true,
            message: 'account_locked',
            blockedDate: users[0].date_locked,
          })
        );
        return;
      }

      let requestDate = app.account.manageTime();
      let ip = req.addressIp;

      const code = await app.account.updateAndGenerateCode(users[0]._id, 'reset');
      readHTMLFile(__dirname + '/../emails/reset_password_code.html', (err, html) => {
        let template = handlebars.compile(html);
        let replacements = {
          ip,
          code,
          requestDate,
          satt_url: app.config.basedURl,
          imgUrl: app.config.baseEmailImgURl,
          satt_faq: app.config.Satt_faq,
        };

        let htmlToSend = template(replacements);
        let mailOptions = {
          from: app.config.resetpassword_Email,
          to: users[0].email,
          subject: 'Satt wallet password recover',
          html: htmlToSend,
        };
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            response.end(
              JSON.stringify({ message: 'Email was sent to ' + users[0].email })
            );
          }
        });
      });
    } catch (err) {
      response.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.post('/auth/passchange', async (req, response) => {
    var newpass = req.body.newpass;
    var oldpass = req.body.oldpass;
    var id = req.body.id;
    var users = await app.db
      .sn_user()
      .find({ _id: Long.fromNumber(id) })
      .toArray();
    if (users.length) {
      if (users[0].password != synfonyHash(oldpass)) {
        response.end('{error:"wrong password"}');
        return;
      }
      await app.db
        .sn_user()
        .updateOne({ _id: id }, { $set: { password: synfonyHash(newpass) } });
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
    var users = await app.db
      .sn_user()
      .find({ _id: Long.fromNumber(id) })
      .toArray();
    if (users.length) {
      if (users[0].password != synfonyHash(oldpass)) {
        response.end('{error:"wrong password"}').status(500);
        return;
      }
      var res_ins = await app.db
        .sn_user()
        .updateOne({ _id: id }, { $set: { password: synfonyHash(newpass) } });
      response.end('{message:"changed"}').status(200);
    } else {
      response.end('{error:"no account"}').status(500);
    }
  });

  app.put('/changeEmail', async (req, response) => {
    var pass = req.body.pass;
    var email = req.body.email;
    const token = req.headers['authorization'].split(' ')[1];
    const auth = await app.crm.auth(token);
    var user = await app.db.sn_user().findOne({ _id: Long.fromNumber(+auth.id) });
    if (user) {
      if (user.password != synfonyHash(pass)) {
        response.end(JSON.stringify('wrong password'));
        return;
      }
      var existUser = await app.db.sn_user().findOne({ email: email });
      if (existUser) {
        response.end(JSON.stringify('duplicated email'));
        return;
      } else {
        const code = Math.floor(100000 + Math.random() * 900000);
        newEmail = {};
        newEmail.email = email;
        newEmail.expiring = Date.now() + 3600 * 20;
        newEmail.code = code;

        await app.db
          .sn_user()
          .updateOne({ _id: Long.fromNumber(auth.id) }, { $set: { newEmail } });

        let requestDate = app.account.manageTime();
        let ip = req.addressIp;

        const lang = req.query.lang || 'en';
        app.i18n.configureTranslation(lang);

        // let subject = (lang == "en") ? "Satt wallet change email" : "";
        readHTMLFile(__dirname + '/emailtemplate/changeEmail.html', (err, html) => {
          var template = handlebars.compile(html);
          var replacements = {
            ip,
            requestDate,
            satt_url: app.config.basedURl,
            back_url: app.config.baseURl,
            satt_faq: app.config.Satt_faq,
            code,
            imgUrl: app.config.baseEmailImgURl,
          };
          var htmlToSend = template(replacements);
          console.log('email====', user.email);
          var mailOptions = {
            from: app.config.mailSender,
            //to: user.email,
            to: newEmail.email,
            subject: 'Satt wallet change email',
            html: htmlToSend,
          };
          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              console.log(error);
            } else {
              response.end(JSON.stringify({ message: 'Email sent' }));
            }
          });
        });
        response.end(JSON.stringify('success'));
      }
    } else {
      response.end(JSON.stringify('no account'));
    }
  });
  app.put('/confirmChangeEmail', async function (req, response) {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      var id = +auth.id;
      var code = req.body.code;
      var user = await app.db
        .sn_user()
        .findOne({ _id: Long.fromNumber(id) }, { projection: { newEmail: true } });
      if (Date.now() >= user.newEmail.expiring) {
        response.end(JSON.stringify('code expired')).status(200);
      } else if (user.newEmail.code != code) {
        response.end(JSON.stringify('code incorrect')).status(200);
      } else {
        var newEmail = user.newEmail.email;
        var res_ins = await app.db
          .sn_user()
          .updateOne({ _id: Long.fromNumber(id) }, { $set: { email: newEmail } });
        response.end(JSON.stringify('email changed')).status(200);
      }
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/auth/passrecover', async function (req, response) {
    var newpass = req.body.newpass;
    var code = req.body.code;
    var id = req.body.id;
    var res = await app.db
      .sn_user()
      .find({ _id: Long.fromNumber(id) })
      .toArray();
    if (res.length) {
      if (res[0].confirmation_token != code) {
        response.end(
          JSON.stringify({ error: 'Try again Confirmation Token has changes' })
        );
        return;
      }
      //var res_ins = await app.db.sn_user().updateOne({_id: ObjectId(id)}, {password: synfonyHash(newpass), confirmation_token: "", enabled: 1});

      var update = await app.db
        .sn_user()
        .updateOne(
          { _id: Long.fromNumber(id) },
          { $set: { password: synfonyHash(newpass), confirmation_token: '', enabled: 1 } }
        );
      console.log(update);

      response.end(JSON.stringify('successfully'));
    } else {
      response.end(JSON.stringify('Account Not Found'));
      return;
    }
  });

  app.post('/v2/auth/passrecover', async (req, response) => {
    let [newpass, email] = [req.body.newpass, req.body.email];
    let user = await app.db.sn_user().findOne({ email }, { projection: { _id: true } });
    user &&
      (await app.db
        .sn_user()
        .updateOne(
          { _id: Long.fromNumber(user._id) },
          { $set: { password: synfonyHash(newpass), enabled: 1 } }
        ));
    response.end(JSON.stringify('successfully'));
  });

  app.post('/resend-confirmation-token/:email', async function (req, response) {
    try {
      var email = req.params.email;
      var users = await app.db.sn_user().find({ email: email }).toArray();
      const lang = req.query.lang || 'en';
      app.i18n.configureTranslation(lang);
      readHTMLFile(__dirname + '/../emails/welcome.html', function (err, html) {
        var template = handlebars.compile(html);
        var replacements = {
          satt_url: app.config.basedURl,
          imgUrl: app.config.baseEmailImgURl,
          validation_url:
            app.config.baseUrl +
            'auth/activate/' +
            users[0]._id +
            '/' +
            users[0].confirmation_token,
        };
        var htmlToSend = template(replacements);
        var mailOptions = {
          from: app.config.mailSender,
          to: users[0].email,
          subject: 'Satt wallet activation',
          html: htmlToSend,
        };
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            response.end(JSON.stringify({ message: 'Email sent' }));
          }
        });
      });
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/v2/resend-confirmation-token/:email', async (req, response) => {
    try {
      const email = req.params.email;
      const user = await app.db
        .sn_user()
        .findOne({ email: email }, { projection: { email: true } });
      const code = await app.account.updateAndGenerateCode(user._id, 'validation');
      const lang = req.query.lang || 'en';
      app.i18n.configureTranslation(lang);
      readHTMLFile(
        __dirname + '/emailtemplate/email_validated_code.html',
        (err, html) => {
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
            to: user.email.toLowerCase(),
            subject: 'Satt wallet activation',
            html: htmlToSend,
          };
          transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
              app.account.sysLogError(error);
            } else {
              response.send(JSON.stringify({ message: 'Email sent' }));
              app.account.log('Email sent: ', user.email);
            }
          });
        }
      );
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.get('/referral', async (req, res) => {
    let referral = req.query.code;
    let userId = req.query.userID;

    return res.end(JSON.stringify(await app.account.HandleReferral(referral, userId)));
  });

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
  app.post('/auth/social/signup', async (req, res) => {
    try {
      var mongodate = new Date().toISOString();
      snUser = {
        _id: Long.fromNumber(await app.account.handleId()),
        email: req.body.email,
        idSn: req.body.idSn,
        picLink: req.body.photo,
        username: req.body.name,
        first_name: req.body.givenName,
        name: req.body.familyName,
        enabled: 0,
        created: mongodate,
        updated: mongodate,
        locale: 'en',
      };
      var user = {};
      if (req.body.idSn === '1') {
        snUser.idOnSn = req.body.id;
        user = await app.db.sn_user().findOne({ idOnSn: req.body.id });
      } else if (req.body.idSn === '2') {
        snUser.idOnSn2 = req.body.id;
        user = await app.db.sn_user().findOne({ idOnSn2: req.body.id });
      }
      //var user = await app.db.sn_user().findOne({ idOnSN: snUser.email })
      if (user) {
        /*if (snUser.idSn === user.idSn) {
                    var date = Math.floor(Date.now() / 1000) + 86400;
                    var buff = Buffer.alloc(32);
                    var token = crypto.randomFillSync(buff).toString('hex');
                    var update = await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
                    var token = await app.db.accessToken().findOne({ user_id: user._id });
                    var param = { "access_token": token.token, "expires_in": token.expires_at, "token_type": "bearer", "scope": "user" };
                    res.send(JSON.stringify(param))*/
        //} else {
        res.send(JSON.stringify({ message: 'account_exists' }));
        //}
        // compte existe go to signin
      } else {
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var date = Math.floor(Date.now() / 1000) + 86400;
        var user = await app.db.sn_user().insertOne(snUser);
        await app.db.accessToken().insertOne({
          client_id: 1,
          user_id: user.ops[0]._id,
          token: token,
          expires_at: date,
          scope: 'user',
        });
        var param = {
          access_token: token,
          expires_in: date,
          token_type: 'bearer',
          scope: 'user',
        };
        res.send(JSON.stringify(param));
      }
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/auth/social/signin', async (req, res) => {
    try {
      console.log('sssss', req.body);
      var user = null;
      if (req.body.idSn === '1') {
        //snUser.idOnSn = req.body.id;
        user = await app.db.sn_user().findOne({ idOnSn: req.body.id });
      } else if (req.body.idSn === '2') {
        //snUser.idOnSn2 = req.body.id;
        user = await app.db.sn_user().findOne({ idOnSn2: req.body.id });
      } else {
        res.end("{'error': 'invalid idSn'}");
      }
      if (user) {
        var date = Math.floor(Date.now() / 1000) + 86400;
        var buff = Buffer.alloc(32);
        var token = crypto.randomFillSync(buff).toString('hex');
        var update = await app.db
          .accessToken()
          .updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
        var token = await app.db.accessToken().findOne({ user_id: user._id });
        var param = {
          access_token: token.token,
          expires_in: token.expires_at,
          token_type: 'bearer',
          scope: 'user',
        };
        res.send(JSON.stringify(param));
      } else {
        res.send(JSON.stringify({ messgae: 'account_doesnt_exist' }));
      }
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.get('/onBoarding', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      const id = +auth.id;
      await app.db
        .sn_user()
        .updateOne({ _id: Long.fromNumber(id) }, { $set: { onBoarding: true } });
      res.send(JSON.stringify({ success: 'onBoarding updated' })).status(201);
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.get('/linkedin/link/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('linkedin_link', { state })(req, res, next);
  });

  passport.use(
    'linkedin_link',
    new LinkedInStrategy(
      {
        clientID: app.config.linkedin_key,
        clientSecret: app.config.linkedin_secret,
        callbackURL: app.config.baseUrl + 'callback/link/linkedin',
        scope: [
          'r_basicprofile',
          'r_organization_social' /*'w_organization_social','rw_ads','r_ads','r_1st_connections_size','r_ads_reporting',*/,
          'rw_organization_admin' /*,'w_member_social'*/,
        ],
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        req.query.userId = Number(req.query.state.split('|')[0]);
        req.query.linkedinId = profile.id;
        req.query.accessToken = accessToken;
        done(null, profile, { status: true, message: 'account_linked_with_success' });
      }
    )
  );

  app.get('/logout', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      let auth = await app.crm.auth(token);
      let _id = auth.id;
      await app.db.sn_user().updateOne({ _id }, { $set: { fireBaseAccessToken: null } });
      res.end(JSON.stringify({ message: 'success' }));
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });
  app.get(
    '/callback/link/linkedin',
    passport.authenticate('linkedin_link'),
    async (req, res) => {
      try {
        let { accessToken, userId, linkedinId } = req.query;
        const linkedinData = {
          url: 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(*, organization~(localizedName,logoV2(original~:playableStreams))))',
          method: 'GET',
          headers: {
            Authorization: 'Bearer ' + accessToken,
            'X-Restli-Protocol-Version': '2.0.0',
          },
          json: true,
        };
        let redirect = req.query.state.split('|')[1];
        let linkedinPages = await rp(linkedinData);

        var linkedinProfile = { accessToken, userId, linkedinId };
        linkedinProfile.pages = [];
        if (linkedinPages.elements.length) {
          for (let i = 0; i < linkedinPages.elements.length; i++) {
            elem = linkedinPages.elements[i];
            if (elem.state !== 'REVOKED') {
              elem.subscribers = await app.oracle.linkedinAbos(
                linkedinProfile,
                elem.organization
              );
              elem.photo = linkedinPages.elements[i]['organization~'].logoV2
                ? linkedinPages.elements[i]['organization~'].logoV2['original~']
                    .elements[0].identifiers[0].identifier
                : '';
              delete elem['organization~'].logoV2;
              linkedinProfile.pages.push(elem);
            }
          }
        }
        if (!linkedinProfile.pages.length)
          return res.redirect(
            app.config.basedURl + redirect + '?message=channel obligatoire&sn=linkd'
          );
        await app.db
          .linkedinProfile()
          .updateOne({ userId }, { $set: linkedinProfile }, { upsert: true });
        let message = req.authInfo.message;
        res.redirect(
          app.config.basedURl + redirect + '?message=' + message + '&sn=linkd'
        );
      } catch (err) {
        app.account.sysLogError(err);
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
      }
    }
  );

  app.get('/connect/google/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('connect_google', {
      scope: ['profile', 'email'],
      state: state,
    })(req, res, next);
  });

  app.get(
    '/callback/connect/google',
    passport.authenticate('connect_google'),
    async (req, res) => {
      let state = req.query.state.split('|');
      let url = state[1];
      let message = req.authInfo.message;
      res.redirect(app.config.basedURl + url + '?message=' + message);
    }
  );

  app.get('/connect/facebook/:idUser', (req, res, next) => {
    let state = req.params.idUser + '|' + req.query.redirect;
    passport.authenticate('connect_facebook', { state: state })(req, res, next);
  });

  app.get(
    '/callback/connect/facebook',
    passport.authenticate('connect_facebook'),
    async (req, res) => {
      let state = req.query.state.split('|');
      let url = state[1];
      res.redirect(app.config.basedURl + url + '?message=' + req.authInfo.message);
    }
  );

  app.put('/updateUserEmail', async (req, res) => {
    try {
      var users = await app.db
        .sn_user()
        .find({ $and: [{ email: { $regex: /[A-Z]/ } }, { userSatt: true }] })
        .toArray();
      users.forEach(async (user) => {
        await app.db
          .sn_user()
          .updateOne({ _id: user._id }, { $set: { email: user.email.toLowerCase() } });
      });

      res.send(JSON.stringify('success'));
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });
  app.get(
    '/connect/telegram/:idUser/:redirect',
    passport.authenticate('connect_telegram'),
    function (req, res) {
      try {
        if (req.params.redirect == 'security') {
          url = '/home/settings/security';
        } else {
          url = '/social-registration/monetize-telegram';
        }
        res.redirect(app.config.basedURl + url + '?message=' + req.authInfo.message);
      } catch (e) {
        console.log(e);
      }
    }
  );

  app.get(
    '/callback/connect/telegram',
    passport.authenticate('connect_telegram'),
    async (req, res) => {
      res.redirect(
        app.config.basedURl + '/profile/networks?message=' + req.authInfo.message
      );
    }
  );

  app.put('/deconnect/facebook', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let id = auth.id;
      let user = await app.db
        .sn_user()
        .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn: null } });
      res.end(JSON.stringify({ message: 'deconnect successfully' })).status(200);
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.put('/deconnect/google', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let id = auth.id;
      let user = await app.db
        .sn_user()
        .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn2: null } });
      res.end(JSON.stringify({ message: 'deconnect successfully' })).status(200);
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.put('/deconnect/telegram', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let id = auth.id;
      let user = await app.db
        .sn_user()
        .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn3: null } });
      res.end(JSON.stringify({ message: 'deconnect successfully' })).status(200);
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  /**
   * @swagger
   * /deconnection/{social}:
   *   post:
   *     summary: deconnect from social.
   *     description: parametres acceptées :{social}.
   *     parameters:
   *       - name: social
   *         description: google,facebook or telegram.
   *     responses:
   *        "200":
   *          description: message:deconnect successfully
   */
  app.put('/deconnection/:social', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let id = auth.id;
      const social = req.params.social;
      if (social === 'telegram') {
        let user = await app.db
          .sn_user()
          .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn3: null } });
        res
          .end(JSON.stringify({ message: 'deconnect successfully from telegram' }))
          .status(200);
      } else if (social === 'facebook') {
        let user = await app.db
          .sn_user()
          .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn: null } });
        res
          .end(JSON.stringify({ message: 'deconnect successfully from facebook' }))
          .status(200);
      } else {
        let user = await app.db
          .sn_user()
          .updateOne({ _id: Long.fromNumber(id) }, { $set: { idOnSn2: null } });
        res
          .end(JSON.stringify({ message: 'deconnect successfully from google' }))
          .status(200);
      }
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/check/pass', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let walletpass = req.body.password;
      let id = auth.id;
      let user = await app.db
        .sn_user()
        .findOne({ _id: Long.fromNumber(id) }, { projection: { password: true } });
      if (user.password != synfonyHash(walletpass)) {
        res.end(JSON.stringify({ message: 'Not the same password' })).status(200);
      } else {
        res.end(JSON.stringify({ error: 'same password' })).status(500);
      }
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/account/purged', async (req, res) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let pass = req.body.pass;
      let reason = req.body.reason;
      await app.db
        .sn_user()
        .findOne({ _id: Long.fromNumber(auth.id) }, async (err, user) => {
          if (user.password === synfonyHash(pass)) {
            if (reason) user.reason = reason;
            await app.db.sn_user_archived().insertOne(user);
            await app.db.sn_user().deleteOne({ _id: Long.fromNumber(auth.id) });
            res.send(JSON.stringify({ message: 'account deleted' })).status(202);
          } else {
            res.send(JSON.stringify({ error: 'wrong password' }));
          }
        });
    } catch (err) {
      res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.post('/verifyCaptcha', async (req, res) => {
    try {
      let id = app.ObjectId(req.body._id);
      let position = +req.body.position;
      let captcha = await app.db.captcha().findOne({
        $and: [{ _id: id }, { position: { $gte: position - 5, $lte: position + 5 } }],
      });
      if (captcha) {
        res.send(JSON.stringify({ message: 'success' }));
      } else {
        res.send(JSON.stringify({ error: 'wrong captcha' }));
      }
    } catch (err) {
      res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.get('/captcha', async (req, res) => {
    try {
      count = await app.db.captcha().count();
      const random = Math.floor(Math.random() * count);
      let captchas = await app.db.captcha().find().limit(1).skip(random).toArray();
      let captcha = captchas[0];
      res.send(JSON.stringify({ captcha }));
    } catch (err) {
      res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.get('/qrCode/:id', async (req, res) => {
    try {
      let id = +req.params.id;
      var secret = speakeasy.generateSecret({
        name: 'SaTT_Token ' + id,
      });
      await app.db.sn_user().updateOne({ _id: id }, { $set: { secret: secret.ascii } });
      qrcode.toDataURL(secret.otpauth_url, function (err, data) {
        res.send(
          JSON.stringify({
            qrCode: data,
            secret: secret.base32,
            googleAuthName: `SaTT_Token ${req.params.id}`,
          })
        );
      });
    } catch (err) {
      res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.post('/verifyQrCode', async (req, res) => {
    try {
      let id = +req.body.id;
      let user = await app.db.sn_user().findOne({ _id: id });
      secret = user.secret;
      var code = req.body.code;
      var verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'ascii',
        token: code,
      });
      res.send(JSON.stringify({ verifiedCode: verified }));
    } catch (err) {
      res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
  });

  app.post('/confirmCode', async (req, response) => {
    try {
      var authMethod = { message: 'code match' };
      var buff = Buffer.alloc(32);
      let [email, code, type] = [
        req.body.email.toLowerCase(),
        req.body.code,
        req.body.type,
      ];
      var user = await app.db
        .sn_user()
        .findOne({ email }, { projection: { secureCode: true } });
      if (user.secureCode.code != code) authMethod.message = 'code incorrect';
      else if (Date.now() >= user.secureCode.expiring)
        authMethod.message = 'code expired';
      else if (user.secureCode.type == 'validation' && type == 'validation') {
        let date = Math.floor(Date.now() / 1000) + 86400;
        let token = crypto.randomFillSync(buff).toString('hex');
        (authMethod.token = token),
          (authMethod.expires_in = date),
          (authMethod.idUser = user._id);
        await app.db.accessToken().insertOne({
          client_id: 1,
          user_id: user._id,
          token: token,
          expires_at: date,
          scope: 'user',
        });
        await app.db.sn_user().updateOne({ _id: user._id }, { $set: { enabled: 1 } });
      }
      response.end(JSON.stringify(authMethod));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/allowYoutube', async (req, response) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let UserId = auth.id;
      let channelId = req.body.channelId;
      let deactivate = req.body.deactivate;
      await app.db
        .googleProfile()
        .updateOne({ $and: [{ channelId }, { UserId }] }, { $set: { deactivate } });
      response.end(JSON.stringify({ message: 'success' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/allowTwitter', async (req, response) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let UserId = auth.id;
      let twitter_id = req.body.twitter_id;
      let deactivate = req.body.deactivate;
      await app.db
        .twitterProfile()
        .updateOne({ $and: [{ twitter_id }, { UserId }] }, { $set: { deactivate } });
      response.end(JSON.stringify({ message: 'success' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/allowFacebook', async (req, response) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let UserId = auth.id;
      let id = req.body.id;
      let deactivate = req.body.deactivate;
      await app.db
        .fbPage()
        .updateOne({ $and: [{ id }, { UserId }] }, { $set: { deactivate } });
      response.end(JSON.stringify({ message: 'success' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/allowLinkedin', async (req, response) => {
    try {
      let token = req.headers['authorization'].split(' ')[1];
      const auth = await app.crm.auth(token);
      let userId = auth.id;
      let organization = req.body.organization;
      let deactivate = req.body.deactivate;
      await app.db
        .linkedinProfile()
        .updateOne(
          { $and: [{ userId }, { 'pages.organization': organization }] },
          { $set: { 'pages.$.deactivate': deactivate } }
        );
      response.end(JSON.stringify({ message: 'success' }));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.get('/userAccounts/:typeSN/:socialId', async (req, response) => {
    try {
      let typeSN = req.params.typeSN;
      let socialId = req.params.socialId;
      let UserId = await app.oracleManager.checkSocialUser(typeSN, socialId);
      let networks = {};
      var channelsGoogle = await app.db.googleProfile().find({ UserId }).toArray();
      var channelsTwitter = await app.db.twitterProfile().find({ UserId }).toArray();
      let channelsFacebook = await app.db.fbPage().find({ UserId }).toArray();
      let fbProfile = await app.db.fbProfile().findOne({ UserId });
      let channelsLinkedin = await app.db.linkedinProfile().findOne({ userId: UserId });
      let linkedinPages = channelsLinkedin?.pages || [];
      let linkedinProfile = {
        accessToken: channelsLinkedin.accessToken,
        userId: channelsLinkedin.userId,
        linkedinId: channelsLinkedin.linkedinId,
      };
      networks.google = { channelsGoogle };
      networks.twitter = { channelsTwitter };
      networks.facebook = { channelsFacebook, fbProfile };
      networks.linkedin = { linkedinPages, linkedinProfile };
      response.send(JSON.stringify(networks));
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.get('/user/status-wallet', async (req, res) => {
    let userId = await app.db
      .wallet()
      .find({}, { projection: { UserId: true, _id: false } })
      .toArray();
    userId.forEach(
      async (user) =>
        await app.sn_user().updateOne({ _id: user.UserId }, { $set: { hasWallet: true } })
    );
    res.json({ message: 'done' });
  });
  app.get('/verifyToken', async (req, response) => {
    try {
      const token = req.headers['authorization'].split(' ')[1];
      await app.crm.auth(token);
      response.status(200).json({ isValid: true });
    } catch (err) {
      app.account.sysLogError(err);
      response.status(401).json({ isValid: false });
    }
  });

  app.post('/auth/apple', async (req, res) => {
    try {
      let date = Math.floor(Date.now() / 1000) + 86400;
      let buff = Buffer.alloc(32);
      let token = crypto.randomFillSync(buff).toString('hex');
      let email = req.body.mail;
      let id_apple = req.body.id_apple;
      let idSn = req.body.idSN;
      let name = req.body.name;
      let user = await app.db.sn_user().findOne({ email: email });
      if (user) {
        if (user.idSn === idSn) {
          await app.db
            .accessToken()
            .updateOne(
              { user_id: user._id },
              { $set: { token: token, expires_at: date } }
            );
          let param = {
            access_token: token,
            expires_in: date,
            token_type: 'bearer',
            scope: 'user',
          };
          res.send(JSON.stringify(param));
        } else {
          res.send(JSON.stringify({ messgae: 'account_exists_with_another_courrier' }));
        }
      } else {
        let snUser = {
          _id: Long.fromNumber(await app.account.handleId()),
          id_apple: id_apple,
          email: email,
          idSn: idSn,
          name: name,
        };
        let user = await app.db.sn_user().insertOne(snUser);
        await app.db.accessToken().insertOne({
          client_id: 1,
          user_id: user.ops[0]._id,
          token: token,
          expires_at: date,
          scope: 'user',
        });
        let param = {
          access_token: token,
          expires_in: date,
          token_type: 'bearer',
          scope: 'user',
        };
        res.send(JSON.stringify(param));
      }
    } catch (err) {
      response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  app.post('/migrationDB', async (req, res) => {
    try {
      var date = Math.floor(Date.now() / 1000) + 86400;
      var buff = Buffer.alloc(32);
      var token = crypto.randomFillSync(buff).toString('hex');
      var result = await app.db.query('Select * from user');
      if (result.length) {
        for (i = 0; i < result.length; i++) {
          user = await app.db.sn_user().findOne({ email: result[i].email });
          if (!user) {
            await app.db.sn_user().insertOne({
              _id: Long.fromNumber(await app.account.handleId()),
              username: result[i]?.username?.toLowerCase(),
              email: result[i]?.email?.toLowerCase(),
              password: result[i]?.password,
              created: result[i]?.created,
              idSn: result[i]?.idSn,
              locale: result[i]?.locale,
              onBoarding: false,
              enabled: 0,
              userSatt: true,
            });
          }
          var oldToken = await app.db.accessToken().findOne({ user_id: result[i]._id });
          if (!oldToken) {
            await app.db.accessToken().insertOne({
              client_id: 1,
              user_id: result[i]._id,
              token,
              expires_at: date,
              scope: 'user',
            });
          }
        }
      }
      res.send(JSON.stringify('success'));
    } catch (err) {
      res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
  });

  return app;
};
