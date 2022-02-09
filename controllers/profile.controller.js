var connection;

var requirement = require('../helpers/utils');
const handlebars = require('handlebars');

var ejs = require('ejs');
const QRCode = require('qrcode');
var connection;
let app;
(connection = async function () {
  app = await requirement.connection();
})();

const mongoose = require('mongoose');
let gfsprofilePic;
let gfsUserLegal;

const conn = mongoose.createConnection(process.env.MONGOURI);

conn.once('open', () => {
  gfsprofilePic = Grid(conn.db, mongoose.mongo);
  gfsprofilePic.collection('user_file');
  gfsUserLegal = Grid(conn.db, mongoose.mongo);
  gfsUserLegal.collection('user_legal');
});

const Grid = require('gridfs-stream');
const GridFsStorage = require('multer-gridfs-storage');
var Long = require('mongodb').Long;

const multer = require('multer');

const { readHTMLFileProfile } = require('../helpers/utils');

const storageUserLegal = new GridFsStorage({
  url: process.env.MONGOURI,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      const filename = file.originalname;
      const fileInfo = {
        filename: filename,
        bucketName: 'user_legal',
      };
      resolve(fileInfo);
    });
  },
});

//const uploadUserLegal =  multer({storage : storageUserLegal})

module.exports.uploadUserLegal = multer({ storage: storageUserLegal }).single('file');

exports.account = async (req, res) => {
  try {
    if (req.user) {
      res.end(JSON.stringify(req.user));
    } else {
      res.end(JSON.stringify({ error: 'user not found' }));
    }
  } catch (err) {
    res.end(JSON.stringify({ error: err.message ? err.message : err.error }));
  }
};

