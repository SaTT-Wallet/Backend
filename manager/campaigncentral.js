module.exports = async function (app) {

	var fs = require("fs");
	var child = require('child_process');
	var BN = app.web3.utils.BN;
	var campaignCentralManager = {};

campaignCentralManager.getGasPrice = async () {
	return new Promise(async (resolve, reject) => {
		resolve(0);
	})
}

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

				app.db.campaign().findOne({id : idCampaign}, async function (err,cmp){
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
				var count = await app.db.apply().find({idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser}).count();
				if(count)
				{
					reject({message:"link already exists"});
					return;
				}
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
				app.db.apply().findOne({_id : app.ObjectId(idProm)},async function (err,prom){
					console.log(prom,err);
					if(prom)
					{
						var cmp = await app.db.campaign().findOne({id : prom.idCampaign});
						if(cmp.owner == credentials.address) {
							app.db.apply().updateOne({_id :  app.ObjectId(idProm)},{$set: {isAccepted: true}});
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

				app.db.apply().findOne({_id :  app.ObjectId(idProm)},async function (err,prom){

					var gas = 60000;
					var gasPrice = await app.web3.eth.getGasPrice();

					var cmp = await app.db.campaign().findOne({id : prom.idCampaign})

					var stats = false;
					switch(""+prom.typeSN) {
						case "1" :
							stats = await app.oracle.facebook(prom.idUser,idPost);

						break;
						case "2" :
							stats = await app.oracle.youtube(prom.idPost);

						break;
						case "3" :
							stats = await app.oracle.instagram(prom.idPost)

						break;
						case "4" :
							stats = await app.oracle.twitter(prom.idUser,prom.idPost)

						break;
						default :
							stats = {likes:0,shares:0,views:0,date:Date.now()};
						break;
					}



					if( stats.likes > prom.likes || stats.shares > prom.shares || stats.views > prom.views)
					{
						typeSNindex = parseInt(prom.typeSN)*3;
						var a = new BN( stats.likes);
						var b = new BN(cmp.ratios[typeSNindex-3]);

						var gains = a.mul(b);
						var c = new BN(cmp.ratios[typeSNindex-2]);
						var d = new BN(stats.shares);
						gains.iadd(c.mul(d));

						var e = new BN(cmp.ratios[typeSNindex-1]);
						var f = new BN(stats.views);
						gains.iadd(e.mul(f));

            var g = new BN(cmp.amount);
						var h = new BN( prom.paidGains);
						var topay = gains.sub(h);

						if( g.lt(topay))
						{
							topay = g;
							// alerte campagne plus de fonds
						}

						var newAmount = (new BN(cmp.amount)).sub(topay);
						var paidGains =(new BN( prom.paidGains)).add(topay);



						await app.db.campaign().updateOne({id : prom.idCampaign},{$set: {amount: newAmount.toString()}});
						await app.db.apply().updateOne({_id :  app.ObjectId(idProm)},{$set: {likes:stats.likes,shares:stats.shares,views:stats.views,totalGains:gains.toString(),paidGains:paidGains.toString()}});

						app.web3.eth.accounts.wallet.decrypt([app.config.sattReserveKs], app.config.SattReservePass);
						//console.log(cmp.token,prom.influencer,topay.toString(),app.config.SattReserve);
						var receipt = await app.erc20.transfer(cmp.token,prom.influencer,topay.toString(),{address:app.config.SattReserve})
						resolve({transactionHash:receipt.transactionHash,idProm:idProm,to:prom.influencer,amount:topay.toString()})
					}

				})

			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	campaignCentralManager.withdraw = async function (UserId,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = 100000;

				app.db.wallet().findOne({UserId : UserId},async function (err,wallet){
					if(wallet) {
						if(wallet.amount)
						{
							var amount = new BN(wallet.amount);
							app.db.wallet().updateOne({UserId : UserId},{$set: {amount: 0}});
							var addr = "0x"+wallet.keystore.address;
							app.web3.eth.accounts.wallet.decrypt([app.config.sattReserveKs], app.config.SattReservePass);
							//console.log(cmp.token,prom.influencer,topay.toString(),app.config.SattReserve);
							var receipt = await app.erc20.transfer(app.config.tokenContract,addr,amount.toString(),{address:app.config.SattReserve})
							resolve({transactionHash:receipt.transactionHash,to:addr,amount:amount.toString()})
						}
						else {
							resolve({"message":"no amount"});
							return;
						}

					}
					else {
						reject({"message":"wallet not available"});
						return;
					}
				});

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

				app.db.campaign().findOne({id : idCampaign},async function (err,cmp){
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

	campaignCentralManager.getAllGains = async function (credentials) {
		return new Promise(async (resolve, reject) => {
			try {

			var proms = await app.db.apply().find({influencer : credentials.address}).toArray();
			var topays = new BN(0);
			var erctoken = "";
			for(var i = 0;i<proms.length;i++) {
				var prom = proms[i];
				var count = await app.db.ban().find({idProm:prom._id}).count();
				if(count) {
					//reject({"message":"oracle not available"});
					continue;
				}
				var cmp = await app.db.campaign().findOne({id : prom.idCampaign})
			 erctoken = cmp.token;
				var stats = false;
				switch(""+prom.typeSN) {
					case "1" :
						stats = await app.oracle.facebook(prom.idUser,idPost);

					break;
					case "2" :
						stats = await app.oracle.youtube(prom.idPost);

					break;
					case "3" :
						stats = await app.oracle.instagram(prom.idPost)

					break;
					case "4" :
						stats = await app.oracle.twitter(prom.idUser,prom.idPost)

					break;
					default :
						stats = {likes:0,shares:0,views:0,date:Date.now()};
					break;
				}

				if( stats.likes > prom.likes || stats.shares > prom.shares || stats.views > prom.views)
				{
					typeSNindex = parseInt(prom.typeSN)*3;
					var a = new BN( stats.likes);
					var b = new BN(cmp.ratios[typeSNindex-3]);

					var gains = a.mul(b);
					var c = new BN(cmp.ratios[typeSNindex-2]);
					var d = new BN(stats.shares);
					gains.iadd(c.mul(d));

					var e = new BN(cmp.ratios[typeSNindex-1]);
					var f = new BN(stats.views);
					gains.iadd(e.mul(f));

					var g = new BN(cmp.amount);
					var h = new BN( prom.paidGains);
					var topay = gains.sub(h);

					if( g.lt(topay))
					{
						topay = g;
						// alerte campagne plus de fonds
					}

					var newAmount = (new BN(cmp.amount)).sub(topay);
					var paidGains =(new BN( prom.paidGains)).add(topay);

					await app.db.campaign().updateOne({id : prom.idCampaign},{$set: {amount: newAmount.toString()}});
					await app.db.apply().updateOne({_id :  app.ObjectId(idProm)},{$set: {likes:stats.likes,shares:stats.shares,views:stats.views,totalGains:gains.toString(),paidGains:paidGains.toString()}});
					topays.iadd(topay)
				}
			}

			var gas = 60000;
			var gasPrice = await app.web3.eth.getGasPrice();

			app.web3.eth.accounts.wallet.decrypt([app.config.sattReserveKs], app.config.SattReservePass);
			//console.log(cmp.token,prom.influencer,topay.toString(),app.config.SattReserve);
			var receipt = await app.erc20.transfer(erctoken,credentials.address,topays.toString(),{address:app.config.SattReserve})
			resolve({transactionHash:receipt.transactionHash,to:credentials.address,amount:topays.toString()})

			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	app.campaignCentral = campaignCentralManager;
	return app;
}
