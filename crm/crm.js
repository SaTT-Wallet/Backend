module.exports = async function (app) {

	var request = require('request');
	var rp = require('request-promise');

	var crm = {};

var tokens = [];


	crm.auth = async function (token) {
		return new Promise(async (resolve, reject) => {
			try {
				if(tokens[token])
				{
					resolve(tokens[token]);
					return;
				}


				var res = false;

				var res = await app.db.accessToken().findOne({token:token});



				if(res) {
					var UserId = res[0].user_id;
					tokens[token] = {id:UserId}
					resolve({id:UserId});

				}
				else{
					if(!app.config.testnet && app.db.query ) {
						 res = await app.db.query("Select user_id from OAAccessToken where token = '"+token+"'")
					}

                    if(res && res.length){
                        var UserId = res.user_id;
												tokens[token] = {id:UserId}
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
