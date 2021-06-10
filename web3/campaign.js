module.exports = async function (app) {

	var fs = require("fs");
	var child = require('child_process');
	var BN = app.web3.utils.BN;
	var campaignManager = {};



	campaignManager.getContract = function (address) {
		if(address == app.config.ctrs.campaign.address.mainnet)
			return campaignManager.contract;
		else if(address == app.config.ctrs.campaign.address.mainnetBep20)
				return campaignManager.contractBep20;
		else
				return false;
	}

	campaignManager.getCampaignContract = async function (idCampaign) {
		var campaigns = await app.db.campaign().find({id:idCampaign}).toArray();
		if(campaigns.length)
		{

			return campaignManager.getContract( campaigns[0].contract);
		}
		else
			return false;
	}

	campaignManager.getPromContract = async function (idProm) {


		var proms = await app.db.event().find({prom:idProm}).toArray();
		//console.log("log",proms)
		if(proms.length) {
			return 	 campaignManager.getContract(proms[0].contract);
		}
		else {
			return false;
		}
	}

	campaignManager.getContractToken = async function (token) {

		//console.log("token",token);
		var code = await app.web3Bep20.eth.getCode(token);

		if(code != "0x") {
				return campaignManager.contractBep20;
		}

			return campaignManager.contract;
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
			campaignManager.contractBep20 = new app.web3Bep20.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.testnetBep20);
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
			var gas = 500000;
			try {
				if(ctr.isCentral()) {
					var receipt = await  app.campaignCentral.createCampaignAll(dataUrl,startDate,endDate,ratios,token,amount,credentials);
					resolve(receipt);
				}
				else {
					var receipt = await  ctr.methods.createPriceFundAll(dataUrl,startDate,endDate,ratios,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
					resolve(receipt.events.CampaignCreated.returnValues.id);
				}

			} catch (err) {

				reject(err)
			}

		})
	}

	campaignManager.createCampaignBounties = async function (dataUrl,startDate,endDate,bounties,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {

			var ctr = await campaignManager.getContractToken(token);

			var gasPrice = await ctr.getGasPrice();
			var gas = 500000;
			try {


					var receipt = await  ctr.methods.createPriceFundBounty(dataUrl,startDate,endDate,bounties,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
					resolve(receipt.events.CampaignCreated.returnValues.id);


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

			if(ctr.isCentral()) {
				var receipt = await  app.campaignCentral.fundCampaign(idCampaign,token,amount,credentials);
				resolve(receipt);
			}

			var receipt = await ctr.methods.fundCampaign(idCampaign,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			   resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,token:token,amount:amount});
			   console.log(receipt.transactionHash,"confirmed",idCampaign,"funded");
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
			if(ctr.isCentral()) {
				var receipt = await  app.campaignCentral.applyCampaign(idCampaign,typeSN,idPost,idUser,credentials);
				resolve({transactionHash:receipt,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});
				return;
			}
				var gasPrice = await ctr.getGasPrice();
			var isDoubled = await ctr.methods.getIsUsed(idCampaign,typeSN,idPost,idUser).call();
			if(isDoubled)
			{
				reject({message:"Link already sent"});
			}
			else {
				var receipt = await ctr.methods.applyCampaign(idCampaign,typeSN,idPost,idUser).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
					resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});

				var prom = receipt.events.CampaignApplied.returnValues.prom;
				//resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});
				console.log(receipt.transactionHash,"confirmed",idCampaign," prom ",prom);
				}
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

					if(ctr.isCentral()) {
					var receipt = await  app.campaignCentral.validateProm(idProm,credentials);
					resolve({idProm:idProm});
					return;
				}
					var gasPrice = await ctr.getGasPrice();
				var receipt = await  ctr.methods.validateProm(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
				console.log(receipt.transactionHash,"confirmed validated prom ",idProm);
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

			var gas = 200000;
			var ctr =  await campaignManager.getPromContract(idProm);
			var gasPrice = await ctr.getGasPrice();

			var receipt = await ctr.methods.updatePromStats(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
			resolve({transactionHash:receipt.transactionHash,idProm:idProm,events:receipt.events});
			console.log(receipt.transactionHash,"confirmed",idProm,"stats updated ");
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

					if(ctr.isCentral()) {
					var receipt = await  app.campaignCentral.getGains(idProm,credentials);
					resolve(receipt);
					return;
				}

				var receipt = await  ctr.methods.getGains(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice});
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
				console.log(receipt.transactionHash,"confirmed gains transfered for",idProm);
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

				if(ctr.isCentral()) {
					var receipt = await  app.campaignCentral.getRemainingFunds(idCampaign,credentials);
					resolve(receipt);
					return;
				}

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



	app.campaign = campaignManager;
	return app;
}
