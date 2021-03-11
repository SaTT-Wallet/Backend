module.exports = function (app) {

	var fs = require('fs');

	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )

	var BN = require("bn.js");

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);

	app.post('/campaign/create', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var reward = req.body.rewardType || 1;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.createCampaign(dataUrl,startDate,endDate,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {

			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});



	app.post('/campaign/create/all', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var ratios = req.body.ratios;

		try {

			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			if(app.config.testnet && token == app.config.ctrs.token.address.mainnet) {
				token = app.config.ctrs.token.address.testnet;
			}

			/*var balance = await app.erc20.getBalance(token,cred.address);

			if( (new BN(balance.amount)).lt(new BN(amount)) )
			{
				response.end('{"error":"Insufficient token amount expected '+amount+' got '+balance.amount+'"}');
			}*/

			var ret = await app.campaign.createCampaignAll(dataUrl,startDate,endDate,ratios,token,amount,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});


	app.post('/campaign/create/youtube', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var likeRatio = req.body.likeRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.createCampaignYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});

	app.post('/campaign/modify', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var idCampaign = req.body.idCampaign;


		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.campaign.modCampaign(idCampaign,dataUrl,startDate,endDate,reward,cred)
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/fund', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var token = req.body.ERC20token;
		var amount = req.body.amount;


		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.fundCampaign(idCampaign,token,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/price/ratio', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var likeRatio = req.body.likeRatio;
		var shareRatio = req.body.shareRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.priceRatioCampaign(idCampaign,typeSN,likeRatio,shareRatio,viewRatio,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});



	/*app.post('/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.campaign.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});*/

	/**
	 * Check if the link already exists
	 */
	app.get('/campaign/checklink/:typeSN/:idPost/:idUser', async function(req, response) {

		let typeSN = req.params.typeSN;
		let idPost = req.params.idPost;
		let idUser = req.params.idUser ? req.params.idUser:"";

		try {
			let links = await app.db.apply().find({typeSN:typeSN, idPost:idPost, idUser:idUser}).toArray();
			if (!links.length) {
				response.end('{"exist":false}');
			} else {
				response.end('{"exist":true}');
			}
		} catch (err) {
			response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
		}
	});

	app.post('/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		var ctr = await app.campaign.getCampaignContract(idCampaign);

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			/*if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				var applyLink = {idCampaign:idCampaign,influencer:cred.address,typeSN:typeSN,idPost:idPost,idUser:idUser,date:Date.now(),isAccepted:false};
				var ret = await app.db.apply().insertOne(applyLink);
				response.end(JSON.stringify(ret.insertedId));
			}*/
		//	else {
				var ret = await app.campaign.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
				response.end(JSON.stringify(ret));
		//	}



		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/validate', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idApply = req.body.idProm;

		var ctr = await app.campaign.getCampaignContract(idCampaign);

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet) {

				var prom = await app.db.apply().findOne({_id:app.ObjectId(idApply)});

				var ret = await app.campaign.applyAndValidateCampaign(prom.idCampaign,prom.influencer,prom.typeSN,prom.idPost,prom.idUser,cred);

				var prom = await app.db.apply().deleteOne({_id:app.ObjectId(idApply)});

			}
			else {
				var ret = await app.campaign.validateProm(idApply,cred)

			}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/start', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.startCampaign(idCampaign,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});
	/*app.post('/campaign/validate', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;
		var accepted = req.body.accepted;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.validateProm(idProm,cred)
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});*/


	app.post('/campaign/end', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.endCampaign(idCampaign,cred)
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/gains', async function(req, response) {

		var pass = req.body.pass;
		var idProm = req.body.idProm;

		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth( req.body.token);
			var cred2 = await app.account.unlock(res.id,pass);

			var gasPrice = await app.web3.eth.getGasPrice();
			app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			var prom = await app.campaign.contract.methods.proms(idProm).call();
			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			console.log(prevstat);

			requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
			var cred = {address: app.config.campaignOwner};
			if(!requests.length)
			{




				if(prevstat.length &&( stats.likes < prevstat[0].likes || stats.shares < prevstat[0].shares || stats.views < prevstat[0].views))
				{

				 // pas d'oracle BUG
				}
				else if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{

					var evts = await app.campaign.updateCampaignStats(prom.idCampaign,cred);
					for(var i=0;evts.events[i];i++)
					{

						var evt = evts.events[i];
						if(evt.raw.topics[0] == "0xb67322f1a9b0ad182e2b242673f8283103dcd6d1c8a19b47ff5524f89d9758ed")
						{
							var idRequest = evt.raw.topics[1];
							var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
							if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
								requests = [{id:idRequest}];
						}
					}

					//requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:app.campaign.contract.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/gains2', async function(req, response) {

		var pass = req.body.pass;
		var idProm = req.body.idProm;

		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth( req.body.token);
			var cred2 = await app.account.unlock(res.id,pass);
			var ctr = await app.campaign.getPromContract(idProm);

		  var gasPrice = await ctr.getGasPrice();
			var prom = await ctr.methods.proms(idProm).call();

			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			console.log(prevstat);

			requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
			var cred = {address: app.config.campaignOwner};
			if(!requests.length)
			{

				if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{
					  var evts = await app.campaign.updatePromStats(idProm,cred2);
						var evt = evts.events[0];
						var idRequest = evt.raw.topics[1];
						var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
						if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
							requests = [{id:idRequest}];
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:ctr.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/remaining', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.getRemainingFunds(idCampaign,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/tag', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var campaign = await app.campaign.contract.methods.campaigns(idCampaign).call();
			var proms = await app.campaign.contract.methods.getProms(idCampaign).call();
			var isAdmin = false;
			var found = false;
			if(res.id == 1023)
			{
				isAdmin = true;
			}
			if(!isAdmin && campaign.advertiser != cred.address)
			{
				response.end('{error:"Unauthorized"}');
				return;
			}
			for(var i=0;i<proms.length;i++)
			{
				if(proms[i] == idProm)
					found = true;
			}
			if(!found)
			{
				response.end('{error:"Unknown prom"}');
				return;
			}
			await app.db.ban().insertOne({idCampaign:idCampaign,idProm:idProm,date:Date.now(),admin:isAdmin});
			response.end('{"idProm":"'+idProm+'"}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/untag', async function(req, response) {
		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var campaign = await app.campaign.contract.methods.campaigns(idCampaign).call();
			var proms = await app.campaign.contract.methods.getProms(idCampaign).call();
			var isAdmin = false;
			var found = false;
			if(res.id == 1023)
			{
				isAdmin = true;
			}
			if(!isAdmin && campaign.advertiser != cred.address)
			{
				response.end('{error:"Unauthorized"}');
				return;
			}
			for(var i=0;i<proms.length;i++)
			{
				if(proms[i] == idProm)
					found = true;
			}
			if(!found)
			{
				response.end('{error:"Unknown prom"}');
				return;
			}
			await app.db.ban().deleteOne({idProm:idProm});
			response.end('{idProm:"'+idProm+'"}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/token/approve', async function(req, response) {

		var pass = req.body.pass;
		var spender = req.body.spender;
		var allowance = new BN("100000000000000000000000000000");

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.token.approve(cred.address,spender,app.web3.utils.toHex(allowance));
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.get('/token/allowance/:addr/:spender', async function(req, response) {

		var addr = req.params.addr;
		var spender = req.params.spender;
		var ret = await app.token.getApproval(addr,spender)
		response.end(JSON.stringify(ret));
	});



	app.post('/campaign/estimate/create/youtube', async function(req, response) {


		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var likeRatio = req.body.likeRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateCreateCampaignYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,cred);
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});

	app.post('/campaign/estimate/fund', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var token = req.body.ERC20token;
		var amount = req.body.amount;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateFundCampaign(idCampaign,token,amount,cred);
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/apply', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateApplyCampaign(idCampaign,typeSN,idPost,idUser,cred)
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/validate', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;
		var accepted = req.body.accepted;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateValidateProm(idProm,cred)
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/gains', async function(req, response) {


		var idProm = req.body.idProm;
		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateGetGains(idProm,cred2);
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/remaining', async function(req, response) {


		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateGetRemainingFunds(idCampaign,cred);
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/token/estimate/approve', async function(req, response) {


		var spender = req.body.spender;
		var allowance = new BN("100000000000000000000000000000");

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.token.estimateApprove(cred.address,spender,app.web3.utils.toHex(allowance));
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	return app;

}
