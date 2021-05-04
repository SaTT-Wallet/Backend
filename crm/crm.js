module.exports = async function (app) {

	var request = require('request');
	var rp = require('request-promise');

	var crm = {};

	/*crm.auth = function (token,callback) {

		request(app.config.CrmAuthUrl+token, { json: true }, function(err, res, body) {
			if(body.user) {


				app.db.wallet().findOne({UserId: body.user.idUser}).then(function(account,err) {
					if(account)
					{
						callback({id:account.UserId,uid:account._id});
						return;
					}


					app.db.wallet().findOne({_id: body.user.scopedId}).then(function(account2,err){


						app.db.wallet().updateOne({_id: body.user.scopedId}, {$set: {UserId: body.user.idUser}}, function (err4,res4) {
							callback({id:body.user.idUser,uid:body.user.scopedId})
						});



					});


				});

			}
			else
				callback({error:"auth error"});
		});


	}*/

	var tokens = [];

	/*crm.auth = async function (token) {
		return new Promise(async (resolve, reject) => {
			try {
				if(tokens[token])
				{
					resolve(tokens[token]);
					return;
				}
				var body = await rp({uri:app.config.CrmAuthUrl+token,json: true});
				if(body.user) {
					var account = await app.db.wallet().findOne({UserId: body.user.idUser});
					if(account)
					{
						resolve({id:account.UserId,uid:account._id});
					}
					var account2 = await app.db.wallet().findOne({_id: body.user.scopedId});
					await app.db.wallet().updateOne({_id: body.user.scopedId}, {$set: {UserId: body.user.idUser}});
					tokens[token] = {id:body.user.idUser,uid:body.user.scopedId};
					resolve({id:body.user.idUser,uid:body.user.scopedId});
				}
				else{
					reject({error:"auth error"});
				}
			}
			catch(err) {
				reject(err);
			}
		});
		return p;
	}*/



	crm.auth = async function (token) {
		return new Promise(async (resolve, reject) => {
			try {
				if(tokens[token])
				{
					resolve(tokens[token]);
					return;
				}

				//console.log("token",token)
				if(app.config.testnet) {
					var UserId = 9999999999;
					tokens[token] = {id:UserId}
					resolve({id:UserId});
					return;
				}

				var res = await app.db.query("Select user_id from OAAccessToken where token = '"+token+"'")
				if(res.length) {
					var UserId = res[0].user_id;

					tokens[token] = {id:UserId}
					resolve({id:UserId});

				}
				else{
					var res = await app.db.accessToken().findOne({token:token});
                    if(res){
                        var UserId = res.user_id;
                        resolve({id:UserId});
                    }else{
                        reject({error:"auth error"});
                    }
				}
			}
			catch(err) {
				reject(err);
			}
		});
		return p;
	}

	app.crm = crm;



	return app;
}
