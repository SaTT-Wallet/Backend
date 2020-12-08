module.exports = async function (app) {

	var fs = require("fs");
	var solc = require("solc");
	var child = require('child_process');
	var BN = app.web3.utils.BN;
	var campaignCentralManager = {};



	campaignCentralManager.createCampaignAll = async function (dataUrl,startDate,endDate,ratios,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {

			try {

				var receipt = await app.erc20.transfer(token,app.config.SattReserve,amount,credentials);



				var campaign = {
					id : receipt.transactionHash,
					startDate : startDate,
					endDate : endDate,
					dataUrl : dataUrl,
					ratios:ratios,
					token:token,
					amount:amount,
					status : "created",
					owner:credentials.address,
					contract:"central"
				};

				app.db.campaign().insertOne(campaign);


				resolve(receipt.transactionHash);
				} catch (err) {
					reject(err)
				}

		})
	}


	campaignCentralManager.fundCampaign = async function (idCampaign,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = 60000;

				app.db.campaign().findOne({id : idCampaign}, async function (cmp,err){
					if(cmp) {
						if(cmp.token != token)
						{
							reject({message:"token not valid"})
						}
						else
						{

							var receipt = await app.erc20.transfer(token,app.config.SattReserve,amount,credentials);
							var newAmount = cmp.amount + amount;
							await app.db.campaign().updateOne({id : idCampaign},{$set: {amount: newAmount}});
							resolve({id:cmp.id});
						}

					}
					else {
						reject({message:"campaign id not found"})
					}

				})

			} catch (err) {
				reject(err)
			}
		})
	}



	campaignCentralManager.applyCampaign = async function (idCampaign,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var applyLink = {idCampaign:idCampaign,influencer:credentials.address,typeSN:typeSN,idPost:idPost,idUser:idUser,date:Date.now(),isAccepted:false,views:0,likes:0,shares:0,totalGains:0,paidGains:0};
				var ret = await app.db.apply().insertOne(applyLink);
				resolve(ret.insertedId);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}



	campaignCentralManager.validateProm = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				app.db.apply().findOne({id : idProm},async function (prom,err){
					if(prom)
					{
						var cmp = await app.db.campaign().findOne({id : prom.idCampaign});
						if(cmp.owner == credentials.address) {
							app.db.apply().updateOne({id : idProm},{$set: {isAccepted: true}});
							resolve({idProm:idProm})
						}
						else{
							reject({message:"campaign owner error"})
						}
					}
					else {
						reject({message:"link id not found"})
					}
				});

			}
			catch (err)
			{
				reject(err);
			}
		})
	}






	campaignCentralManager.getGains = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var count = await app.db.ban().find({idProm:idProm}).count();
				if(count) {
					reject({"message":"oracle not available"});
					return;
				}
				app.db.apply().findOne({id : idProm},async function (prom,err){

					var gas = 60000;
					var gasPrice = await app.web3.eth.getGasPrice();

					var cmp = await app.db.campaign().findOne({id : prom.idCampaign})

					var stats = false;
					switch(prom.typeSN) {
						case "1" :
							stats = await app.oracle.facebook(idUser,idPost);

						break;
						case "2" :
							stats = await app.oracle.youtube(idPost);

						break;
						case "3" :
							stats = await app.oracle.instagram(idPost)

						break;
						case "4" :
							stats = await app.oracle.twitter(idUser,idPost)

						break;
						default :
							stats = {likes:0,shares:0,views:0,date:Date.now()};
						break;
					}

					if( stats.likes > prom.likes || stats.shares > prom.shares || stats.views > prom.views)
					{
						typeSNindex = parseInt(prom.typeSN)*3;
						var gains = stats.likes*prom.ratios[typeSNindex-3];
						gains += stats.shares*prom.ratios[typeSNindex-2];
						gains += stats.views*prom.ratios[typeSNindex-1];
						var topay = gains - prom.paidGains;
						if(cmp.amount < topay)
						{
							topay = cmp.amount;
							// alerte campagne plus de fonds
						}
						newAmount = cmp.amount - topay;
						var paidGains = prom.paidGains + topay;

						await app.db.campaign().updateOne({id : prom.idCampaign},{$set: {amount: newAmount}});
						await app.db.apply().updateOne({id : idProm},{$set: {likes:stats.likes,shares:stats.shares,views:stats.views,totalGains:gains,paidGains:paidGains}});

						app.web3.eth.accounts.wallet.decrypt([app.config.sattReserveKs], app.config.SattReservePass);
						var receipt = await app.erc20.transfer(cmp.token,prom.influencer,topay,{address:app.config.SattReserve})
						resolve({transactionHash:receipt.transactionHash,idProm:idProm,to:prom.influencer,amount:topay})
					}

				})

			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	campaignCentralManager.getRemainingFunds = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = 60000;

				app.db.campaign().findOne({id : idCampaign},async function (cmp,err){
					if(cmp) {

						var amount = cmp.amount;
						await app.db.campaign().updateOne({id : idCampaign},{$set: {amount: 0,status : "ended"}});

						app.web3.eth.accounts.wallet.decrypt([app.config.sattReserveKs], app.config.SattReservePass);
						var receipt = await app.erc20.transfer(cmp.token,cmp.owner,amount,{address:app.config.SattReserve})

						resolve({id:cmp.id,to:cmp.owner,amount:amount});


					}
					else {
						reject({message:"campaign id not found"})
					}

				})

			} catch (err) {
				reject(err)
			}
		})
	}


	app.campaignCentral = campaignCentralManager;
	return app;
}
