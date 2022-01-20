module.exports = async function (app) {

	var request = require('request');
	var rp = require('request-promise');

	var crm = {};

var tokens = [];

	function expiringToken(date) {
		return (Math.floor(new Date().getTime() / 1000)) > date
	}
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
					if(!expiringToken(res.expires_at)){
						var UserId = res.user_id;
						tokens[token] = {id:UserId}
						var user = await app.db.sn_user().findOne({_id:UserId});
						resolve({id:UserId,user});
					}else{
						reject({error:"AC_Token expired"});
					}
					
				}
				else{
					if(!app.config.testnet && app.db.query ) {
						 res = await app.db.query("Select user_id from OAAccessToken where token = '"+token+"'")
					}
                    if(res && res.length){
						if(!expiringToken(res.expires_at)){
                        var UserId = res[0].user_id;
						tokens[token] = {id:UserId}
                        resolve({id:UserId,user:res[0]});
						}else{
							reject({error:"AC_Token expired"});
						}
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

	crm.checkToken = async (req,res) => {
		return new Promise(async (resolve, reject) => {
			try {
				if(!req.headers["authorization"]){
					res.end(JSON.stringify({ error: "token required" }))
					resolve({ error: "token required" })
					return;
				}
				else{
					token=req.headers["authorization"].split(" ")[1]
					resolve(token);
					return;
				}		
			}
			catch(err) {
				reject(err);
			}
		});
	}

	app.crm = crm;



	return app;
}
