var express = require('express');
var app = express();

const Big = require('big.js');
const etherInWei = new Big(1000000000000000000);

var rp = require('request-promise');
const { randomUUID } = require('crypto');
const { v5: uuidv5 } = require('uuid');
var fs = require('fs');

var nodemailer = require('nodemailer');
const hasha = require('hasha');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const GridFsStorage = require('multer-gridfs-storage');

const handlebars = require('handlebars');
var ejs = require('ejs');

exports.connection = async () => {
  app = await require('../conf/config')(app);
  app = await require('../conf/const')(app);
  app = await require('../db/db')(app);
  app = await require('../manager/i18n')(app);
  app = await require('../web3/oracle')(app);
  app = await require('../manager/notification')(app);

  app = await require('../web3/provider')(app);
  app = await require('../manager/bep20')(app);

  app = await require('../web3/campaign')(app);
  app = await require('../web3/satt')(app);
  app = await require('../web3/eth')(app);
  app = await require('../web3/erc20')(app);

  app = await require('../manager/account')(app);
  app = await require('../web3/initcontracts')(app);

  app.transporter = nodemailer.createTransport(app.config.mailerOptions);

  app.synfonyHash = function (pass) {
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

  app.cloneUser = (user) => {
    const {
      daily,
      weekly,
      monthly,
      failed_count,
      account_locked,
      created,
      updated,
      confirmation_token,
      ...newUser
    } = user;
    return newUser;
  };
  //global function that generates user acessToken
  app.generateAccessToken = (user) =>
    jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '24h' });

  app.mongoURI = app.config.mongoURI;

  app.readHTMLFile = (path, callback) => {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
      if (err) {
        console.log(err);
        throw err;
        callback(err);
      } else {
        callback(null, html);
      }
    });
  };

  return app;
};

exports.readHTMLFileProfile = (path, event, body, ip, requestDate, code, newEmail) => {
  readHTMLFile(path, async (err, html) => {
    var template = handlebars.compile(html);

    if (event === 'changeEmail') {
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

      var mailOptions = {
        from: app.config.mailSender,
        //to: user.email,
        to: newEmail.email,
        subject: 'Satt wallet change email',
        html: htmlToSend,
      };
    }

    if (event === 'contact_support') {
      let mailContent = {
        SaTT: {
          Url: app.config.baseUrl + 'FAQ',
        },
        letter: {
          from: body.name + ' (' + body.email + ')',
          subject: body.subject,
          message: body.message,
        },
      };
      let htmlToSend = ejs.render(html, mailContent);

      var mailOptions = {
        from: app.config.notificationMail,
        to: app.config.contactMail,
        subject: 'customer service',
        html: htmlToSend,
      };
    }

    if (event === 'notification') {
      var mailContent = {
        SaTT: {
          faq: app.config.Satt_faq,
          imageUrl: app.config.baseEmailImgURl,
          Url: app.config.basedURl,
        },
        notification: {
          name: body.name,
          price: body.price,
          cryptoCurrency: body.cryptoCurrency,
          message: body.message,
          wallet: body.wallet,
        },
      };

      var htmlToSend = template(mailContent);

      var mailOptions = {
        from: app.config.mailSender,
        to: body.to,
        subject: 'Payment request',
        html: htmlToSend,
        attachments: [
          {
            filename: 'codeQr.jpg',
            contentType: 'image/png',
            content: new Buffer.from(code.split('base64,')[1], 'base64'),
          },
        ],
      };
    }

    await app.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        res.end(JSON.stringify(info.response));
        res.end(JSON.stringify({ message: 'Email sent' }));
      }
    });
  });
};

exports.readHTMLFileLogin = (path, event, ip, requestDate, code, user) => {
  readHTMLFile(path, async (err, html) => {
    var template = handlebars.compile(html);

    if (event === 'codeRecover') {
      console.log('--------- codeRecover call');
      var replacements = {
        ip,
        code,
        requestDate,
        satt_url: app.config.basedURl,
        imgUrl: app.config.baseEmailImgURl,
        satt_faq: app.config.Satt_faq,
      };
      var htmlToSend = template(replacements);
      var mailOptions = {
        from: app.config.resetpassword_Email,
        to: user.email,
        subject: 'Satt wallet password recover',
        html: htmlToSend,
      };
    }

    if (event === 'emailValidation') {
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
    }
    await app.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(info.response);
      }
    });
  });
};

exports.readHTMLFileCampaign = (path, event, title, email, reason, link) => {
  readHTMLFile(path, async (err, html) => {
    var template = handlebars.compile(html);

    if (event === 'rejectLink') {
      var emailContent = {
        reject_reason: reason,
        cmp_link: app.config.basedURl + '/myWallet/campaign/' + idCampaign,
        satt_faq: app.config.Satt_faq,
        satt_url: app.config.basedURl,
        cmp_title: title,
        imgUrl: app.config.baseEmailImgURl,
      };
      var htmlToSend = template(emailContent);

      var mailOptions = {
        from: app.config.mailSender,
        to: email,
        subject: 'Your link has been rejected in a campaign',
        html: htmlToSend,
      };
    }

    if (event === 'campaignValidation') {
      var emailContent = {
        cmp_link: app.config.basedURl + '/myWallet/campaign/' + idCampaign,
        satt_faq: app.config.Satt_faq,
        satt_url: app.config.basedURl,
        cmp_title: title,
        imgUrl: app.config.baseEmailImgURl,
      };
      var htmlToSend = template(emailContent);

      var mailOptions = {
        from: app.config.mailSender,
        to: email,
        subject: 'Your link has been accepted in a campaign',
        html: htmlToSend,
      };
    }

    if (event === 'linkNotifications') {
      let emailContent = {
        cmp_name: title,
        cmp_link: link,
        cmp_imgUrl: app.config.baseEmailImgURl,
        cmp_satt_faq: app.config.Satt_faq,
      };
      let htmlToSend = template(emailContent);

      var mailOptions = {
        from: app.config.mailSender,
        to: email,
        subject: 'New link was added To your campaign',
        html: htmlToSend,
      };
    }

    await app.transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error.message);
      } else {
        console.log(info.response);
      }
    });
  });
};

const readHTMLFile = (path, callback) => {
  fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
    if (err) {
      console.log(err);
      throw err;
      callback(err);
    } else {
      callback(null, html);
    }
  });
};
