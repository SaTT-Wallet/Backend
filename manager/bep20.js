module.exports = async function (app) {

  	var bep20Manager = {};
    var web3 = app.web3Bep20;



    var nullAddress = "0x0000000000000000000000000000000000000000";

    bep20Manager.contract = new web3.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.mainnet);

    if(app.web3Bep20Websocket)
    {

      bep20Manager.contractWS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.mainnet);
    }
    if(app.config.testnet){
      bep20Manager.contract = new web3.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.testnet);
      bep20Manager.contractWS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.testnet);

    }

    bep20Manager.unlockOwner = async () => {
      web3.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);
    }

    bep20Manager.eventETHtoBSC = async (error, evt) => {

      if(error) {
        console.log(error);
        return;
      }

        var dbl = await app.db.bep20().findOne({ethTxHash:evt.transactionHash});

        if(dbl)
        {
          console.log("doublon infura :",evt.transactionHash)
          return;
        }
        console.log("eth to bsc",evt.transactionHash);

        var to = evt.returnValues.to;
        var value = evt.returnValues.value;
        var from = evt.returnValues.from;

        /*if(from.toLowerCase() == "0x09fb1450e5d341acd5f15dcca4c7aebdb6057b3d" ||  from.toLowerCase() == "0xf382f4a8b305e1e64df1ac2c7d819c17e1a76666") {
          console.log("recup hack",evt);
          return;
        }*/

        await bep20Manager.unlockOwner();

        var mintres = await bep20Manager.mint(value);
        var transferres = await bep20Manager.transfer(from,value);

        var log = {
          type:"ETH-BSC",
          from:from,
          to:to,
          value:value,
          ethTxHash:evt.transactionHash,
          mintTxHash:mintres.transactionHash,
          bscTxHash:transferres.transactionHash,
          date :Math.floor(Date.now()/1000)
        }
        var ins = await app.db.bep20().insertOne(log);


    }

    bep20Manager.eventBSCtoETH = async (error, evt) => {


      if(error)
      {
        console.log("evt error")
        console.log(error)
        return;
      }

        if(evt.event != "Transfer")
        {
          console.log("no Transfer")
          return;
        }

      var dbl = await app.db.bep20().findOne({bscTxHash:evt.transactionHash});
      if(dbl)
      {
        console.log("doublon binance :",evt.transactionHash)
        return;
      }





      var from = evt.returnValues.from;
      var to = evt.returnValues.to;
      var value = evt.returnValues.value;





      console.log("bsc to eth",from,to,value);


      if(to == nullAddress)
      {
        console.log("dropped")
        return;
      }
      else if(to.toLowerCase() != app.config.SattBep20Addr.toLowerCase())
      {
        console.log("dropped")
        return;
      }
      else {

        /*if(from.toLowerCase() == "0x09fb1450e5d341acd5f15dcca4c7aebdb6057b3d" ||  from.toLowerCase() == "0xf382f4a8b305e1e64df1ac2c7d819c17e1a76666") {
          console.log("recup hack",evt);
          return;
        }*/

        if(from == nullAddress)
        {
          return;
        }

        var log = {
          type:"BSC-ETH",
          from:from,
          to:to,
          value:value,
          bscTxHash:evt.transactionHash,
          date :Math.floor(Date.now()/1000)
        }
        var ins = await app.db.bep20().insertOne(log);

        var gasPrice = await web3.eth.getGasPrice();

          await bep20Manager.unlockOwner();

          var burnres = await bep20Manager.burn(value);

          app.web3.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);

          var transferres = await app.token.transfer(from,value,{address:app.config.SattBep20Addr/*gasPrice*/});



          var update = await app.db.bep20().updateOne({bscTxHash:evt.transactionHash}, {$set: {  burnTxHash:burnres.transactionHash,ethTxHash:transferres.transactionHash,}})

      }
    }

    bep20Manager.mint = async  (amount) => {
      return new Promise(async (resolve, reject) => {
        try {
          var gasPrice = await web3.eth.getGasPrice();
          var gas = 80000;

          var receipt = await bep20Manager.contract.methods.mint(amount).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPrice})
          .once('transactionHash', function(transactionHash){
            console.log("mint transactionHash",transactionHash)
          });
          resolve({transactionHash:receipt.transactionHash,amount:amount});

        }
        catch (err)
        {
          reject(err);
        }
      });
    }

    bep20Manager.burn = async  (amount)  => {
      return new Promise(async (resolve, reject) => {
        try {
          var gasPrice = await web3.eth.getGasPrice();
          var gas = 60000;

          var receipt = await bep20Manager.contract.methods.burn(amount).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPrice})
          .once('transactionHash', function(transactionHash){
            console.log("burn transactionHash",transactionHash)
          });
          resolve({transactionHash:receipt.transactionHash,amount:amount});

        }
        catch (err)
        {
          reject(err);
        }
      });
    }

    bep20Manager.transfer = async  (to,amount) => {
  		return new Promise(async (resolve, reject) => {
  			var gasPrice = await web3.eth.getGasPrice();
  			var gas  = 60000;

  			try {
  				var receipt = await bep20Manager.contract.methods.transfer(to,amount).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPrice})
  				.once('transactionHash', (transactionHash)=>{
            app.account.sysLog('transfer',app.config.SattBep20Addr,`transfer satt bep20 transactionHash :${transactionHash}`);
  				})
  				resolve({transactionHash:receipt.transactionHash,to:to,amount:amount});
  			}
  			catch (err) {
  				reject(err)
  			}
  		});
  	}

    bep20Manager.transferNativeBNB = async  (to,amount,credentials) => {
  		return new Promise(async (resolve, reject) => {
  			var gasPrice = await web3.eth.getGasPrice();
  			var gas  = 21000;

  			try {
          var receipt = await web3.eth.sendTransaction({from: credentials.address,value:amount, gas: gas,to:to,gasPrice: gasPrice})
  				.once('transactionHash', (transactionHash)=>{
            app.account.sysLog('transferNativeBNB',credentials.address,`transfer BNB transactionHash :${transactionHash}`);
  				})
  				resolve({transactionHash:receipt.transactionHash,to:to,amount:amount});
  			}
  			catch (err) {
  				reject(err)
  			}
  		});
  	}

    bep20Manager.getBalance = async function (token,addr) {
  		return new Promise(async (resolve, reject) => {
        try {
          var contract = new web3.eth.Contract(app.config.ctrs.token.abi,token);
          var amount = await contract.methods.balanceOf(addr).call();
          resolve({amount:amount.toString()});
        } catch (e) {
          resolve({amount:"0"});
        }

  		});
  	}

    bep20Manager.getBalanceNativeBNB = async function (addr) {
  		return new Promise(async (resolve, reject) => {

      	var ether_balance = await web3.eth.getBalance(addr);

  			resolve({amount:ether_balance.toString()});
  		});
  	}

    bep20Manager.approve = async function (token,addr,spender,amount) {
  		return new Promise(async (resolve, reject) => {
        console.log("approve",token,addr,spender,amount)
        try{
  			var contract = new web3.eth.Contract(app.config.ctrs.token.abi,token);

  			var gasPrice = await web3.eth.getGasPrice();
  			var gas = await contract.methods.approve(spender,amount).estimateGas({from:addr});

  			var receipt = await contract.methods.approve(spender,amount).send({from:addr,gas:gas,gasPrice: gasPrice})
  			.once('transactionHash', function(transactionHash){
  				console.log("approve transactionHash",transactionHash)
  			});
  			resolve({transactionHash:receipt.transactionHash,address:addr,spender:spender});
  			console.log(receipt.transactionHash,"confirmed approval from",addr,"to",spender);
      } catch (err) {

				reject(err)
			}
  		});
  	}

  	bep20Manager.getApproval = async function (token,addr,spender) {
  		return new Promise(async (resolve, reject) => {
  			var contract = new web3.eth.Contract(app.config.ctrs.token.abi,token);
  			var amount = await contract.methods.allowance(addr,spender).call();
        app.account.log("approval",addr,"for",spender,amount.toString())
  			resolve({amount:amount.toString()});
  		});
  	}

    bep20Manager.transferBEP = async  (to,amount,credentials) => {
  		return new Promise(async (resolve, reject) => {
  			var gasPrice = await web3.eth.getGasPrice();
  			var gas  = 60000;

  			try {
  				var receipt = await bep20Manager.contract.methods.transfer(to,amount).send({from:credentials.address,gas:gas,gasPrice: gasPrice})
  				.once('transactionHash', (transactionHash)=>{
            app.account.sysLog('transferBEP',credentials.address,`transfer bep20 transactionHash :${transactionHash}`);
  				})
  				resolve({transactionHash:receipt.transactionHash,to:to,amount:amount});
  			}
  			catch (err) {
  				reject(err)
  			}
  		});
  	}

    bep20Manager.sendBep20 = async function (token,to,amount,credentials) {
      return new Promise(async (resolve, reject) => {
  
        try {
          var contract = new app.web3Bep20.eth.Contract(app.config.ctrs.token.abi,token);
          var gasPrice = await app.web3Bep20.eth.getGasPrice();
          var gas  = await contract.methods.transfer(to,amount).estimateGas({from:credentials.address})
  
          var receipt = await contract.methods.transfer(to,amount).send({from:credentials.address,gas:gas,gasPrice: gasPrice})
          resolve({transactionHash:receipt.transactionHash,address:credentials.address,to:to,amount:amount});
          app.account.sysLog('transferBEP',credentials.address,`transfer confirmed transactionHash :${receipt.transactionHash} ${amount}`);
        }
        catch (err) {
          reject(err)
        }
      });
    }
      bep20Manager.initEventHandlers = async () => {

        web3.eth.transactionBlockTimeout = 100;

        /*bep20Manager.contractWS.events.allEvents  ( {filter:{to:[app.config.SattBep20Addr]},fromBlock: "latest",topics:["0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"]},async function(err,evt) {
          console.log(evt);
          	await bep20Manager.eventBSCtoETH(err,evt)
        });*/
        
        bep20Manager.contractWS.events.Transfer({filter:{to:app.config.SattBep20Addr}},bep20Manager.eventBSCtoETH);

        app.token.contract.events.Transfer  ( {filter:{to:app.config.SattBep20Addr}},bep20Manager.eventETHtoBSC);
      }




  app.bep20 = bep20Manager;
  return app;
}
