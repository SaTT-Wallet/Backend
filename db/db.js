module.exports = async function (app) {
	var mongo = require('mongodb');
    var mongoClient = mongo.MongoClient;
	app.ObjectId = mongo.ObjectId;

	var mysql = require('mysql');

	var myconn  = mysql.createPool({
	  host     : app.config.mysqlHost,
	  user     : app.config.mysqlUser,
	  password : app.config.mysqlPass,
	  database : app.config.mysqlDb,
	  connectionLimit : 5,
	});

	app.db = {};

	app.db.query = function (query) {

		return new Promise( async (resolve, reject) => {

			myconn.query(query, function (error, results, fields) {
				if (error) {
				  reject(error);
				}
				else {
					resolve(results);
				}

			});
		});

	}

	app.db.insert = function (query,fields) {
		return new Promise( async (resolve, reject) => {

			myconn.query(query,fields, function (error, results, fields) {
				if (error) {
				  reject(error);
				}
				else {
					resolve(results);
				}

			});
		});
	}

	var db = await mongoClient.connect("mongodb://" + app.config.mongoUser + ":" + app.config.mongoPass + "@"  + app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBase, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
	

	app.db.accessToken = function () {
				return db.db(app.config.mongoBase).collection(app.config.accessTokenCollection);
			};

		app.db.campaignCrm = function () {
            return db.db(app.config.mongoBase).collection(app.config.campaignCollection);
        };
		app.db.campaigns= function () {
            return db.db(app.config.mongoBase).collection(app.config.campaignsCollection);
        };
		app.db.captcha= function () {
            return db.db(app.config.mongoBase).collection(app.config.captchaCollection);
        };
        app.db.referral = function () {
			return db.db(app.config.mongoBase).collection(app.config.referalCollection);
	       };

		   app.db.interests = function () {
			return db.db(app.config.mongoBase).collection(app.config.interestCollection);
	       };

        app.db.campaign_kit = function () {

            return db.db(app.config.mongoBase).collection(app.config.kitCollection);
        };
		app.db.notification = function () {
            return db.db(app.config.mongoBase).collection(app.config.notifCollection);
        };
		app.db.CampaignLinkStatistic = function () {
            return db.db(app.config.mongoBase).collection(app.config.linkStatCollection);
        };
		app.db.UserLegal = function () {
            return db.db(app.config.mongoBase).collection(app.config.legalCollection);
        };

		app.db.UsersId = function () {
            return db.db(app.config.mongoBase).collection(app.config.userIDCollection);
        };

		app.db.contact = function () {
            return db.db(app.config.mongoBase).collection(app.config.contactCollection);
        };
		app.db.campaign_link = function () {
            return db.db(app.config.mongoBase).collection(app.config.linkCollection);
        };
		app.db.user = function () {
            return db.db(app.config.mongoBase).collection(app.config.userCollection);
        };
        app.db.wallet = function () {
            return db.db(app.config.mongoBase).collection(app.config.walletCollection);
        };
		app.db.walletUserNode = function () {
            return db.db(app.config.mongoBase).collection(app.config.userNodeCollection);
        };

		 app.db.passwallet = function () {
            return db.db(app.config.mongoBase).collection(app.config.passWalletCollection);
        };

		app.db.contract = function () {

            return db.db(app.config.mongoBase).collection(app.config.contractCollection);
        };

		app.db.request = function () {
            return db.db(app.config.mongoBase).collection(app.config.requestCollection);
        };

		app.db.event = function () {
            return db.db(app.config.mongoBase).collection(app.config.eventCollection);
        };

		app.db.campaign = function () {
            return db.db(app.config.mongoBase).collection(app.config.campaignCollection);
        };
		app.db.rate = function () {
            return db.db(app.config.mongoBase).collection(app.config.rateCollection);
        };
		app.db.txs = function () {
            return db.db(app.config.mongoBase).collection(app.config.txCollection);
        };
		app.db.ban = function () {
            return db.db(app.config.mongoBase).collection(app.config.oracleBanCollection);
        };

		app.db.apply = function () {
            return db.db(app.config.mongoBase).collection(app.config.applyCollection);
        };

		/*app.db.sattbuy = function () {
            return db.db(app.config.mongoBase).collection(app.config.sattBuyCollection);
        };

	/*	app.db.satt_tx = function () {
            return db.db(app.config.mongoBase).collection('satt_transactions');
        };*/

		app.db.sn_user = function () {
            return db.db(app.config.mongoBase).collection(app.config.userCollection);
        };
        app.db.sn_user_archived = function () {
            return db.db(app.config.mongoBase).collection(app.config.userArchiveCollection);
        };
	/*	app.db.buy = function () {
		return db.db(app.config.mongoBase).collection('buy_satt');
			};

		*/

		/*app.db.indexedtx = function () {
			return db.db(app.config.mongoBase).collection('indexed_tx');
	};*/

	/*	app.db.balance = function () {
				return db.db(app.config.mongoBase).collection('balance');
		};
		app.db.balance2 = function () {
				return db.db(app.config.mongoBase).collection('balance2');
		};
		app.db.delta = function () {
				return db.db(app.config.mongoBase).collection('delta');
		};
		
		*/
		app.db.customToken = function () {
			return db.db(app.config.mongoBase).collection(app.config.customTokenCollection);
	    };

		app.db.bep20 = function () {
          return db.db(app.config.mongoBase).collection(app.config.bep20Collection);
    };

		app.db.fbProfile = function () {
				return db.db(app.config.mongoBase).collection(app.config.fbProfileCollection);
		};

		app.db.fbPage = function () {
				return db.db(app.config.mongoBase).collection(app.config.fbPageCollection);
		};

		app.db.googleProfile = function () {
				return db.db(app.config.mongoBase).collection(app.config.googleProfileCollection);
		};

		app.db.twitterProfile = function () {
				return db.db(app.config.mongoBase).collection(app.config.twitterProfileCollection);
		};
		app.db.linkedinProfile = () =>{
			return db.db(app.config.mongoBase).collection(app.config.linkedinProfileCollection);
	};
	app.db.paymentEvents = () =>{
		return db.db(app.config.mongoBase).collection(app.config.paymentCollection);
    };

		app.db.ig_media = function () {
						return db.db(app.config.mongoBase).collection(app.config.igMediaCollection);
		};
    return app;
}
