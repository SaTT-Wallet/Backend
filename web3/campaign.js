const { number } = require("bitcoinjs-lib/src/script");
const { ObjectId } = require("bson");

module.exports = async function (app) {

	var fs = require("fs");
	var child = require('child_process');
	var BN = app.web3.utils.BN;
	const Big = require('big.js');

	var campaignManager = {};


	campaignManager.getContract = (address) => {

		if(address.toLowerCase() == app.config.ctrs.campaign.address.mainnet.toLowerCase() )
			return campaignManager.contract;
		else if(address.toLowerCase() == app.config.ctrs.campaign.address.mainnetBep20.toLowerCase())
				return campaignManager.contractBep20;
		else	if(address.toLowerCase() == app.config.ctrs.campaign.address.testnet.toLowerCase() )
				return campaignManager.contract;
		else if(address.toLowerCase() == app.config.ctrs.campaign.address.testnetBep20.toLowerCase())
				return campaignManager.contractBep20;

			}

	campaignManager.getCampaignContract = async function (idCampaign) {
		var campaign = await app.db.campaigns().findOne({hash:idCampaign},{projection: { contract: true }});
		if(campaign && campaign.contract)
		{

			return campaignManager.getContract(campaign.contract);
		}
		else
			return false;
	}

	campaignManager.getPromContract = async function (idProm) {


		var proms = await app.db.event().find({prom:idProm},{projection: { contract: true, _id:false }}).toArray();
		//console.log("log",proms)
		if(proms.length) {
			return 	 campaignManager.getContract(proms[0].contract);
		}
		else {
			return false;
		}
	}

	campaignManager.getContractToken = async function (token) {

		if(token.toLowerCase() == app.config.ctrs.token.address.mainnet.toLowerCase() ||
		 token.toLowerCase() == app.config.ctrs.token.address.tetherMainnet.toLowerCase()||
		 token.toLowerCase() == app.config.ctrs.token.address.daiMainnet.toLowerCase()
		 )
			return campaignManager.contract;
		else if(token.toLowerCase() == app.config.ctrs.bep20.address.mainnet.toLowerCase() ||
		token.toLowerCase() == app.config.ctrs.bep20.address.busdMainnet.toLowerCase()
		)
				return campaignManager.contractBep20;
		else	if(token.toLowerCase() == app.config.ctrs.token.address.testnet.toLowerCase() ||
		 token.toLowerCase() == app.config.ctrs.token.address.tetherTesnet.toLowerCase() ||
		 token.toLowerCase() == app.config.ctrs.token.address.daiTesnet.toLowerCase()
		 )
				return campaignManager.contract;
		else if(token.toLowerCase() == app.config.ctrs.bep20.address.testnet.toLowerCase()||
		token.toLowerCase() == app.config.ctrs.bep20.address.busdTesnet.toLowerCase()
		)
				return campaignManager.contractBep20;

			}

		campaignManager.isCentral =  function (idCampaign) {
			/*
			var campaigns = await app.db.campaign().find({id:idCampaign}).toArray();

			if(!campaigns.length) {
				return true;
			}
				else {
			return campaigns[0].contract == "central";
		}*/
		return false;
		}

	campaignManager.followContract = function () {

		if(app.config.testnet)
		  campaignManager.contract = new app.web3.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.testnet);
		else
		  campaignManager.contract = new app.web3.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.mainnet);
		campaignManager.contract.getGasPrice = async function () {
		 var gas = await app.web3.eth.getGasPrice();
		 return gas;
		}
		if(app.config.testnet)
		{
			campaignManager.contractBep20 = new app.web3Bep20.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.testnetBep20);
			campaignManager.contractBep20WS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.testnetBep20);
		}
		else
		{
			campaignManager.contractBep20 = new app.web3Bep20.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.mainnetBep20);
			campaignManager.contractBep20WS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.mainnetBep20);
		}
		campaignManager.contractBep20.getGasPrice = async function () {
		 var gas = await app.web3Bep20.eth.getGasPrice();
		 return gas;
		}
	}

	campaignManager.createCampaign = async function (dataUrl,startDate,endDate,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 200000;
			var receipt = await campaignManager.getContract().methods.createCampaign(dataUrl,startDate,endDate).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			resolve(receipt.events.CampaignCreated.returnValues.id);
			console.log("campaign created:",receipt.events);
		})
	}

	campaignManager.createCampaignYt = async function (dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			var ctr = await campaignManager.getContractToken(token)
			var gasPrice = await ctr.getGasPrice();
			var gas = 300000;
			var receipt = await  ctr.methods.createPriceFundYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			console.log(receipt.events.CampaignCreated);
			resolve(receipt.events.CampaignCreated.returnValues.id);
		})
	}

	campaignManager.createCampaignAll = async function (dataUrl,startDate,endDate,ratios,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			var ctr = await campaignManager.getContractToken(token);
			var gasPrice = await ctr.getGasPrice();
			// var gas = 600000;
			var gas = await ctr.methods.createPriceFundAll(dataUrl,startDate,endDate,ratios,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});

			try {

					var receipt = await  ctr.methods.createPriceFundAll(dataUrl,startDate,endDate,ratios,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
					resolve({hash : receipt.events.CampaignCreated.returnValues.id, transactionHash :receipt.events.CampaignCreated.transactionHash});
                    receipt.transactionHash && app.account.sysLog("createCampaignAll", credentials.address, `${receipt.events.CampaignCreated.transactionHash} confirmed campaign ${receipt.events.CampaignCreated.returnValues.id} launched`);
			} catch (err) {

				reject(err)
			}
		})
	}

	campaignManager.createCampaignBounties = async function (dataUrl,startDate,endDate,bounties,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {

			var ctr = await campaignManager.getContractToken(token);

			var gasPrice = await ctr.getGasPrice();
			var gas = await ctr.methods.createPriceFundBounty(dataUrl,startDate,endDate,bounties,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});
			try {

					var receipt = await  ctr.methods.createPriceFundBounty(dataUrl,startDate,endDate,bounties,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
					let transactionHash = receipt.events.CampaignCreated.transactionHash
					resolve({hash : receipt.events.CampaignCreated.returnValues.id, transactionHash});
					transactionHash && app.account.sysLog("createCampaignBounties", credentials.address, `${transactionHash} confirmed campaignBounty ${receipt.events.CampaignCreated.returnValues.id} launched`);


			} catch (err) {

				reject(err)
			}

		})
	}

	campaignManager.modCampaign = async function (idCampaign,dataUrl,startDate,endDate,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 200000;
			var receipt = await campaignManager.getContract().methods.modCampaign(idCampaign,dataUrl,startDate,endDate).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			console.log(receipt.events.CampaignCreated.returnValues.id);
			resolve(receipt.events.CampaignCreated.returnValues.id);
		})
	}

	campaignManager.fundCampaign = async function (idCampaign,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var ctr = await campaignManager.getContractToken(token);
				var gasPrice = await ctr.getGasPrice();
			var gas = 200000;


			var receipt = await ctr.methods.fundCampaign(idCampaign,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});

			   resolve({transactionHash:receipt.transactionHash,idCampaign: idCampaign,token:token,amount:amount});
               receipt.transactionHash && app.account.sysLog("fundCampaign", credentials.address, `${receipt.transactionHash} confirmed campaign ${idCampaign} funded`);

			}
			catch (err)
			{
				reject(err);
			}
			
		})
	}

	campaignManager.priceRatioCampaign = async function (idCampaign,typeSN,likeRatio,shareRatio,viewRatio,credentials) {
		return new Promise(async (resolve, reject) => {
		var gas = 100000;
		var ctr = await campaignManager.getCampaignContract(idCampaign);
			var gasPrice = await ctr.getGasPrice();
			var receipt = await  ctr.methods.priceRatioCampaign(idCampaign,typeSN,likeRatio,shareRatio,viewRatio).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			   resolve({transactionHash:receipt.transactionHash,typeSN:typeSN,likeRatio:likeRatio,shareRatio:shareRatio,viewRatio:viewRatio});
			   console.log(receipt.transactionHash,"confirmed",idCampaign,"priced");
		})
	}

	campaignManager.applyCampaign = async function (idCampaign,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gas = 400000;
			var ctr = await campaignManager.getCampaignContract(idCampaign);

			//var gasPrice = 4000000000;
				var gasPrice = await ctr.getGasPrice();
            
			// var isDoubled = await ctr.methods.getIsUsed(idCampaign,typeSN,idPost,idUser).call();
			// if(isDoubled)
			// {
			// 	reject({message:"Link already sent"});
			// }
			// else {
				var receipt = await ctr.methods.applyCampaign(idCampaign,typeSN,idPost,idUser).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				       let prom = receipt.events.CampaignApplied.returnValues.prom;
					resolve({transactionHash:receipt.events.CampaignApplied.transactionHash,idCampaign: idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});
					receipt.events.CampaignApplied.transactionHash && app.account.sysLog("applyCampaign", credentials.address, `${receipt.events.CampaignApplied.transactionHash} confirmed apply prom ${idProm} ${idCampaign}`);

			
				// console.log(receipt.transactionHash,"confirmed",idCampaign," prom ",prom);
		
			}
			catch (err)
			{
				reject(err);
			}

		})
	}

	campaignManager.applyAndValidateCampaign = async function (idCampaign,influencer,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gas = 400000;
			var ctr =  await campaignManager.getCampaignContract(idCampaign);
			var gasPrice = await ctr.getGasPrice();
			//var gasPrice = 4000000000;


			//console.log(idCampaign,typeSN,idPost,idUser);
			/*var isDoubled = await ctr.methods.getIsUsed(idCampaign,typeSN,idPost,idUser).call();

			if(isDoubled)
			{
				reject({message:"Link already sent"});
			}
			else {*/
				var receipt = await ctr.methods.applyAndValidate(idCampaign,influencer,typeSN,idPost,idUser).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				var prom = receipt.events.CampaignApplied.returnValues.prom;
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});
				console.log(receipt.transactionHash,"confirmed",idCampaign," prom ",prom);
				//}
			}
			catch (err)
			{
				reject(err);
			}
		})
	}



	campaignManager.validateProm = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 100000;
					var ctr = await campaignManager.getPromContract(idProm);
					//console.log(ctr);


					var gasPrice = await ctr.getGasPrice();
				var receipt = await  ctr.methods.validateProm(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
                receipt.transactionHash && app.account.sysLog("validateProm", credentials.address, `${receipt.transactionHash} confirmed validated prom ${idProm}`);
			//	console.log(receipt.transactionHash,"confirmed validated prom ",idProm);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	campaignManager.validateProms = async function (proms,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log(proms[0])
				var ctr = await campaignManager.getPromContract(proms[0]);
				var gasPrice = await ctr.getGasPrice();
				var gas = await ctr.methods.validateProms(proms).estimateGas({from:credentials.address,gasPrice: gasPrice});
				var receipt = await  ctr.methods.validateProms(proms).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,proms:proms});
                receipt.transactionHash && app.account.sysLog("validateProm", credentials.address, `${receipt.transactionHash} confirmed validated prom ${proms}`);
				console.log(receipt.transactionHash,"confirmed validated prom ",proms);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.startCampaign = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 100000;
				var ctr =  await campaignManager.getCampaignContract(idCampaign);
				var gasPrice = await ctr.getGasPrice();
				var receipt = await  ctr.methods.startCampaign(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
				console.log(receipt.transactionHash,"confirmed",idCampaign,"started ");
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.updateCampaignStats = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 1000000;
				var ctr =  await campaignManager.getCampaignContract(idCampaign);
				var gasPrice = await ctr.getGasPrice();
				if(gasPrice<4000000000)
					gasPrice = 4000000000;
				var receipt = await ctr.methods.updateCampaignStats(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,events:receipt.events});
				console.log(receipt.transactionHash,"confirmed",idCampaign,"stats updated ");
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.updatePromStats = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
          try{
			var gas = 200000;
			var ctr =  await campaignManager.getPromContract(idProm);
			var gasPrice = await ctr.getGasPrice();

			var receipt = await ctr.methods.updatePromStats(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			resolve({transactionHash:receipt.transactionHash,idProm:idProm,events:receipt.events});
			console.log(receipt.transactionHash,"confirmed",idProm,"stats updated ");
		}
		catch (err)
		{
			reject(err);
		}
		})
	}

	campaignManager.updateBounty = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gas = 200000;
			var ctr =  await campaignManager.getPromContract(idProm);
			var gasPrice = await ctr.getGasPrice();

			var receipt = await ctr.methods.updateBounty(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			resolve({transactionHash:receipt.transactionHash,idProm:idProm,events:receipt.events});
			console.log(receipt.transactionHash,"confirmed",idProm,"stats updated ");
		}
		catch (err)
		{
			reject(err);
		}
		})
	}

	campaignManager.endCampaign = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
      var ctr =  await campaignManager.getCampaignContract(idCampaign);
			var gas = 100000;
			var gasPrice = await ctr.getGasPrice();
			var receipt = await  ctr.methods.endCampaign(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
			console.log(receipt.transactionHash,"confirmed",idCampaign,"ended ");
		})
	}

	campaignManager.addToken = async function (token) {
		return new Promise(async (resolve, reject) => {
			var gas = 100000;
				var ctr = await campaignManager.getContractToken(token)
			var gasPrice = await ctr.getGasPrice();
			var receipt = await  ctr.methods.modToken(token,true).send( {gas:gas,gasPrice: gasPrice});
			resolve({transactionHash:receipt.transactionHash,token:token});
			console.log(receipt.transactionHash,"confirmed token added",token);
		})
	}

	campaignManager.addOracle = async function (oracle) {
		return new Promise(async (resolve, reject) => {
			var gas = 100000;
			var gasPrice = await app.web3.eth.getGasPrice();
			var receipt = await  campaignManager.getContract().methods.setOracle(oracle).send({ gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("addOracle transactionHash",hash) });
			resolve({transactionHash:receipt.transactionHash,oracle:oracle});
			console.log(receipt.transactionHash,"confirmed oracle added",oracle);
		});
	}

	campaignManager.getGains = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var ctr = await campaignManager.getPromContract(idProm);
				var gas = 200000;
				var gasPrice = await ctr.getGasPrice();
				var receipt = await  ctr.methods.getGains(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
			   receipt.transactionHash && app.account.sysLog("getGains", credentials.address, `${receipt.transactionHash} confirmed gains transfered for ${idProm}`);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	campaignManager.getRemainingFunds = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 200000;
				var ctr = await campaignManager.getCampaignContract(idCampaign);
				var gasPrice = await app.web3.eth.getGasPrice();

				var receipt = await  ctr.methods.getRemainingFunds(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
				console.log(receipt.transactionHash,"confirmed gains remaining for",idCampaign);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	campaignManager.getButtonStatus = link => {
			try {

				var type = '';
				var totalToEarn='0';
				link.payedAmount= link.payedAmount || '0';
				if(link.totalToEarn)
				totalToEarn=link.totalToEarn;
				if(link.reward)
				totalToEarn=link.isPayed ===false ? link.reward : link.payedAmount;
				if(link.status === 'indisponible') 
				type='indisponible';
				else if(link.status === 'rejected') 
				type='rejected';
				else if(link.status===false && !(link.campaign.isFinished))
				type='waiting_for_validation';
				else if((link.isPayed === true)||
				(link.payedAmount !=='0' && 
				new Big(totalToEarn).lte(new Big(link.payedAmount))))
				type='already_recovered';
				else if(totalToEarn==='0' && link.payedAmount ==='0')
				type='no_gains';
				else if((totalToEarn === '0' && link.campaign.funds[1]==='0' && link.payedAmount ==='0')||
				link.campaign.isFinished)
				type="not_enough_budget";
				else if((new Big(totalToEarn).gt(new Big(link.payedAmount))) && link.campaign?.ratios?.length ||
				(link.isPayed ===false && (new Big(totalToEarn).gt(new Big(link.payedAmount))) && link.campaign.bounties?.length))
				type='harvest';
				else 
				type="none";				
				return type;
			}
			catch (err)
			{
				console.error(err);
				app.account.errorLogger(err);
			}
		// })
	}

	campaignManager.getTotalToEarn = (socialStats,ratio)=> {
			try {
				let statistics = {...socialStats};
				let reachLimit =  campaignManager.getReachLimit(ratio,statistics.oracle); 
				if(reachLimit) statistics=  app.oracleManager.limitStats("",statistics,"",statistics.abosNumber,reachLimit);
				let totalToEarn='0';
				let payedAmount=statistics.payedAmount || '0'
				ratio.forEach( num =>{									
					if(((num.oracle === statistics.oracle) || (num.typeSN === statistics.typeSN))){
						let	view =statistics.views ?new Big(num["view"]).times(statistics.views):"0";
						let	like = statistics.likes ? new Big(num["like"]).times(statistics.likes) : "0";			
						let	share = statistics.shares ? new Big(num["share"]).times(statistics.shares.toString()) : "0";					
						let total = new Big(view).plus(new Big(like)).plus(new Big(share)).toFixed();
						totalToEarn = new Big(total).gt(new Big(payedAmount)) ? total : payedAmount;
					}
				})
				return totalToEarn;
			}catch(err){
				console.error(err);
				app.account.errorLogger(err);

			}
	}
	


			campaignManager.getReward = (result,bounties)=> {
					try {
						let payedAmount=result.payedAmount || '0';
						let totalToEarn='0';
						bounties.forEach( bounty=>{							
							if((bounty.oracle === result.oracle) || (bounty.oracle == app.oracle.findBountyOracle(result.typeSN))){
							  bounty.categories.forEach( category=>{
							   if( (+category.minFollowers <= +result.abosNumber)  && (+result.abosNumber <= +category.maxFollowers) ){
								  let total = category.reward;
								  totalToEarn = new Big(total).gt(new Big(payedAmount)) ? total : payedAmount;
							   }else if(+result.abosNumber > +category.maxFollowers){
								  let total = category.reward;
								  totalToEarn = new Big(total).gt(new Big(payedAmount)) ? total : payedAmount;
						 		}
							  })
							   }
							   })
							return totalToEarn;
					}catch(err){
				    console.error(err);
				    app.account.errorLogger(err);
		
					}
				}		

					campaignManager.campaignStatus = campaign => {
							try {
								let type = '';
								let dateNow = new Date();
								campaign.startDate=(Date.parse(campaign.startDate)) ? new Date(Date.parse(campaign.startDate)) : new Date(+campaign.startDate * 1000);
								campaign.endDate=(Date.parse(campaign.endDate)) ? new Date(Date.parse(campaign.endDate)) : new Date(+campaign.endDate * 1000);
								let isFinished=(dateNow > campaign.endDate || (campaign.funds) && campaign.funds[1] == '0');
								if(!campaign.hash)
								type="draft";													
								else if(isFinished && campaign.hash) 
								type='finished';
								else if(campaign.hash && dateNow < campaign.startDate)
								type='inProgress';
								else if(!isFinished && campaign.hash)
								type='apply';
								else 
								type="none";
								return type;
							}
							catch (err){
					         console.error(err);
				             app.account.errorLogger(err);
							}
					}
					

	campaignManager.estimateCreateCampaignYt = async function (dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  campaignManager.getContract().methods.createPriceFundYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.estimateFundCampaign = async function (idCampaign,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await campaignManager.getContract().methods.fundCampaign(idCampaign,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.estimateApplyCampaign = async function (idCampaign,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await campaignManager.getContract().methods.applyCampaign(idCampaign,typeSN,idPost,idUser).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.estimateValidateProm = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  campaignManager.getContract().methods.validateProm(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.estimateGetGains = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  campaignManager.getContract().methods.getGains(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}


	campaignManager.estimateGetRemainingFunds = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  campaignManager.getContract().methods.getRemainingFunds(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	campaignManager.campaignProms = async (idCampaign, ctrPassed)=>{
		return new Promise(async (resolve, reject) => {

       try{
        let ctr = ctrPassed;
		let idproms = await ctr.methods.getProms(idCampaign).call();
		let proms = [];

		if(idproms.length) {
			let addresses = [];
			let ids = [];
			let idByAddress = [];
			let userById = [];
       			for (let i =0;i<idproms.length;i++)
			{
				let prom = await ctr.methods.proms(idproms[i]).call();
				let count = await app.db.ban().find({idProm:idproms[i]}).count();
				prom.id = idproms[i];
				prom.pause = count;
				proms.push(prom);
				if(addresses.indexOf(prom.influencer)== -1)
					addresses.push(prom.influencer.slice(2).toLowerCase());
			}

			let wallets = await app.db.wallet().find({"keystore.address": { $in: addresses } }).toArray();
			for (let i =0;i<wallets.length;i++)
			{
				idByAddress["0x"+wallets[i].keystore.address] ="id#"+wallets[i].UserId;
				if(ids.indexOf(wallets[i].UserId)== -1)
					ids.push(wallets[i].UserId);
			}
			let users = await app.db.user().find({_id: { $in: ids } }).toArray();
			for (let i =0;i<users.length;i++)
      {
				delete (users[i].password)
				delete(users[i].accessToken)
				userById["id#"+users[i]._id] = users[i];
			}
			for (let i =0;i<proms.length;i++)
			{
				proms[i].meta = userById[idByAddress[proms[i].influencer.toLowerCase()]];
			}

		}
			resolve(proms)


	   }catch (err)
			{
				reject(err);
			}


		})
	}


	campaignManager.influencersLinks = async (links)=>{
		return new Promise(async (resolve, reject) => {

       try{
        
		// let idproms = await ctr.methods.getProms(idCampaign).call();
		let proms = links;

		if(links.length) {
			let addresses = [];
			let ids = [];
			let idByAddress = [];
			let userById = [];
			
       			for (let i =0;i<links.length;i++)
			{
				// let prom = await ctr.methods.proms(idproms[i]).call();
				// let count = await app.db.ban().find({idProm:idproms[i]}).count();
				// prom.id =links[i];
				if(addresses.indexOf(links[i].id_wallet)== -1)
					addresses.push(links[i].id_wallet.slice(2).toLowerCase());
			}

			let wallets = await app.db.wallet().find({"keystore.address": { $in: addresses } }).toArray();
			for (let i =0;i<wallets.length;i++)
			{
				idByAddress["0x"+wallets[i].keystore.address] ="id#"+wallets[i].UserId;
				if(ids.indexOf(wallets[i].UserId)== -1)
					ids.push(wallets[i].UserId);
			}
			//let users = await app.db.user().find({_id: { $in: ids } },{_id :1},{email:1}).toArray();
			let users = await app.db.user().find({_id: { $in: ids } }).project({email:1,_id:1,picLink:1,lastName:1,firstName:1}).toArray()
			
			for (let i =0;i<users.length;i++)
      {
				userById["id#"+users[i]._id] = users[i];
			}
			for (let i =0;i<proms.length;i++)
			{
				proms[i].meta = userById[idByAddress[proms[i].id_wallet.toLowerCase()]];
			}

		}
			resolve(proms)


	   }catch (err)
			{
				reject(err);
			}


		})
	}

	campaignManager.campaignsByOwner = async (owner) => {

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
		return campaigns;
	}

	campaignManager.getReachLimit=(campaignRatio,oracle)=>{
		let ratio=campaignRatio.find(item=>item.oracle==oracle);
		if(ratio)return ratio.reachLimit
		return;
	}
	campaignManager.UpdateStats = async (obj,socialOracle) =>{			
		if(!socialOracle) delete obj.views, delete obj.likes, delete obj.shares, delete obj.totalToEarn;
		await app.db.campaign_link().findOne({id_prom:obj.id_prom}, async (err, result)=>{
			if(!result){await app.db.campaign_link().insertOne(obj);
			}
			else{
				await app.db.campaign_link().updateOne({id_prom:obj.id_prom},{$set: obj})
			}
		})
		
	}
		
	campaignManager.campaignStats = async idCampaign =>{
		return new Promise( async (resolve, reject) => {
          try{
			const result = await app.db.campaigns().findOne({_id: app.ObjectId(idCampaign)});
			if(result.hash){
			const ctr = await app.campaign.getCampaignContract(result.hash);
				const element = await ctr.methods.campaigns(result.hash).call()
			const toPayBig = new Big(element.funds[1]);
			const bgBudget = new Big(result.cost)
			const spent =bgBudget.minus(toPayBig).abs().toFixed();
            resolve({toPay : element.funds[1] , spent, initialBudget : result.cost})
			}else{
				resolve({toPay : 0 , spent:0, initialBudget : 0})
			}

		  }catch (e) {
				reject({message:e.message});
			}		})
	}

	campaignManager.filterCampaign=(req,idNode, strangerDraft)=>{
		
		const title=req.query.searchTerm || '';
		const status=req.query.status;
		const blockchainType=req.query.blockchainType || '';
		 
		const dateJour= Math.round(new Date().getTime()/1000);
		if(req.query._id) query["$and"].push({ _id: { $gt: app.ObjectId(req.query._id) } })
		if(req.query.oracles == undefined){
			oracles=["twitter","facebook","youtube","instagram"];
		}

	else if(typeof req.query.oracles === "string"){
		oracles=Array(req.query.oracles);
	}else{
		oracles=req.query.oracles;
	}
		const remainingBudget=req.query.remainingBudget || [];
		
		var query = {};
		query["$and"]=[];
		
	query["$and"].push({"_id":{$nin:strangerDraft}})		

	if(req.query.oracles)query["$and"].push({"$or":[{"ratios.oracle":{ $in: oracles}},{"bounties.oracle":{ $in: oracles}}]});

		if(title){
		query["$and"].push({"title":{$regex: ".*" + title + ".*",$options: 'i'}});
		}
		if(blockchainType){
			query["$and"].push({"token.type":blockchainType});
		}
		if(status =="active" ){
			if(remainingBudget.length==2){
			query["$and"].push({"funds.1":{ $exists: true}});
			query["$and"].push({"funds.1": { $gte :  remainingBudget[0],$lte :  remainingBudget[1]}});
			}
			query["$and"].push({"endDate":{ $gt : dateJour }});
			query["$and"].push({"funds.1":{$ne: "0"}});
			query["$and"].push({"hash":{ $exists: true}});
		}
		else if(status=="finished"){
			query["$and"].push({"$or":[{"endDate":{ $lt : dateJour }},{"funds.1":{$eq: "0"}}]});
			query["$and"].push({"hash":{ $exists: true}});

		}else if(status=="draft" ){
			query["$and"].push({"hash":{ $exists: false}});
			query["$and"].push({"idNode": idNode});
		}

		return query
	}

	campaignManager.sortOut=(req,idNode, strangerDraft)=>{
		
		const title=req.query.searchTerm || '';
		const status=req.query.status;
		const blockchainType=req.query.blockchainType || '';
		 
		const dateJour= Math.round(new Date().getTime()/1000);
		if(req.query._id) query["$and"].push({ _id: { $gt: app.ObjectId(req.query._id) } })
		if(req.query.oracles == undefined){
			oracles=["twitter","facebook","youtube","instagram"];
		}

	else if(typeof req.query.oracles === "string"){
		oracles=Array(req.query.oracles);
	}else{
		oracles=req.query.oracles;
	}
		const remainingBudget=req.query.remainingBudget || [];
		
		var query = {};
		query["$and"]=[];
		
	query["$and"].push({"_id":{$nin:strangerDraft}})		

	if(req.query.oracles)query["$and"].push({"$or":[{"ratios.oracle":{ $in: oracles}},{"bounties.oracle":{ $in: oracles}}]});

		if(title){
		query["$and"].push({"title":{$regex: ".*" + title + ".*",$options: 'i'}});
		}
		if(blockchainType){
			query["$and"].push({"token.type":blockchainType});
		}
		if(status =="active" ){
			if(remainingBudget.length==2){
			query["$and"].push({"funds.1":{ $exists: true}});
			query["$and"].push({"funds.1": { $gte :  remainingBudget[0],$lte :  remainingBudget[1]}});
			}
			query["$and"].push({"endDate":{ $gt : dateJour }});
			query["$and"].push({"funds.1":{$ne: "0"}});
			query["$and"].push({"hash":{ $exists: true}});
		}
		else if(status=="finished"){
			query["$and"].push({"$or":[{"endDate":{ $lt : dateJour }},{"funds.1":{$eq: "0"}}]});
			query["$and"].push({"hash":{ $exists: true}});

		}else if(status=="draft" ){
			query["$and"].push({"hash":{ $exists: false}});
			query["$and"].push({"idNode": idNode});
		}

		query["$and"].push({type:{
			
			$in: ['draft','finished','inProgress','apply']
		}})

		return query
	}

	campaignManager.sortOutPublic=(req,idNode, strangerDraft)=>{
		const title=req.query.searchTerm || '';
		const status=req.query.status;
		const blockchainType=req.query.blockchainType || '';
		 
		const dateJour= Math.round(new Date().getTime()/1000);
		if(req.query._id) query["$and"].push({ _id: { $gt: app.ObjectId(req.query._id) } })
		
		const remainingBudget=req.query.remainingBudget || [];
		
		var query = {};
		query["$and"]=[];
		
	 if((req.query.idWallet || req.query.showOnlyMyCampaigns)&& !req.query.showOnlyLiveCampaigns) query["$and"].push({"_id":{$nin:strangerDraft}});	
	 
	 req.query.showOnlyMyCampaigns && query["$and"].push({idNode});	
	 req.query.showOnlyLiveCampaigns && query["$and"].push({type:"apply",hash:{ $exists: true}});	
     !req.query.idWallet && query["$and"].push({hash:{ $exists: true}});
	 req.query.remuneration && query["$and"].push({remuneration: req.query.remuneration});

 if(req.query.oracles == undefined){
		oracles=["twitter","facebook","youtube","instagram","linkedin"];
	}
else if(typeof req.query.oracles === "string"){
	oracles=Array(req.query.oracles);
}else{
	oracles=req.query.oracles;
}
if(req.query.oracles)query["$and"].push({"$or":[{"ratios.oracle":{ $in: oracles}},{"bounties.oracle":{ $in: oracles}}]});
   
		title && query["$and"].push({"title":{$regex: ".*" + title + ".*",$options: 'i'}});
		blockchainType && query["$and"].push({"token.type":blockchainType});
	
		if(status =="active" ){
			if(remainingBudget.length==2){
			query["$and"].push({"funds.1":{ $exists: true}});
			query["$and"].push({"funds.1": { $gte :  remainingBudget[0],$lte :  remainingBudget[1]}});
			}
			query["$and"].push({"endDate":{ $gt : dateJour }});
			query["$and"].push({"funds.1":{$ne: "0"}});
			query["$and"].push({"hash":{ $exists: true}});
		}
		else if(status=="finished"){
			query["$and"].push({"$or":[{"endDate":{ $lt : dateJour }},{"funds.1":{$eq: "0"}}]});
			query["$and"].push({"hash":{ $exists: true}});

		}else if(status=="draft" ){
			query["$and"].push({"hash":{ $exists: false}});
			query["$and"].push({"idNode": idNode});
		}

		query["$and"].push({type:{
			
			$in: ['draft','finished','inProgress','apply']
		}})

		return query
	}



	campaignManager.filterProms=(req, id_wallet)=>{
		
		const status=req.query.status;
		
		var query = {};
		query["$and"]=[];
		
		if(req.query.campaign && req.query.state==='part'){
			query["$and"].push({id_wallet});
			query["$and"].push({id_campaign:req.query.campaign});
		}
		else if(req.query.campaign && req.query.state==='campaign')
		query["$and"].push({id_campaign:req.query.campaign});
		else if(!req.query.campaign && !(req.query.state))	
		query["$and"].push({id_wallet});

		let oracles= req.query.oracles
		 oracles= typeof oracles === "string" ? [oracles] : oracles;
		if (oracles) query["$and"].push({"oracle":{ $in: oracles}});

		if(status == "false")	query["$and"].push({"status":false});
		if(status == "rejected") query["$and"].push({"status":"rejected"});
        if(status == "true") query["$and"].push({"status":true});

		return query
	}

	campaignManager.filterLinks=(req, id_wallet)=>{
		
		const status=req.query.status;
		let oracles= req.query.oracles
		oracles= typeof oracles === "string" ? [oracles] : oracles;
		var query = {id_wallet:id_wallet};
		if(req.query.campaign && req.query.state==='part'){
			query={id_wallet:id_wallet,id_campaign:req.query.campaign};
		}
		else if(req.query.campaign && req.query.state==='owner')
		query={id_campaign:req.query.campaign};
		else if(!req.query.campaign && !(req.query.state))	
		query={id_wallet:id_wallet};



		if (oracles) query.oracle={ $in: oracles};

		if(status == "false")	{
			query.status=false;
			query.type="waiting_for_validation"
		}else{
			if(status == "rejected") query.status="rejected";
			if(status == "true") query.status=true;
			query.type={
				$in: ['indisponible','waiting_for_validation','harvest','already_recovered','not_enough_budget','no_gains','rejected','none']
			}
		}
		
		return query
	}



	campaignManager.getPromApplyStats= async(oracles,link,id,linkedinProfile=null)=>{
		return new Promise( async (resolve, reject) => {
			try{
		let socialOracle = {}
		if(oracles == "facebook" || oracles == "twitter") socialOracle = await app.oracle[oracles](link.idUser,link.idPost);
		else if(oracles == "youtube") socialOracle = await app.oracle.youtube(link.idPost);
		else if(oracles == "instagram")  socialOracle = await app.oracle.instagram(id,link.idPost);
		else socialOracle = await app.oracle.linkedin(link.idUser,link.idPost,link.typeURL,linkedinProfile);
         delete socialOracle.date
		 resolve(socialOracle)
		}catch (e) {
				reject({message:e.message});
			}
	})
}

campaignManager.getTransactionAmount = async (transactionHash, network) =>{
	return new Promise( async (resolve, reject) => {
		try{
	let data = 	await network.getTransactionReceipt(transactionHash)
	let hex = network == app.web3.eth ? await app.web3.utils.hexToNumberString(data.logs[0].data) : await app.web3Bep20.utils.hexToNumberString(data.logs[0].data)
	resolve(hex)
}catch (e) {
		reject({message:e.message});
}
	})
}

campaignManager.getDecimal = async function (symbol) {
    return new Promise(async (resolve, reject) => {
        try {
            let token_info=app.config.Tokens;
            for(const T_name in token_info){
                if (token_info[T_name].symbol === symbol)
                resolve(token_info[T_name].dicimal);                
            };
        }
        catch (err)
        {
            reject(err);
        }
    })
}

	app.campaign = campaignManager;
	return app;
}
