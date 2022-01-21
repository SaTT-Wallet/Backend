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

	//var db = await mongoClient.connect("mongodb://" + app.config.mongoUser + ":" + app.config.mongoPass + "@" + app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBase, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
	var db = await mongoClient.connect("mongodb://" + app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBase, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
	var db2 = await mongoClient.connect("mongodb://"+ app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBaseCrm, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)

	app.db.accessToken = function () {
				return db2.db(app.config.mongoBaseCrm).collection('access_token');
			};

		app.db.campaignCrm = function () {
            return db2.db(app.config.mongoBaseCrm).collection(app.config.campaignCollection);
        };
		app.db.campaigns= function () {
            return db2.db(app.config.mongoBaseCrm).collection('campaigns');
        };
		app.db.captcha= function () {
            return db2.db(app.config.mongoBaseCrm).collection('captcha');
        };
        app.db.referral = function () {
			return db2.db(app.config.mongoBaseCrm).collection('referral');
	       };

		   app.db.interests = function () {
			return db2.db(app.config.mongoBase).collection('interests');
	       };

        app.db.campaign_kit = function () {

            return db.db(app.config.mongoBaseCrm).collection("campaign_kit");
        };
		app.db.notification = function () {
            return db.db(app.config.mongoBaseCrm).collection("notification");
        };
		app.db.CampaignLinkStatistic = function () {
            return db.db(app.config.mongoBase).collection("campaign_link_statistic");
        };
		app.db.UserLegal = function () {
            return db.db(app.config.mongoBaseCrm).collection("user_legal");
        };

		app.db.UsersId = function () {
            return db2.db(app.config.mongoBaseCrm).collection("UserID");
        };

		app.db.contact = function () {
            return db.db(app.config.mongoBaseCrm).collection("contacts");
        };
		app.db.campaign_link = function () {
            return db.db(app.config.mongoBaseCrm).collection("campaign_link");
        };
		app.db.user = function () {
            return db2.db(app.config.mongoBaseCrm).collection("sn_user");
        };
        app.db.wallet = function () {
            return db.db(app.config.mongoBase).collection(app.config.walletCollection);
        };
		app.db.walletUserNode = function () {
            return db.db(app.config.mongoBaseCrm).collection("wallet_user_node");
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

		app.db.sattbuy = function () {
            return db.db(app.config.mongoBase).collection(app.config.sattBuyCollection);
        };

		app.db.satt_tx = function () {
            return db2.db(app.config.mongoBaseCrm).collection('satt_transactions');
        };

		app.db.sn_user = function () {
            return db2.db(app.config.mongoBaseCrm).collection('sn_user');
        };
        app.db.sn_user_archived = function () {
            return db2.db(app.config.mongoBaseCrm).collection('sn_user_archived');
        };
		app.db.buy = function () {
		return db2.db(app.config.mongoBaseCrm).collection('buy_satt');
			};

		app.db.indexedtx = function () {
			return db.db(app.config.mongoBase).collection('indexed_tx');
	};

		app.db.balance = function () {
				return db.db(app.config.mongoBase).collection('balance');
		};
		app.db.balance2 = function () {
				return db.db(app.config.mongoBase).collection('balance2');
		};
		app.db.delta = function () {
				return db.db(app.config.mongoBase).collection('delta');
		};
		app.db.customToken = function () {
			return db.db(app.config.mongoBase).collection('custom_token');
	    };

		app.db.bep20 = function () {
          return db.db(app.config.mongoBase).collection(app.config.bep20Collection);
    };

		app.db.fbProfile = function () {
				return db.db(app.config.mongoBase).collection('fb_profile');
		};

		app.db.fbPage = function () {
				return db.db(app.config.mongoBase).collection('fb_page');
		};

		app.db.googleProfile = function () {
				return db.db(app.config.mongoBase).collection('google_profile');
		};

		app.db.twitterProfile = function () {
				return db.db(app.config.mongoBase).collection('twitter_profile');
		};
		app.db.linkedinProfile = () =>{
			return db.db(app.config.mongoBase).collection('linkedin_profile');
	};
	app.db.paymentEvents = () =>{
		return db.db(app.config.mongoBase).collection('payment_event');
    };

		app.db.ig_media = function () {
						return db.db(app.config.mongoBase).collection("ig_media");
		};
    return app;
}
