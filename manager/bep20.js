module.exports = async function (app) {

  	var bep20Manager = {};

    var nullAddress = "0x0000000000000000000000000000000000000000";

    bep20Manager.contract = new app.web3Bep20.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.mainnet);


    bep20Manager.unlockOwner = async () => {
      app.web3Bep20.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);
    }

    bep20Manager.eventETHtoBSC = async (error, evt) => {
        var to = evt.returnValues.to;
        var value = evt.returnValues.value;
        var from = evt.returnValues.from;

        await bep20Manager.unlockOwner();

        var mintres = await bep20Manager.mint(value);
        var transferres = await bep20Manager.transfer(to,value);

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

      var from = evt.returnValues.from;
      var to = evt.returnValues.to;
      var value = evt.returnValues.value;

      if(from == nullAddress)
      {
        return;
      }

        await bep20Manager.unlockOwner();

        var burnres = await bep20Manager.burn(value);

        app.web3.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);

        var transferres = await app.token.transfer(to,value,{from:app.config.SattBep20Addr});

        var log = {
          type:"BSC-ETH",
          from:from,
          to:to,
          value:value,
          bscTxHash:evt.transactionHash,
          burnTxHash:burnres.transactionHash,
          ethTxHash:transferres.transactionHash,
          date :Math.floor(Date.now()/1000)
        }
        var ins = await app.db.bep20().insertOne(log);
    }

    bep20Manager.mint = async  (amount) => {
      return new Promise(async (resolve, reject) => {
        try {
          var gasPrice = await app.web3Bep20.eth.getGasPrice();
          var gas = 60000;

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
          var gasPrice = await app.web3Bep20.eth.getGasPrice();
          var gas = 60000;

          var receipt = await bep20Manager.contract.methods.burn(amount).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPrice})
          .once('transactionHash', function(transactionHash){
            console.log("web3UrlInf transactionHash",transactionHash)
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
  			var gasPrice = await app.web3Bep20.eth.getGasPrice();
  			var gas  = 60000;

  			try {
  				var receipt = await bep20Manager.contract.methods.transfer(to,amount).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPrice})
  				.once('transactionHash', function(transactionHash){
  					console.log("transfer satt bep20 transactionHash",transactionHash)
  				})
  				resolve({transactionHash:receipt.transactionHash,to:to,amount:amount});
  			}
  			catch (err) {
  				reject(err)
  			}
  		});
  	}


      bep20Manager.initEventHandlers =  () => {
        bep20Manager.contract.events.Transfer  ( {filter:{to:app.config.SattBep20Addr}},bep20Manager.eventBSCtoETH);
        app.token.contract.events.Transfer  ( {filter:{to:app.config.SattBep20Addr}},bep20Manager.eventETHtoBSC);
      }




  app.bep20 = bep20Manager;
  return app;
}
