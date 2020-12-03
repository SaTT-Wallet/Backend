module.exports = async function (app) {
	
	var tokenManager = {};
	var fs = require("fs");
	var solc = require("solc");
	
	tokenManager.deployContract = async function () {
		return new Promise(async (resolve, reject) => {
			var source = fs.readFileSync(__dirname+'/../contracts/Token.sol', 'utf8');
			var compiledContract = solc.lowlevel.compileSingle(source, 1);
			//var compiledContract = solc.compile(source, 1,function(path){console.log(path);return "";});
			var abi = compiledContract.contracts[':SATTToken'].interface;
			var bytecode = compiledContract.contracts[':SATTToken'].bytecode;	
			tokenManager.contract = new app.web3.eth.Contract(JSON.parse(abi));
			await app.web3.eth.personal.unlockAccount(app.config.tokenOwner,app.config.tokenOwnerPass,15000);
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas = await app.web3.eth.estimateGas({data: "0x"+bytecode});
			ContractToken.contract.options.address = app.config.tokenOwner;
			console.log(gas);
			ContractToken.contract.deploy( {data:"0x"+bytecode,arguments:[]})
			.send({from:app.config.tokenOwner,gas:gas+10000, gasPrice: gasPrice})
			.on('error', function(error){ console.log("contract deploy error",error) })
			.on('transactionHash', function(transactionHash){console.log("contract deploy transactionHash",transactionHash) })
			.on('receipt',async function(receipt){
				ContractToken.isDeplyed = true;
				await app.db.contract().insertOne({name:'SATTToken',fileName:'Token.sol',address:receipt.contractAddress,type:app.config.blockChain,abi:abi,bytecode:bytecode});
				resolve(receipt.contractAddress);
				console.log("receipt ") ;
			})
		});
	}
	
	tokenManager.followContract = function () {
		tokenManager.contract = new app.web3.eth.Contract(app.config.ctrs.token.abi,app.config.ctrs.token.address.mainnet);
	}
	
	tokenManager.approve = async function (addr,spender,amount) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = 60000;
					
				var receipt = await tokenManager.contract.methods.approve(spender,amount).send({from:addr,gas:gas,gasPrice: gasPrice})
				.once('transactionHash', function(transactionHash){
					console.log("approve transactionHash",transactionHash) 
				});
				resolve({transactionHash:receipt.transactionHash,address:addr,spender:spender});
				console.log(receipt.transactionHash,"confirmed approval from",addr,"to",spender);
			}
			catch (err)
			{
				reject(err);
			}
		});
	}
	
	tokenManager.getApproval = async function (addr,spender) {
		return new Promise(async (resolve, reject) => {
			var amount = await tokenManager.contract.methods.allowance(addr,spender).call();
			console.log("approval",addr,"for",spender,amount.toString());
			resolve({amount:amount.toString()});
		});
	}
	
	tokenManager.transfer = async function (to,amount,credentials) {
		return new Promise(async (resolve, reject) => {
			var gasPrice = await app.web3.eth.getGasPrice();
			var gas  = 60000;
			
			if(credentials.gasPrice)
				gasPrice = credentials.gasPrice;
				
			try {
				var receipt = await tokenManager.contract.methods.transfer(to,amount).send({from:credentials.address,gas:gas,gasPrice: gasPrice})
				.once('transactionHash', function(transactionHash){
					console.log("transfer satt transactionHash",transactionHash) 
				})
				
				var tx = await app.web3.eth.getTransaction(receipt.transactionHash);
				tx.txtype = "SATT";
				tx.apiversion = 2;
				tx.date = Date.now();
				tx.networkid = app.config.blockChain;
				tx.from = credentials.address;
				tx.to = to.toLowerCase();
				tx.from_id = credentials.from_id;
				tx.value = amount;
				tx.gasPrice = gasPrice;
				app.db.txs().insertOne(tx);
				
				
				resolve({transactionHash:receipt.transactionHash,address:credentials.address,to:to,amount:amount});
				console.log(receipt.transactionHash,"confirmed transfer from",credentials.address,"to",to,"amount",amount); 
			}
			catch (err) {
				reject(err)
			}
		});
	}
	
	
	tokenManager.estimateApprove = async function (addr,spender,amount) {
		return new Promise(async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await tokenManager.contract.methods.approve(spender,amount).estimateGas({from:addr,gasPrice: gasPrice});
				resolve(gas);
			}
			catch (err)
			{
				reject(err);
			}
		});
	}
	
	app.token = tokenManager;
	return app;
}