exports.profilePicture = async (req, response) => {
  try {
    const idUser = req.query.id ? +req.query.id : req.user._id;
    gfsprofilePic.files.findOne({ 'user.$id': idUser }, (err, file) => {
      if (!file || file.length === 0) {
        return response.json({
          err: 'No file exists',
        });
      } else {
        response.writeHead(200, {
          'Content-Type': 'image/png',
          'Content-Length': file.length,
          'Content-Disposition': `attachment; filename=${file.filename}`,
        });
        const readstream = gfsprofilePic.createReadStream(file.filename);
        readstream.pipe(response);
      }
    });
  } catch (err) {
    response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const id = req.user._id;
    let profile = req.body;
    if (profile.email) {
      const user = await app.db
        .sn_user()
        .findOne({ $and: [{ email: profile.email }, { _id: { $nin: [id] } }] });
      if (user) {
        res.end(JSON.stringify({ message: 'email already exists' }));
        return;
      }
    }
    const result = await app.db
      .sn_user()
      .findOneAndUpdate({ _id: id }, { $set: profile }, { returnOriginal: false });
    const updatedProfile = result.value;
    res.send(JSON.stringify({ updatedProfile, success: 'updated' })).status(201);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.UserLegalProfile = async (req, res) => {
  try {
    const idNode = '0' + req.user._id;
    const files = await gfsUserLegal.files.find({ idNode }).toArray();
    userLegal = {};
    userLegal.legal = files;
    for (var i = 0; i < userLegal.legal.length; i++) {
      if (userLegal.legal[i].validate == 'validate') {
        userLegal.legal[i].validate = true;
      }
    }
    res.send(userLegal);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.addUserLegalProfile = async (req, res) => {
  try {
    const id = req.user._id;

    const idNode = '0' + id;
    let type = req.body.type;

    console.log('body', req.body);

    console.log(req.file);
    if (type && req.file) {
      await gfsUserLegal.files.deleteMany({ $and: [{ idNode }, { type }] });
      await gfsUserLegal.files.updateMany(
        { _id: req.file.id },
        {
          $set: {
            idNode,
            DataUser: {
              $ref: 'sn_user',
              $id: Long.fromNumber(id),
              $db: 'atayen',
            },
            validate: false,
            type,
          },
        }
      );

      await app.account.notificationManager(id, 'save_legal_file_event', { type });

      res.end(JSON.stringify({ message: 'legal processed' })).status(201);
    }
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.addUserLegalProfile = async (req, res) => {
  try {
    const id = req.user._id;

    const idNode = '0' + id;
    let type = req.body.type;

    console.log('body', req.body);

    console.log(req.file);
    if (type && req.file) {
      await gfsUserLegal.files.deleteMany({ $and: [{ idNode }, { type }] });
      await gfsUserLegal.files.updateMany(
        { _id: req.file.id },
        {
          $set: {
            idNode,
            DataUser: {
              $ref: 'sn_user',
              $id: Long.fromNumber(id),
              $db: 'atayen',
            },
            validate: false,
            type,
          },
        }
      );

      await app.account.notificationManager(id, 'save_legal_file_event', { type });

      res.end(JSON.stringify({ message: 'legal processed' })).status(201);
    }
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.FindUserLegalProfile = async (req, res) => {
  try {
    const id = req.user._id;

    const userLegal = req.params.id;
    gfsUserLegal.files.findOne({ _id: app.ObjectId(userLegal) }, (err, file) => {
      if (!file || file.length === 0) {
        return res.status(404).json({
          err: 'No file exists',
        });
      } else {
        if (file.contentType) {
          contentType = file.contentType;
        } else {
          contentType = file.mimeType;
        }
        res.writeHead(200, {
          'Content-type': contentType,
          'Content-Length': file.length,
          'Content-Disposition': `attachment; filename=${file.filename}`,
        });
        const readstream = gfsUserLegal.createReadStream(file.filename);
        readstream.pipe(res);
      }
    });
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.deleteGoogleChannels = async (req, res) => {
  try {
    let id = req.user._id;
    await app.db.googleProfile().deleteMany({ UserId: id });
    res.end(JSON.stringify({ message: 'deleted successfully' }));
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.deleteFacebookChannels = async (req, res) => {
  try {
    let UserId = req.user._id;
    await app.db.fbPage().deleteMany({ UserId });
    await app.db.fbProfile().deleteMany({ UserId });
    res.end(JSON.stringify({ message: 'deleted successfully' }));
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.deleteLinkedinChannels = async (req, res) => {
  try {
    let userId = req.user._id;
    await app.db.linkedinProfile().updateOne({ userId }, { $set: { pages: [] } });
    res.end(JSON.stringify({ message: 'deleted successfully' }));
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.UserInterstes = async (req, res) => {
  try {
    let id = req.user._id;
    const interests = await app.db.interests().findOne({ _id: id });
    res.send(JSON.stringify(interests)).status(201);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.AddIntersts = async (req, res) => {
  try {
    let userInterests = req.body;
    userInterests._id = Long.fromNumber(req.user._id);
    await app.db.interests().insertOne(userInterests);
    res.send(JSON.stringify({ message: 'interests added' })).status(201);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.UpdateIntersts = async (req, res) => {
  try {
    let id = req.user._id;
    let userInterests = req.body.interests;
    await app.db
      .interests()
      .replaceOne({ _id: Long.fromNumber(id) }, { interests: userInterests });
    res.send(JSON.stringify({ message: 'interests updated' })).status(201);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.socialAccounts = async (req, response) => {
  try {
    var UserId = req.user._id;
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
};

module.exports.checkOnBoarding = async (req, response) => {
  try {
    const _id = +req.user._id;
    await app.db.sn_user().updateOne({ _id }, { $set: { onBoarding: true } });
    response.json({ success: 'onBoarding updated' }).status(201);
  } catch (err) {
    response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

module.exports.requestMoney = async (req, res) => {
  try {
    let lang = 'en';
    app.i18n.configureTranslation(lang);
    const id = req.user._id;
    let code = await QRCode.toDataURL(req.body.wallet);

    await app.account.notificationManager(id, 'send_demande_satt_event', {
      name: req.body.to,
      price: req.body.price,
      currency: req.body.cryptoCurrency,
    });

    var result = await app.db.user().findOne({ email: req.body.to });
    if (result) {
      await app.account.notificationManager(result._id, 'demande_satt_event', {
        name: req.body.name,
        price: req.body.price,
        currency: req.body.cryptoCurrency,
      });
    }
    readHTMLFileProfile(
      __dirname + '/../public/emailtemplate/notification.html',
      'notification',
      req.body,
      null,
      null,
      code
    );

    res.end(JSON.stringify({ message: 'Email was sent to ' + req.body.to }));
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

exports.support = async (req, res) => {
  try {
    readHTMLFileProfile(
      __dirname + '/../public/emailtemplate/contact_support.html',
      'contact_support',
      req.body
    );

    res.end(JSON.stringify({ message: 'Email was sent' }));
  } catch (err) {
    res.send(JSON.stringify(err));
  }
};

module.exports.notificationUpdate = async (req, res) => {
  try {
    let id = req.params.id;
    await app.db
      .notification()
      .updateOne({ _id: ObjectId(id) }, { $set: { isSeen: true } });
    res.send(JSON.stringify({ message: 'notification_seen' })).status(201);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

module.exports.changeNotificationsStatus = async (req, res) => {
  try {
    const idNode = '0' + req.user._id;
    await app.db
      .notification()
      .find({ $and: [{ idNode }, { isSend: false }] })
      .forEach((elem) => {
        elem.isSend = true;
        app.db.notification().save(elem);
      });
    res.send(JSON.stringify({ message: 'Notification clicked' })).status(200);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

module.exports.getNotifications = async (req, res) => {
  try {
    const idNode = '0' + req.user._id;
    const arrayNotifications = await app.db
      .notification()
      .find({ idNode })
      .sort({ created: -1 })
      .toArray();
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const notifications = {};
    if (endIndex < arrayNotifications.length) {
      notifications.next = {
        page: page + 1,
        limit: limit,
      };
    }
    if (startIndex > 0) {
      notifications.previous = {
        page: page - 1,
        limit: limit,
      };
    }
    const isSend = await app.db.notification().find({ idNode, isSend: false }).toArray();
    notifications.isSend = isSend.length;
    notifications.notifications = arrayNotifications.slice(startIndex, endIndex);
    res.send(notifications);
  } catch (err) {
    res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

module.exports.changeEmail = async (req, res) => {
  var pass = req.body.pass;
  var email = req.body.email;
  var user = req.user;
  if (user.password != app.synfonyHash(pass)) {
    res.end(JSON.stringify('wrong password'));
    return;
  }
  var existUser = await app.db.sn_user().findOne({ email });
  if (existUser) {
    res.end(JSON.stringify('duplicated email'));
    return;
  } else {
    const code = Math.floor(100000 + Math.random() * 900000);
    newEmail = {};
    newEmail.email = email;
    newEmail.expiring = Date.now() + 3600 * 20;
    newEmail.code = code;

    await app.db
      .sn_user()
      .updateOne({ _id: Long.fromNumber(req.user._id) }, { $set: { newEmail } });

    let requestDate = app.account.manageTime();
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip) ip = ip.split(':')[3];

    const lang = req.query.lang || 'en';
    app.i18n.configureTranslation(lang);

    // let subject = (lang == "en") ? "Satt wallet change email" : "";

    readHTMLFileProfile(
      __dirname + '/../public/emailtemplate/changeEmail.html',
      'changeEmail',
      null,
      ip,
      requestDate,
      code,
      newEmail
    );

    res.end(JSON.stringify({ message: 'Email was sent to ' + user.email }));
  }
};
module.exports.confrimChangeMail = async (req, response) => {
  try {
    var id = req.user._id;
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
      await app.db
        .sn_user()
        .updateOne({ _id: Long.fromNumber(id) }, { $set: { email: newEmail } });
      response.end(JSON.stringify('email changed')).status(200);
    }
  } catch (err) {
    response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};

module.exports.verifyLink = async (req, response) => {
  try {
    var userId = req.user._id;
    var typeSN = req.params.typeSN;
    var idUser = req.params.idUser;
    var idPost = req.params.idPost;
    if (!userId) response.end('{error:"no user session"}');
    var linked = false;
    var deactivate = false;
    var res = false;
    switch (typeSN) {
      case '1':
        fbProfile = await app.db.fbProfile().findOne({ UserId: userId });
        if (fbProfile) {
          linked = true;
          res = await app.oracle.verifyFacebook(userId, idUser, idPost);
          if (res && res.deactivate === true) deactivate = true;
        }
        break;
      case '2':
        googleProfile = await app.db.googleProfile().findOne({ UserId: userId });
        if (googleProfile) {
          var options = {
            method: 'POST',
            uri: 'https://oauth2.googleapis.com/token',
            body: {
              client_id: app.config.googleClientId,
              client_secret: app.config.googleClientSecret,
              refresh_token: googleProfile.refreshToken,
              grant_type: 'refresh_token',
            },
            json: true,
          };
          result = await rp(options);
          await app.db
            .googleProfile()
            .updateOne(
              { UserId: userId },
              { $set: { accessToken: result.access_token } }
            );
          linked = true;
          res = await app.oracle.verifyYoutube(userId, idPost);
          if (res && res.deactivate === true) deactivate = true;
        }

        break;
      case '3':
        page = await app.db
          .fbPage()
          .findOne({ $and: [{ UserId: userId }, { instagram_id: { $exists: true } }] });
        if (page) {
          linked = true;
          res = await app.oracle.verifyInsta(userId, idPost);
          if (res === 'deactivate') deactivate = true;
        }

        break;
      case '4':
        var twitterProfile = await app.db.twitterProfile().findOne({ UserId: userId });
        if (twitterProfile) {
          linked = true;
          res = await app.oracle.verifyTwitter(userId, idPost);
          if (res === 'deactivate') deactivate = true;
        }

        break;
      case '5':
        var linkedinProfile = await app.db.linkedinProfile().findOne({ userId });
        if (linkedinProfile && linkedinProfile.pages.length > 0) {
          linked = true;
          res = await app.oracle.verifyLinkedin(linkedinProfile, idPost);
          if (res === 'deactivate') deactivate = true;
        }

        break;
      default:
    }

    if (!linked) response.end('{error:"account not linked"}');
    else if (res === 'lien_invalid') response.end('{error:"lien_invalid"}');
    else if (deactivate) response.end('{error:"account desactivated"}');
    else response.end('{result:' + (res ? 'true' : 'false') + '}');
  } catch (err) {
    response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
  }
};
