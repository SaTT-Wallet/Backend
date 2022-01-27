module.exports = function (app) {

	var fs = require('fs');

	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )

	var BN = require("bn.js");

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);



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

			var balance = await app.erc20.getBalance(token,cred.address);

			if( (new BN(balance.amount)).lt(new BN(amount)) )
			{
				response.end('{"error":"Insufficient token amount expected '+amount+' got '+balance.amount+'"}');
			}
			var ret = await app.campaignCentral.createCampaignAll(dataUrl,startDate,endDate,ratios,token,amount,cred);
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
			var ret = await app.campaignCentral.fundCampaign(idCampaign,token,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});




	app.post('/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;



		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.campaignCentral.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
			response.end(JSON.stringify(ret));


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

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaignCentral.validateProm(idApply,cred)
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

		try {

			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.campaignCentral.getGains(idProm,cred)

			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/gains/all', async function(req, response) {

		var pass = req.body.pass;

		try {

			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaignCentral.getAllGains(cred)

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
			var ret = await app.campaignCentral.getRemainingFunds(idCampaign,cred);
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
			var campaign = await app.db.campaign().findOne({id : idCampaign});
			var proms = await app.db.apply().find({idCampaign:idCampaign}).toArray();
			var isAdmin = false;
			var found = false;
			if(res.id == 1023)
			{
			 isAdmin = true;
			}
			if(!isAdmin && campaign.owner.toLowerCase() != cred.address.toLowerCase())
			{
				response.end('{error:"Unauthorized"}');
				return;
			}
			for(var i=0;i<proms.length;i++)
			{
				if(proms[i]._id == idProm)
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
			var campaign = await app.db.campaign().findOne({id : idCampaign});
			var proms = await app.db.apply().find({idCampaign:idCampaign}).toArray();
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

	return app;

}
