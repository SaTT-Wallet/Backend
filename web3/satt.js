module.exports = async function (app) {

	var tokenManager = {};
	var fs = require("fs");

	tokenManager.followContract = function () {
		if(app.config.testnet) {
			tokenManager.contract = new app.web3.eth.Contract(app.config.ctrs.token.abi,app.config.ctrs.token.address.testnet);
		}
		else {
			tokenManager.contract = new app.web3.eth.Contract(app.config.ctrs.token.abi,app.config.ctrs.token.address.mainnet);

			
		}


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
	
	tokenManager.filterAmount= function(input, nbre = 10) {
		if (input) {
		  var out = input;
		  let size = input.length;
		  let toAdd = parseInt(nbre) - parseInt(size);
	
		  if (input == 0) {
			toAdd--;
		  }
		  if (toAdd > 0) {
			if (input.includes(".")) {
			  for (let i = 0; i < toAdd; i++) {
				out += "0";
			  }
			} else {
			  out += ".";
			  for (let i = 0; i < toAdd; i++) {
				out += "0";
			  }
			}
		  } else if (toAdd < 0) {
			if (input.includes(".")) {
			  if (input.split(".")[0].length > nbre) {
				out = input.substring(0, nbre);
			  } else {
				out = input.substring(0, nbre);
				if (out[nbre - 1] == ".") {
				  out = input.substring(0, nbre - 1);
				}
			  }
			}
		  }
		  return out;
		} else {
		  return "-";
		}
	  }

	  tokenManager.calculateVariation =(a, b) =>{
		if (isNaN(+a) || isNaN(+b)){
			return  'input error';
		 }
		return  a-b === 0 ? 0 : 100 * ( a - b ) / b 
	   }

	app.token = tokenManager;
	return app;
}
