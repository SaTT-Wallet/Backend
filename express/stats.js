module.exports = function (app) {

	app.get('/campaign/id/:id', async function(req, response) {


		var idCampaign = req.params.id;

		if(app.campaign.isCentral(idCampaign)) {
			var campaign = await app.statcentral.campaignById(idCampaign);
			response.end(JSON.stringify(campaign));
			return;
		}

		var ctr = await app.campaign.getCampaignContract(idCampaign);

		var result = await ctr.methods.campaigns(idCampaign).call();


		var ratios = await ctr.methods.getRatios(idCampaign).call();
		var cmpMetas = await app.db.campaignCrm().find({hash:idCampaign.toLowerCase()}).toArray();
		var types = ratios[0];
		var likes = ratios[1];
		var shares = ratios[2];
		var views = ratios[3];
		var res = [{typeSN:types[0],likeRatio:likes[0],shareRatio:shares[0],viewRatio:views[0]},{typeSN:types[1],likeRatio:likes[1],shareRatio:shares[1],viewRatio:views[1]},{typeSN:types[2],likeRatio:likes[2],shareRatio:shares[2],viewRatio:views[2]},{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}];
		result.ratios = res;
		result.meta = cmpMetas[0];

		var idproms = await ctr.methods.getProms(idCampaign).call();
		var proms = [];

		var newproms = await app.db.apply().find({idCampaign:idCampaign}).toArray();


		if(idproms.length || newproms.length) {
			var addresses = [];
			var ids = [];
			var idByAddress = [];
			var userById = [];

			for (var i =0;i<idproms.length;i++)
			{
				var prom = await ctr.methods.proms(idproms[i]).call();
				var count = await app.db.ban().find({idProm:idproms[i]}).count();
				prom.id = idproms[i];
				prom.pause = count;
				proms.push(prom);
				if(-1==addresses.indexOf(prom.influencer))
					addresses.push(prom.influencer.slice(2).toLowerCase());
			}
			//

			for (var i =0;i<newproms.length;i++)
			{
				var newprom = newproms[i];
				newprom.id = newprom._id;
				proms.push(newprom);
				if(-1==addresses.indexOf(newprom.influencer))
					addresses.push(newprom.influencer.slice(2).toLowerCase());
			}
			//
			result.proms = proms;

			var wallets = await app.db.wallet().find({"keystore.address": { $in: addresses } }).toArray();
			for (var i =0;i<wallets.length;i++)
			{
				idByAddress["0x"+wallets[i].keystore.address] ="id#"+wallets[i].UserId;
				if(-1==ids.indexOf(wallets[i].UserId))
					ids.push(wallets[i].UserId);
			}
			var users = await app.db.user().find({_id: { $in: ids } }).toArray();
			for (var i =0;i<users.length;i++)
			{
				delete(users[i].accessToken)
				userById["id#"+users[i]._id] = users[i];
			}
			for (var i =0;i<result.proms.length;i++)
			{
				result.proms[i].meta = userById[idByAddress[result.proms[i].influencer.toLowerCase()]];
			}

		}

		var campaignsCrm = await app.db.campaignCrm().find({hash:idCampaign}).toArray();
		if(campaignsCrm.length)
			result.meta = campaignsCrm[0];

		response.end(JSON.stringify(result));

	});

	app.get('/campaign/all/:influencer', async function(req, response) {
		var address = req.params.influencer;

		var campaigns = [];
		campaigns = await app.db.campaign().find({contract:{$ne : "central"}}).toArray();

		var campaignsCrm = [];
		var campaignsCrmbyId = [];
		campaignsCrm = await app.db.campaignCrm().find().toArray();

		for (var i = 0;i<campaignsCrm.length;i++)
		{
			if(campaignsCrm[i].hash)
				campaignsCrmbyId[campaignsCrm[i].hash] = campaignsCrm[i];
		}

		for (var i = 0;i<campaigns.length;i++)
		{
			var ctr = await app.campaign.getCampaignContract(campaigns[i].id);
			var result = await ctr.methods.campaigns(campaigns[i].id).call();
			campaigns[i].funds =  result.funds;
			campaigns[i].nbProms =  result.nbProms;
			campaigns[i].nbValidProms =  result.nbValidProms;
			campaigns[i].startDate = result.startDate;
			campaigns[i].endDate = result.endDate;

			var ratios = await ctr.methods.getRatios(campaigns[i].id).call();

			var types = ratios[0];
			var likes = ratios[1];
			var shares = ratios[2];
			var views = ratios[3];
			var res = [
				{typeSN:types[0],likeRatio:likes[0],shareRatio:shares[0],viewRatio:views[0]},
				{typeSN:types[1],likeRatio:likes[1],shareRatio:shares[1],viewRatio:views[1]},
				{typeSN:types[2],likeRatio:likes[2],shareRatio:shares[2],viewRatio:views[2]},
				{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}];
			campaigns[i].ratios = res;

			var idproms = await ctr.methods.getProms(campaigns[i].id).call();
			campaigns[i].proms =[];
			for (var j =0;j<idproms.length;j++)
			{
				var prom = await ctr.methods.proms(idproms[j]).call();
				prom.id = idproms[j];
				if(prom.influencer.toLowerCase() == address.toLowerCase())
					campaigns[i].proms.push(prom);
			}

			if(campaignsCrmbyId[campaigns[i].id])
			{
				campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
			}
		}
		var campaignscentral = await app.statcentral.campaignById(address);
		campaigns = campaigns.concat(campaignscentral);

		response.end(JSON.stringify(campaigns));
	});

	app.get('/campaign/owner/:owner', async function(req, response) {
		var owner = req.params.owner;
		var campaigns = [];
		campaigns = await app.db.campaign().find({contract:{$ne : "central"},owner:owner}).toArray();
		var campaignsCrm = [];
		var campaignsCrmbyId = [];
		campaignsCrm = await app.db.campaignCrm().find().toArray();
		for (var i = 0;i<campaignsCrm.length;i++)
		{
			if(campaignsCrm[i].hash)
				campaignsCrmbyId[campaignsCrm[i].hash] = campaignsCrm[i];
		}
		for (var i = 0;i<campaigns.length;i++)
		{
			if(campaignsCrmbyId[campaigns[i].id])
			{
				campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
			}



			var ctraddr = await app.campaign.getCampaignContract(campaigns[i].id);
			var ctr = await app.campaign.getContract(ctraddr);
			var result = await ctr.methods.campaigns(campaigns[i].id).call();
			campaigns[i].funds =  result.funds;
			campaigns[i].nbProms =  result.nbProms;
			campaigns[i].nbValidProms =  result.nbValidProms;
			campaigns[i].startDate = result.startDate;
			campaigns[i].endDate = result.endDate;

			var ratios = await ctr.methods.getRatios(campaigns[i].id).call();
			var types = ratios[0];
			var likes = ratios[1];
			var shares = ratios[2];
			var views = ratios[3];
			var res = [
				{typeSN:types[0],likeRatio:likes[0],shareRatio:shares[0],viewRatio:views[0]},
				{typeSN:types[1],likeRatio:likes[1],shareRatio:shares[1],viewRatio:views[1]},
				{typeSN:types[2],likeRatio:likes[2],shareRatio:shares[2],viewRatio:views[2]},
				{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}];
			campaigns[i].ratios = res;
		}
		var campaignscentral = await app.statcentral.campaignsByOwner(owner);
		campaigns = campaigns.concat(campaignscentral);

		response.end(JSON.stringify(campaigns));
	});

	app.get('/campaign/draft/:token', async function(req, response) {
		var res = await app.crm.auth( req.params.token);
		console.log("0"+res.id);
		var campaigns = await app.db.campaignCrm().find({idNode:"0"+res.id,hash:{ $exists: false}}).toArray();
		response.end(JSON.stringify(campaigns));
	})

	app.get('/proms/owner/:owner', async function(req, response) {
		var owner = req.params.owner;
		var proms = [];
		proms = await app.db.event().find({type : "applied",owner:owner}).toArray();
		var promscentral = await app.statcentral.promsByOwner(owner);
		proms = proms.concat(promscentral);
		response.end(JSON.stringify(proms));
	});

	app.get('/campaign/:id/proms', async function(req, response) {

		var idCampaign = req.params.id;

		if(app.campaign.isCentral(idCampaign)) {
			var proms = await app.statcentral.promsByCampaign(idCampaign);
			response.end(JSON.stringify(proms));
			return;
		}

		var ctr = await app.campaign.getCampaignContract(idCampaign);
		ctr.methods.getProms(idCampaign).call().then(function (results) {
			response.end(JSON.stringify(results));
		});
	})

	app.get('/campaign/:id/ratios', async function(req, response) {

		var idCampaign = req.params.id;


		var ctr = await app.campaign.getCampaignContract(idCampaign);

		ctr.methods.getRatios(idCampaign).call().then(function (results) {
			var types = results[0];
			var likes = results[1];
			var shares = results[2];
			var views = results[3];
		   var res = [
				{typeSN:types[0],likeRatio:likes[0],shareRatio:shares[0],viewRatio:views[0]},
				{typeSN:types[1],likeRatio:likes[1],shareRatio:shares[1],viewRatio:views[1]},
				{typeSN:types[2],likeRatio:likes[2],shareRatio:shares[2],viewRatio:views[2]},
				{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}];
			response.end(JSON.stringify(res));
		});
	})



	app.get('/campaign/:id/funds', async function(req, response) {
		var idCampaign = req.params.id;
		var ctr = await app.campaign.getCampaignContract(idCampaign);

		ctr.methods.campaigns(idCampaign).call().then(function (results) {
			response.end(JSON.stringify(results.funds));
		});
	})

	app.get('/campaign/:id/status',async  function(req, response) {

		var idCampaign = req.params.id;
		var ctr = await app.campaign.getCampaignContract(idCampaign);

		ctr.methods.campaigns(idCampaign).call().then(function (results) {
			response.end(JSON.stringify(results));
		});
	})

	app.get('/campaign/:id/events', function(req, response) {
		var idCampaign = req.params.id;
		app.db.event().find({id:idCampaign}).toArray(function(err,evts){
			response.end(JSON.stringify(evts));
		})
	})

	app.get('/prom/:id/status',async function(req, response) {
		var idProm = req.params.id;
		var ctra = await app.campaign.getPromContract(idProm);

		ctr.methods.proms(idProm).call().then(function (results) {
			delete(results.results)
			response.end(JSON.stringify(results));
		});
	})

	app.get('/prom/:id/results',async  function(req, response) {
		var idProm = req.params.id;

		var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
		if(prom)
		{
			var res = await app.statcentral.resultsByProm(idProm);
			response.end(JSON.stringify(res));
			return;
		}

		var ctr = await app.campaign.getPromContract(idProm);

		ctr.methods.getResults(idProm).call().then(function (results) {
			app.db.request().find({"id":{$in:results},"views":{ $exists: true}}).toArray(function(err,res2){
				response.end(JSON.stringify(res2));
			})
		});
	})

	app.get('/prom/:id/live', async function(req, response) {
		var idProm = req.params.id;

		var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
		if(prom)
		{
			var res = await app.statcentral.resultsByPromLive(idProm);
			response.end(JSON.stringify(res));
			return;
		}

		var ctr = await app.campaign.getPromContract(idProm);

		ctr.methods.proms(idProm).call().then( async function (results) {
			results.typeSN = results.typeSN.toString();
			switch(results.typeSN) {
				case "1" :
					var res = await app.oracle.facebook(results.idUser,results.idPost);

				break;
				case "2" :
					var res = await app.oracle.youtube(results.idPost);

				break;
				case "3" :
					var res = await app.oracle.instagram(results.idPost)

				break;
				case "4" :
					var res = await app.oracle.twitter(results.idUser,results.idPost)

				break;
				default :
					var res = {likes:0,shares:0,views:0,date:Date.now()};
				break;
			}

			response.end(JSON.stringify(res));
			/*app.db.cache().find({"typeSN":results.typeSN,"idPost":results.idPost,"idUser":results.idUser}).toArray(function(err,res2){
				response.end(JSON.stringify(res2[0]));
			})*/
		});

	})

	app.get('/results/:id', function(req, response) {
		var idRequest = req.params.id;
		app.campaign.contract.methods.results(idRequest).call().then(function (results) {
			response.end(JSON.stringify(results));
		});
	})

	app.get('/isalreadysed/:type/:idpost/:iduser', function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		var idUser = req.params.iduser;
		var res = await app.statcentral.isUsed(type,idPost,idUser)
		app.campaign.contract.methods.getIsUsed(type,idPost,idUser).call().then(function (results) {
			console.log("already",type,idpost,results);
			response.end(res || results);
		});
	})
	app.get('/isalreadysed/:type/:idpost', function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		var res = await app.statcentral.isUsed(type,idPost)
		app.campaign.contract.methods.getIsUsed(type,idPost,'').call().then(function (results) {
			console.log("already",type,idpost,results);
			response.end(res || results);
		});

	})

	return app;

}
