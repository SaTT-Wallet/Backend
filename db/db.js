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
	 var db = await mongoClient.connect("mongodb://" + app.config.mongoUser + ":" + app.config.mongoPass + "@" + app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBase, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)
	var db2 = await mongoClient.connect("mongodb://"+ app.config.mongoHost + ":" + app.config.mongoPort + "/" + app.config.mongoBaseCrm, {useNewUrlParser: true,useUnifiedTopology: true}).catch(console.log)    
	app.url=db2.s.url;

		app.db.campaignCrm = function () {
            return db2.db(app.config.mongoBaseCrm).collection(app.config.campaignCollection);
        };

        app.db.campaign_kit = function () {

            return db.db(app.config.mongoBaseCrm).collection("campaign_kit");
        };
        app.db.userFiles = function () {
            return db.db(app.config.mongoBaseCrm).collection("user_files");
        };
		app.db.notification = function () {
            return db.db(app.config.mongoBaseCrm).collection("notification");
        };
		app.db.UserLegal = function () {
            return db.db(app.config.mongoBaseCrm).collection("user_legal");
        };
		app.db.campaign_link = function () {
            return db.db(app.config.mongoBaseCrm).collection("campaign_link");
        };
		app.db.campaignCover = function () {
            return db.db(app.config.mongoBaseCrm).collection("campaign_cover");
        };

		app.db.user = function () {
            return db2.db(app.config.mongoBaseCrm).collection("sn_user");
        };		
        app.db.wallet = function () {
            return db.db(app.config.mongoBase).collection(app.config.walletCollection);
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

		app.db.bep20 = function () {
          return db.db(app.config.mongoBase).collection(app.config.bep20Collection);
    };
    return app;
}
