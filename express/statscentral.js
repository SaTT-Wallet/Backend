module.exports = function (app) {

	app.get('/campaign/id/:id', async function(req, response) {
		var idCampaign = req.params.id;

		var result = await app.db.campaign().findOne({id : idCampaign});
		var ratios = result.ratios;

		var res = [
			{typeSN:"1",likeRatio:ratios[0],shareRatio:ratios[1],viewRatio:ratios[2]},
			{typeSN:"2",likeRatio:ratios[3],shareRatio:ratios[4],viewRatio:ratios[5]},
			{typeSN:"3",likeRatio:ratios[6],shareRatio:ratios[7],viewRatio:ratios[8]},
			{typeSN:"4",likeRatio:ratios[9],shareRatio:ratios[10],viewRatio:ratios[11]}
		];
		result.ratios = res;
		result.advertiser = result.owner;
		result.funds =  [result.token,result.amount]

		var proms = [];
		var newproms = await app.db.apply().find({idCampaign:idCampaign}).toArray();

		if(newproms.length) {
			var addresses = [];
			var ids = [];
			var idByAddress = [];
			var userById = [];

			for (var i =0;i<newproms.length;i++)
			{
				var newprom = newproms[i];
				newprom.id = newprom._id;
				var count = await app.db.ban().find({idProm:newprom.id}).count();
				newprom.pause = count;

				newprom.funds = [result.token,(newprom.totalGains-newprom.paidGains)]
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

		var campaignsCrm = await app.db.campaignCrm().find({hash:idCampaign.toLowerCase()}).toArray();
		if(campaignsCrm.length)
			result.meta = campaignsCrm[0];

		response.end(JSON.stringify(result));

	});

	app.get('/campaign/all/:influencer', async function(req, response) {
		var address = req.params.influencer;
		var campaigns = [];
		campaigns = await app.db.campaign().find({contract:"central"}).toArray();

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
			var ratios = campaigns[i].ratios;
			var res = [
				{typeSN:"1",likeRatio:ratios[0],shareRatio:ratios[1],viewRatio:ratios[2]},
				{typeSN:"2",likeRatio:ratios[3],shareRatio:ratios[4],viewRatio:ratios[5]},
				{typeSN:"3",likeRatio:ratios[6],shareRatio:ratios[7],viewRatio:ratios[8]},
				{typeSN:"4",likeRatio:ratios[9],shareRatio:ratios[10],viewRatio:ratios[11]}
			];
			campaigns[i].ratios = res;

			campaigns[i].funds =  [campaigns[i].token,campaigns[i].amount]

			var proms = await app.db.apply().find({idCampaign:campaigns[i].id}).toArray();


			campaigns[i].proms =[];
			for (var j =0;j<proms.length;j++)
			{
				var prom = proms[j];
				prom.funds = [campaigns[i].token,(prom.totalGains-prom.paidGains)]
				if(prom.influencer.toLowerCase() == address.toLowerCase())
					campaigns[i].proms.push(prom);
			}

			if(campaignsCrmbyId[campaigns[i].id])
			{
				campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
			}
		}

		response.end(JSON.stringify(campaigns));
	});

	app.get('/campaign/owner/:owner', async function(req, response) {
		var owner = req.params.owner;
		var campaigns = [];
		campaigns = await app.db.campaign().find({contract:"central",owner:owner}).toArray();
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

			campaigns[i].funds =  [campaigns[i].token,campaigns[i].amount]


			var ratios = campaigns[i].ratios;
			var res = [
				{typeSN:"1",likeRatio:ratios[0],shareRatio:ratios[1],viewRatio:ratios[2]},
				{typeSN:"2",likeRatio:ratios[3],shareRatio:ratios[4],viewRatio:ratios[5]},
				{typeSN:"3",likeRatio:ratios[6],shareRatio:ratios[7],viewRatio:ratios[8]},
				{typeSN:"4",likeRatio:ratios[9],shareRatio:ratios[10],viewRatio:ratios[11]}
			];
			campaigns[i].ratios = res;
		}
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
		proms = await app.db.apply().find({influencer:owner}).toArray();
		response.end(JSON.stringify(proms));
	});

	app.get('/campaign/:id/proms', async function(req, response) {

		var idCampaign = req.params.id;
		var proms = [];
		proms = await app.db.apply().find({idCampaign:idCampaign}).toArray();
		response.end(JSON.stringify(proms));
	})



	app.get('/prom/:id/results',async  function(req, response) {
		var idProm = req.params.id;
		var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
		prom.typeSN = prom.typeSN.toString();
		/*switch(prom.typeSN) {
			case "1" :
				var res = await app.oracle.facebook(prom.idUser,prom.idPost);

			break;
			case "2" :
				var res = await app.oracle.youtube(prom.idPost);

			break;
			case "3" :
				var res = await app.oracle.instagram(prom.idPost)

			break;
			case "4" :
				var res = await app.oracle.twitter(prom.idUser,prom.idPost)

			break;
			default :
				var res = {likes:0,shares:0,views:0,date:Date.now()};
			break;
		}*/
		//response.end(JSON.stringify([{likes:res.likes,shares:res.shares,views:res.views}]));
		response.end(JSON.stringify([{likes:prom.likes,shares:prom.shares,views:prom.views}]));
	})

	app.get('/prom/:id/live', async function(req, response) {
		var idProm = req.params.id;
		var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
			prom.typeSN = prom.typeSN.toString();
			switch(prom.typeSN) {
				case "1" :
					var res = await app.oracle.facebook(prom.idUser,prom.idPost);

				break;
				case "2" :
					var res = await app.oracle.youtube(prom.idPost);

				break;
				case "3" :
					var res = await app.oracle.instagram(prom.idPost)

				break;
				case "4" :
					var res = await app.oracle.twitter(prom.idUser,prom.idPost)

				break;
				default :
					var res = {likes:0,shares:0,views:0,date:Date.now()};
				break;
			}

			response.end(JSON.stringify(res));



	})



	app.get('/isalreadysed/:type/:idpost/:iduser', async function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		var idUser = req.params.iduser;
		var proms = await app.db.apply().find({typeSN:type,idPost:idPost,idUser:idUser}).toArray();
		response.end(proms.length);

	})
	app.get('/isalreadysed/:type/:idpost', async function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		var proms = await app.db.apply().find({typeSN:type,idPost:idPost}).toArray();
		response.end(proms.length);
	})

	return app;

}
