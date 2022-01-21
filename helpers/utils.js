
var express = require('express');
var app = express();



const Big = require('big.js');
var rp = require('request-promise');
const {randomUUID}= require('crypto');
const { v5 : uuidv5 } = require('uuid')
var fs = require('fs');

var nodemailer = require('nodemailer');
const hasha = require('hasha');
const mongoose = require('mongoose');


exports.connection = async ()=>{



    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
    app = await require("../crm/crm")(app);
    app = await require("../manager/i18n")(app);
    app = await require("../fb/fb_init")(app);
    app = await require("../web3/oracle")(app);
    app= await require('../manager/notification')(app)

    app = await require("../web3/provider")(app);
    app = await require("../manager/bep20")(app);   

    app = await require("../web3/campaign")(app);
    app = await require("../web3/satt")(app);
    app = await require("../web3/eth")(app);
    app = await require("../web3/erc20")(app);

    app = await require("../manager/account")(app);
    app = await require("../web3/initcontracts")(app);


    var transporter = nodemailer.createTransport(app.config.mailerOptions);

 

    app.synfonyHash = function(pass) {
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


        app.mongoURI = app.config.mongoURI;

    app.readHTMLFile = (path, callback) => {
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
      
    return app

}