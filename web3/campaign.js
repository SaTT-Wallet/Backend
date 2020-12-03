module.exports = async function (app) {
	
	var fs = require("fs");
	var solc = require("solc");
	var child = require('child_process');
	var BN = app.web3.utils.BN;
	var camapignManager = {};
	
	camapignManager.deployContract = async function () {
		return new Promise(async (resolve, reject) => {
			var out = child.execSync(__dirname+'/../solc '+__dirname+'/../contracts/campaign.sol --optimize --combined-json bin,abi');
			var ctrs = JSON.parse(out.toString());
			var abi = ctrs.contracts[__dirname+'/../contracts/campaign.sol:campaign'].abi;
			var bytecode = ctrs.contracts[__dirname+'/../contracts/campaign.sol:campaign'].bin;
			var gasPrice = await app.web3.eth.getGasPrice();
			camapignManager.contract = new app.web3.eth.Contract(JSON.parse(abi));
			await app.web3.eth.personal.unlockAccount(app.config.campaignOwner,app.config.campaignOwnerPass,15000);
			console.log("deploying");
			var gas = await app.web3.eth.estimateGas({data: "0x"+bytecode});
			console.log(gas);
			camapignManager.contract.options.address = app.config.campaignOwner;
			console.log(gas);
			camapignManager.contract.deploy( {data:"0x"+bytecode,arguments:[]})
			.send({from:app.config.campaignOwner,gas:gas+10000,gasPrice: gasPrice})
			   .on('error', function(error){ console.log("contract deploy error",error) })
			.on('transactionHash', function(transactionHash){console.log("contract deploy transactionHash",transactionHash) })
			.on('receipt', function(receipt){
				camapignManager.isDeplyed = true;
				app.db.contract().insertOne({name:'campaign',fileName:'campaign.sol',address:receipt.contractAddress,type:app.config.blockChain,abi:abi,bytecode:bytecode});
				camapignManager.contract = new app.web3.eth.Contract(JSON.parse(abi),receipt.contractAddress);
				resolve(receipt.contractAddress);
				console.log("receipt ") ;
			})
		});
	}
	
	camapignManager.getContract = function (address) {
		if(address == app.config.ctrs.campaign.address.mainnet)
			return camapignManager.contract;
		else
			return camapignManager.contractAdvFee;
		
	}
	
	camapignManager.getCampaignContract = async function (idCampaign) {
		var campaigns = await app.db.campaign().find({id:idCampaign}).toArray();
		if(campaigns.length)
		{
			return campaigns[0].contract;
		}
		else
			return app.config.ctrs.campaignAdvFee.address.mainnet;
			
	}
	
	camapignManager.getPromContract = async function (idProm) {
		var proms = await app.db.event().find({prom:idProm}).toArray();
		if(proms)
			return proms[0].contract;
		else
			return app.config.ctrs.campaignAdvFee.address.mainnet;
			
	}
	
	camapignManager.followContract = function () {
		camapignManager.contract = new app.web3.eth.Contract(app.config.ctrs.campaign.abi,app.config.ctrs.campaign.address.mainnet);
		camapignManager.contractAdvFee = new app.web3.eth.Contract(app.config.ctrs.campaignAdvFee.abi,app.config.ctrs.campaignAdvFee.address.mainnet);
	}
	
	camapignManager.createCampaign = async function (dataUrl,startDate,endDate,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 200000; 
			var receipt = await camapignManager.getContract().methods.createCampaign(dataUrl,startDate,endDate).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("createCampaign transactionHash",hash) });
			resolve(receipt.events.CampaignCreated.returnValues.id);
			console.log("campaign created:",receipt.events);
		})
	}
	
	camapignManager.createCampaignYt = async function (dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 300000; 	
			var receipt = await  camapignManager.getContract().methods.createPriceFundYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("createCampaignYt transactionHash",hash) });   
			console.log(receipt.events.CampaignCreated);
			resolve(receipt.events.CampaignCreated.returnValues.id);	
		})
	}
	
	camapignManager.createCampaignAll = async function (dataUrl,startDate,endDate,ratios,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 500000; 	
			try {
			var receipt = await  camapignManager.getContract().methods.createPriceFundAll(dataUrl,startDate,endDate,ratios,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("createCampaignAll transactionHash",hash) });  
			console.log(receipt.events.CampaignCreated);
			resolve(receipt.events.CampaignCreated.returnValues.id);	
			} catch (err) {
				reject(err)
			}
			
		})
	}
	
	camapignManager.modCampaign = async function (idCampaign,dataUrl,startDate,endDate,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 200000; 
			var receipt = await camapignManager.getContract().methods.modCampaign(idCampaign,dataUrl,startDate,endDate).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("modCampaign transactionHash",hash) });   
			console.log(receipt.events.CampaignCreated.returnValues.id);
			resolve(receipt.events.CampaignCreated.returnValues.id);  
		})
	}
	
	camapignManager.fundCampaign = async function (idCampaign,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = 200000; 
			console.log(idCampaign,token,amount);
			var ctr = await app.campaign.getCampaignContract(idCampaign);
			var receipt = await camapignManager.getContract(ctr).methods.fundCampaign(idCampaign,token,amount).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("fundCampaign transactionHash",hash) });  
			   resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,token:token,amount:amount});
			   console.log(receipt.transactionHash,"confirmed",idCampaign,"funded");
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.priceRatioCampaign = async function (idCampaign,typeSN,likeRatio,shareRatio,viewRatio,credentials) {
		return new Promise(async (resolve, reject) => {
		var gas = 100000;
			var gasPrice = await app.web3.eth.getGasPrice();
			var receipt = await  camapignManager.getContract().methods.priceRatioCampaign(idCampaign,typeSN,likeRatio,shareRatio,viewRatio).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("priceRatioCampaign transactionHash",hash) });  
			   resolve({transactionHash:receipt.transactionHash,typeSN:typeSN,likeRatio:likeRatio,shareRatio:shareRatio,viewRatio:viewRatio});
			   console.log(receipt.transactionHash,"confirmed",idCampaign,"priced");
		})
	}
	
	camapignManager.applyCampaign = async function (idCampaign,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gas = 400000;
			var gasPrice = await app.web3.eth.getGasPrice();
			//var gasPrice = 4000000000;
			var isDoubled = await camapignManager.getContract(app.config.ctrs.campaign.address.mainnet).methods.getIsUsed(idCampaign,typeSN,idPost,idUser).call();
			if(isDoubled)
			{
				reject({message:"Link already sent"});
			}
			else {
				var receipt = await camapignManager.getContract(app.config.ctrs.campaign.address.mainnet).methods.applyCampaign(idCampaign,typeSN,idPost,idUser).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){
					console.log("applyCampaign transactionHash",hash);
					resolve({transactionHash:hash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});				
				});
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
	
	camapignManager.applyAndValidateCampaign = async function (idCampaign,influencer,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
			var gas = 400000;
			var gasPrice = await app.web3.eth.getGasPrice();
			//var gasPrice = 4000000000;
			var ctr =  await camapignManager.getContract();
			
			console.log(idCampaign,typeSN,idPost,idUser);
			/*var isDoubled = await ctr.methods.getIsUsed(idCampaign,typeSN,idPost,idUser).call();
			
			if(isDoubled)
			{
				reject({message:"Link already sent"});
			}
			else {*/
				var receipt = await camapignManager.getContract().methods.applyAndValidate(idCampaign,influencer,typeSN,idPost,idUser).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){
					
					console.log("applyCampaign transactionHash",hash);
					resolve({transactionHash:hash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});				
				});
				var prom = receipt.events.CampaignApplied.returnValues.prom;
				//resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,typeSN:typeSN,idPost:idPost,idUser:idUser,idProm:prom});
				console.log(receipt.transactionHash,"confirmed",idCampaign," prom ",prom);
				//}
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	
	
	camapignManager.validateProm = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 100000;
				var gasPrice = await app.web3.eth.getGasPrice();
				var receipt = await  camapignManager.getContract(app.config.ctrs.campaign.address.mainnet).methods.validateProm(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("validateProm transactionHash",hash) });  
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
				console.log(receipt.transactionHash,"confirmed validated prom ",idProm);
			}
			catch (err)
			{
				reject(err);
			}
		})	
	}
	
	camapignManager.startCampaign = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 100000;
				var gasPrice = await app.web3.eth.getGasPrice();
				var receipt = await  camapignManager.getContract().methods.startCampaign(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("startCampaign transactionHash",hash) });  
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
				console.log(receipt.transactionHash,"confirmed",idCampaign,"started ");
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.updateCampaignStats = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 1000000;
				var gasPrice = await app.web3.eth.getGasPrice();
				if(gasPrice<4000000000)
					gasPrice = 4000000000;
				var ctr = await app.campaign.getCampaignContract(idCampaign);
				var receipt = await camapignManager.getContract(ctr).methods.updateCampaignStats(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("updateCampaignStats transactionHash",hash) });  
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign,events:receipt.events});
				console.log(receipt.transactionHash,"confirmed",idCampaign,"stats updated ");
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.updatePromStats = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			
			var gas = 200000;
			var gasPrice = await app.web3.eth.getGasPrice();
			/*if(gasPrice<30000000000)
				gasPrice = 30000000000;*/
			var ctr = await app.campaign.getPromContract(idProm);
			var receipt = await camapignManager.getContract(ctr).methods.updatePromStats(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("updatePromStats transactionHash",hash) });  
			resolve({transactionHash:receipt.transactionHash,idProm:idProm,events:receipt.events});
			console.log(receipt.transactionHash,"confirmed",idProm,"stats updated ");
		})
	}
	
	camapignManager.endCampaign = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			
			var gas = 100000;
			var gasPrice = await app.web3.eth.getGasPrice();
			var receipt = await  camapignManager.getContract().methods.endCampaign(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("endCampaign transactionHash",hash) });  
			resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
			console.log(receipt.transactionHash,"confirmed",idCampaign,"ended ");
		})
	}
	
	camapignManager.addToken = async function (token) {
		return new Promise(async (resolve, reject) => {
			var gas = 100000;
			var gasPrice = await app.web3.eth.getGasPrice();
			var receipt = await  camapignManager.getContract().methods.modToken(token,true).send( {gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("addToken transactionHash",hash) });
			resolve({transactionHash:receipt.transactionHash,token:token});
			console.log(receipt.transactionHash,"confirmed token added",token);
		})
	}
	
	camapignManager.addOracle = async function (oracle) {
		return new Promise(async (resolve, reject) => {
			var gas = 100000;
			var gasPrice = await app.web3.eth.getGasPrice();
			var receipt = await  camapignManager.getContract().methods.setOracle(oracle).send({ gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("addOracle transactionHash",hash) });
			resolve({transactionHash:receipt.transactionHash,oracle:oracle});
			console.log(receipt.transactionHash,"confirmed oracle added",oracle);
		});
	}
	
	camapignManager.getGains = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 200000;
				var gasPrice = await app.web3.eth.getGasPrice();
				var ctr = await app.campaign.getPromContract(idProm);
				var receipt = await  camapignManager.getContract(ctr).methods.getGains(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("getGains transactionHash",hash) });
				resolve({transactionHash:receipt.transactionHash,idProm:idProm});
				console.log(receipt.transactionHash,"confirmed gains transfered for",idProm);
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	
	camapignManager.getRemainingFunds = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gas = 200000;
				var gasPrice = await app.web3.eth.getGasPrice();
				var ctr = await app.campaign.getCampaignContract(idCampaign);
				var receipt = await  camapignManager.getContract(ctr).methods.getRemainingFunds(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("getRemainingFunds transactionHash",hash) });
				resolve({transactionHash:receipt.transactionHash,idCampaign:idCampaign});
				console.log(receipt.transactionHash,"confirmed gains remaining for",idCampaign);
			}
			catch (err)
			{
				reject(err);
			}
		})	
	}
	
	camapignManager.abiGen = async function () {
		return new Promise(async (resolve, reject) => {
			var out = child.execSync(__dirname+'/../solc '+__dirname+'/../contracts/campaign.sol --optimize --combined-json bin,abi');
			var ctrs = JSON.parse(out.toString());
			var abi = ctrs.contracts[__dirname+'/../contracts/campaign.sol:campaign'].abi;
			var bytecode = ctrs.contracts[__dirname+'/../contracts/campaign.sol:campaign'].bin;
			//await app.db.contract().insertOne({name:'campaign',fileName:'campaign.sol',address:"0x0",type:'mainnet',abi:abi,bytecode:bytecode});
			resolve({result:"OK"});
		});		
	}
	
	
	
	camapignManager.estimateCreateCampaignYt = async function (dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  camapignManager.getContract().methods.createPriceFundYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);	
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.estimateFundCampaign = async function (idCampaign,token,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await camapignManager.getContract().methods.fundCampaign(idCampaign,token,amount).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);	
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.estimateApplyCampaign = async function (idCampaign,typeSN,idPost,idUser,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await camapignManager.getContract().methods.applyCampaign(idCampaign,typeSN,idPost,idUser).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);	
			}
			catch (err)
			{
				reject(err);
			}
		})
	}
	
	camapignManager.estimateValidateProm = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  camapignManager.getContract().methods.validateProm(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		})	
	}
	
	camapignManager.estimateGetGains = async function (idProm,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  camapignManager.getContract().methods.getGains(idProm).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);	
			}
			catch (err)
			{
				reject(err);
			}
		})
	}

	
	camapignManager.estimateGetRemainingFunds = async function (idCampaign,credentials) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  camapignManager.getContract().methods.getRemainingFunds(idCampaign).send({from:credentials.address, gas:gas,gasPrice: gasPrice}).estimateGas({from:credentials.address,gasPrice: gasPrice});
				resolve(gas);	
			}
			catch (err)
			{
				reject(err);
			}
		})	
	}
	
	app.campaign = camapignManager;
	return app;
}