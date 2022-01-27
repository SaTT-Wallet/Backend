module.exports = async function (app) {

	var statsCentral = {};

  statsCentral.campaignById = async (idCampaign) => {

		var result = await app.db.campaign().findOne({id : idCampaign});
		if(!result)
		{

			return [];
		}
		if(!result.ratios)
		{

			return [];
		}
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

				var bans = await app.db.ban().find({idProm:""+newprom.id}).toArray();
				newprom.pause = bans.length;

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

			return result;

	}

	statsCentral.campaignsByInfluencer = async (address) => {

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

		return campaigns;
	}

	

 statsCentral.campaignsDraft = async (token) => {

		var res = await app.crm.auth(token);
		var campaigns = await app.db.campaignCrm().find({idNode:"0"+res.id,hash:{ $exists: false}}).toArray();
	return campaigns;
	}

statsCentral.promsByOwner = async (owner) => {
		var proms = [];
		proms = await app.db.apply().find({influencer:owner}).toArray();
		return proms;
	};

statsCentral.promsByCampaign = async (idCampaign) => {
		var proms = [];
		proms = await app.db.apply().find({idCampaign:idCampaign}).toArray();
		return proms;
	};


statsCentral.resultsByProm = async (idProm) => {

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
		return [{likes:prom.likes,shares:prom.shares,views:prom.views}];
	}

statsCentral.resultsByPromLive = async (idProm) => {

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

		return res;

	}

statsCentral.isUsed = async (type,idPost,idUser) => {


		var proms = await app.db.apply().find({typeSN:type,idPost:idPost,idUser:idUser}).toArray();
		return proms.length;

	};
	statsCentral.isUsed = async (type,idPost) => {

		var proms = await app.db.apply().find({typeSN:type,idPost:idPost}).toArray();
		return proms.length;
	};

	app.statcentral = statsCentral;

	return app;

}
