const { VirtualConsole } = require('jsdom');

module.exports = function (app) {

const cron =require('node-cron');
const Big = require('big.js');

const allEqual = arr => arr.every( v => v === "0" )

cron.schedule('00 01 * * *',  () => {
	app.account.BalanceUsersStats("daily");
});

cron.schedule("* * 1 * *", () =>{
 app.account.BalanceUsersStats("monthly");
});

cron.schedule("03 04 * * 1", () =>{
 app.account.BalanceUsersStats("weekly");
});


	app.get('/campaign/id/:id', async function(req, response) {


		var idCampaign = req.params.id;
		/*var isCentral = await app.campaign.isCentral(idCampaign);
		if(isCentral) {

			var campaign = await app.statcentral.campaignById(idCampaign);
			response.end(JSON.stringify(campaign));
			return;
		}*/

		var ctr = await app.campaign.getCampaignContract(idCampaign);

	 if(!ctr.methods) {
		 response.end("{}");
		 return;
	 }

		var result = await ctr.methods.campaigns(idCampaign).call();


		var ratios = await ctr.methods.getRatios(idCampaign).call();
		var cmpMetas = await app.db.campaignCrm().find({hash:idCampaign.toLowerCase()}).toArray();


		var types = ratios[0];
		var likes = ratios[1];
		var shares = ratios[2];
		var views = ratios[3];

        let res = [];
		let cmpRatio = cmpMetas[0].ratios
		let counter = 0;
        while(counter < cmpRatio.length){
			let arr = Object.values(cmpRatio[counter])
			arr.shift()
			if(!allEqual(arr)){
				res.push({typeSN:types[counter],likeRatio:likes[counter],shareRatio:shares[counter],viewRatio:views[counter]})
			}
			counter++;
		}


		//var res = [{typeSN:types[0],likeRatio:likes[0],shareRatio:shares[0],viewRatio:views[0]},{typeSN:types[1],likeRatio:likes[1],shareRatio:shares[1],viewRatio:views[1]},{typeSN:types[2],likeRatio:likes[2],shareRatio:shares[2],viewRatio:views[2]},{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}];
		result.ratios = res;
		result.meta = cmpMetas[0];

		var idproms = await ctr.methods.getProms(idCampaign).call();
		var proms = [];

		var newproms = await app.db.apply().find({idCampaign:idCampaign}).toArray();
        let rejectedProms = await app.db.campaign_link().find({$and: [ { id_campaign:idCampaign },{status : "rejected"}]}).toArray();
   
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
           
			if(rejectedProms.length){
				rejectedProms.forEach(element => {
				proms.forEach(prom=>{
				   if(element.id_prom === prom.id){
					 prom.isAccepted = "rejected"
				   }
				})
			})
			}
			

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

		if(result.meta && result.meta.token.name == "SATTBEP20") {
			result.meta.token.name ="SATT";
		}

		response.end(JSON.stringify(result));

	});

	app.get('/campaign/all/:influencer', async function(req, response) {
		var address = req.params.influencer;

		var campaigns = [];
		var rescampaigns = [];
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
			if(!ctr.methods)
			{
				continue;
			}
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
				{typeSN:types[3],likeRatio:likes[3],shareRatio:shares[3],viewRatio:views[3]}
			    ];
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
				if(campaigns[i].meta.token.name == "SATTBEP20") {
					campaigns[i].meta.token.name ="SATT";
				}
			}
			rescampaigns.push(campaigns[i]);
		}
		//var campaignscentral = await app.statcentral.campaignsByInfluencer(address);

		//rescampaigns = rescampaigns.concat(campaignscentral);

		let Ended_c=0
		let Pending_c=0

		var unowned = [...rescampaigns].filter((campaign) => address.toLowerCase() !== campaign.owner.toLowerCase())

		for(var c=0;c<unowned.length;c++){

			let endDate = new Date(+unowned[c].endDate * 1000);
		     let startDate = new Date(+unowned[c].startDate * 1000)

			  if (
				Date.now() >= startDate.getTime() &&
				Date.now() <= endDate.getTime()
			  ) {
				Pending_c++
			  } else if (Date.now() > endDate.getTime()) {
				Ended_c++
			  }
		}

		response.end(JSON.stringify({allCampaign:unowned,ended:Ended_c,pending:Pending_c}));
	})

	app.get('/campaign/owner/:owner', async function(req, response) {
		var owner = req.params.owner;
		var campaigns = [];
		var rescampaigns = [];
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
			var ctr = await app.campaign.getCampaignContract(campaigns[i].id);
			if(!ctr.methods)
			{
				continue;
			}

			if(campaignsCrmbyId[campaigns[i].id])
			{
				campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
				if(campaigns[i].meta.token.name == "SATTBEP20") {
					campaigns[i].meta.token.name ="SATT";
				}
			}
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
			//	if(prom.influencer.toLowerCase() == owner.toLowerCase())
				//	campaigns[i].proms.push(prom);
			}

			rescampaigns.push(campaigns[i]);
		}
		//var campaignscentral = await app.statcentral.campaignsByOwner(owner);
		//rescampaigns = rescampaigns.concat(campaignscentral);


		response.end(JSON.stringify(rescampaigns));
	});

      /*
     @Url :/campaigns/list/:token/addr:?page[number]'
     @description: fetch drafts and created campaign
	 @query: Page number
     @parameters :
     addr : wallet address of user
     token : access token
     @response : object of arrays => draft and created campaigns
     */

	app.get('/campaigns/list/:token/:addr', async function(req, response) {
		try{
			var owner = req.params.addr;
			var access_token=req.params.token
			var campaigns = [];
			var rescampaigns = [];


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
				var ctr = await app.campaign.getCampaignContract(campaigns[i].id);
				if(!ctr.methods)
				{
					continue;
				}

				if(campaignsCrmbyId[campaigns[i].id])
				{
					campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
					if(campaigns[i].meta.token.name == "SATTBEP20") {
						campaigns[i].meta.token.name ="SATT";
					}
				}

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
					if(prom.influencer.toLowerCase() == owner.toLowerCase())
						campaigns[i].proms.push(prom);
				}

				rescampaigns.push(campaigns[i]);
			}
		//	var campaignscentral = await app.statcentral.campaignsByOwner(owner);
	    //    let created_campaigns=rescampaigns.concat(campaignscentral)
			let auth = await app.crm.auth(access_token);
			let draft_campaigns = await app.db.campaignCrm().find({idNode:"0"+auth.id,hash:{ $exists: false}}).toArray();
            draft_campaigns=draft_campaigns.map((c)=>{
				return {...c,stat:'draft'}
			})

            let campaigns_=[...rescampaigns,...draft_campaigns];
			response.end(JSON.stringify(campaigns_));

		}catch(err){
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})



	app.get('/campaigns/list/:addr', async function(req, response) {
		try{
			let token = req.headers["authorization"].split(" ")[1];
           let auth =  await app.crm.auth(token);
			var owner = req.params.addr;
			var access_token= token
			var campaigns = [];
            let rescampaigns = [];
			
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
				var ctr = await app.campaign.getCampaignContract(campaigns[i].id);
				if(!ctr.methods)
				{
					continue;
				}

				if(campaignsCrmbyId[campaigns[i].id])
				{
					campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
					if(campaigns[i].meta.token.name == "SATTBEP20") {
						campaigns[i].meta.token.name ="SATT";
					}
				}

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
					if(prom.influencer.toLowerCase() == owner.toLowerCase())
						campaigns[i].proms.push(prom);
				}

				rescampaigns.push(campaigns[i]);
			}
	
			let draft_campaigns = await app.db.campaignCrm().find({idNode:"0"+auth.id,hash:{ $exists: false}}).toArray();
            draft_campaigns=draft_campaigns.map((c)=>{
				return {...c,stat:'draft'}
			})

            let Campaigns_=[...rescampaigns,...draft_campaigns]
			response.end(JSON.stringify(Campaigns_));

		}catch(err){
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})


	app.get('/proms/owner/:owner', async function(req, response) {
		var owner = req.params.owner;
		var proms = [];
		proms = await app.db.event().find({type : "applied",owner:owner}).toArray();
		//var promscentral = await app.statcentral.promsByOwner(owner);
		//proms = proms.concat(promscentral);
		response.end(JSON.stringify(proms));
	});

	app.get('/campaign/draft/:token', async function(req, response) {
		var res = await app.crm.auth( req.params.token);
		var campaigns = await app.db.campaignCrm().find({idNode:"0"+res.id,hash:{ $exists: false}}).toArray();
		response.end(JSON.stringify(campaigns));
	})

/*
	@url : campaign/OneDraft/:id
	@description: get One draft for user
	@params:
    id : draft id
	{headers}
	@Output JSON object
	*/
	app.get('/campaign/OneDraft/:id', async (req,res)=>{
		try {
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const idNode="0"+auth.id;
		const campaign = await app.db.campaignCrm().findOne({_id: app.ObjectId(req.params.id),idNode:idNode,hash:{ $exists: false}});
		res.end(JSON.stringify(campaign));
	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	})

	app.get('/campaign/:id/proms', async function(req, response) {

		var idCampaign = req.params.id;

		/*if(app.campaign.isCentral(idCampaign)) {
			var proms = await app.statcentral.promsByCampaign(idCampaign);
			response.end(JSON.stringify(proms));
			return;
		}*/

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
		var ctr = await app.campaign.getPromContract(idProm);

		ctr.methods.proms(idProm).call().then(function (results) {
			delete(results.results)
			response.end(JSON.stringify(results));
		});
	})

	app.get('/prom/:id/results',async  function(req, response) {
		var idProm = req.params.id;


		/*if(idProm.substring(0,2) != "0x")
		{
			var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
			var res = await app.statcentral.resultsByProm(idProm);
			response.end(JSON.stringify(res));
			return;
		}*/

		var ctr = await app.campaign.getPromContract(idProm);


		var res2 = [];
		var results = await ctr.methods.getResults(idProm).call();
			for(var i = 0;i<results.length;i++) {
				var r = await ctr.methods.results(results[i]).call();
				res2.push(r);
			}
			response.end(JSON.stringify(res2));
	})

	app.get('/prom/:id/live', async function(req, response) {
		var idProm = req.params.id;


	/*if(idProm.substring(0,2) != "0x")
		{
			var prom = await app.db.apply().findOne({_id:app.ObjectId(idProm)})
			var res = await app.statcentral.resultsByPromLive(idProm);
			response.end(JSON.stringify(res));
			return;
		}*/

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

	app.get('/isalreadysed/:type/:idpost/:iduser', async function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		var idUser = req.params.iduser;
	//	var res = await app.statcentral.isUsed(type,idPost,idUser)
		app.campaign.contract.methods.getIsUsed(type,idPost,idUser).call().then(function (results) {
			console.log("already",type,idpost,results);
			response.end( results);
		});
	})
	app.get('/isalreadysed/:type/:idpost', async function(req, response) {
		var type = req.params.type;
		var idPost = req.params.idpost;
		//var res = await app.statcentral.isUsed(type,idPost)
		app.campaign.contract.methods.getIsUsed(type,idPost,'').call().then(function (results) {
			console.log("already",type,idpost,results);
			response.end( results);
		});

	})


	  /*
     @Url :API (link) /balance/stats'
     @description: fetch user chart stats
	 @parameters : header access token
     @response : object of arrays => different balance stats (daily, weekly, monthly)
     */
	app.get("/balance/stats", async (req, res) => {
		try {
			let token = req.headers["authorization"].split(" ")[1];
			let auth =  await app.crm.auth(token);
			const id = +auth.id;
			let result={};
			let user = await app.db.sn_user().findOne({_id : id});
			if(user.daily && user.daily.length > 0){result.daily = user.daily}
			if(user.weekly && user.weekly.length >0){result.weekly = user.weekly;}
			if(user.monthly && user.monthly.length >0){result.monthly = user.monthly;}
            res.end(JSON.stringify(result));
		}catch(err){
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})


	app.get('/script/balance/:condition', async (req, res) => {
        try{
		let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
		if([app.config.idNodeAdmin1, app.config.idNodeAdmin2].includes(auth.id)){
			let condition = req.params.condition
		    await  app.account.BalanceUsersStats(condition);
			res.send(JSON.stringify({message : 'runned'}))
		}
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		 }
	   })


	 app.get('/campaign/statistics/:idCampaign', async (req, res)=>{
		try{
	    const idCampaign = req.params.idCampaign
		const result = await app.campaign.campaignStats(idCampaign)
     res.end(JSON.stringify(result))
		}catch (err) {
		 res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	  }
	})

   app.get('/prom/stats/:idProm', async (req, res) => {
	try{

	   let total;
	   const idProm = req.params.idProm;
	   const info =  await app.db.campaign_link().findOne({ id_prom : idProm });
	   const payedAmount = info.payedAmount || "not payed yet";
	   const unPayed = info.fund;
	   const campaign = await app.db.campaignCrm().findOne({hash : info.id_campaign});
       const ratio = campaign.ratios
	   ratio.forEach(elem =>{
		   if(elem.oracle === info.oracle){
           let view =new Big(elem["view"]).times(info.view)
		   let like =  new Big(elem["like"]).times(info.like)
		   let share = new Big(elem["share"]).times(info.share)
		   total = view.plus(like).plus(share).toFixed()
		   }
	   })
       
	   res.end(JSON.stringify({total, payedAmount,unPayed}))
	}catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	 }
   })
    
   
	return app;

}
