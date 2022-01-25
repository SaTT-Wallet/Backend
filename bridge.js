(async function() {

try {
  var app = {};
  var bridge = {};
  app = await require("./conf/config")(app);
  app = await require("./conf/const")(app);

  app = await require("./db/db")(app);
  //app = await require("./web3/provider")(app);
console.log(app);
  const options = {
    timeout: 30000, 
   

    clientConfig: {
      // Useful if requests are large
      maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

      // Useful to keep a connection alive
     // keepalive: true,
     // keepaliveInterval: 60000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
       // delay: 5000, // ms
       // maxAttempts: 5,
       // onTimeout: false
    }
};


  var Web3 = require('web3');

  //app.web3 = new Web3(new Web3.providers.WebsocketProvider(app.config.web3Url));
  app.web3 = new Web3(new Web3.providers.WebsocketProvider(app.config.ethBridge,options/*"wss://ropsten.infura.io/ws/v3/0fab761c6a7f4934a892dddebf80f8e0"*/));
  
 // app.web3Bep20Websocket  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlBep20Websocket));
  //app.web3Bep20 = app.web3Bep20Websocket;
  //app.web3Bep20 = new Web3(new Web3.providers.HttpProvider(app.config.web3UrlBep20));

  app = await require("./web3/satt")(app);

  

  app = await require("./manager/bep20")(app);
  app = await require("./manager/account")(app);

  const cron = require('node-cron');
  

  var nullAddress = "0x0000000000000000000000000000000000000000";
 

  bridge.getCronCtrs =  () => {
    var web3eth = new Web3(new Web3.providers.WebsocketProvider(app.config.web3Url,options));
    var web3Bsc  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlBep20Websocket,options));

    var ctrEth = new web3eth.eth.Contract(app.config.ctrs.token.abi,config.testnet?app.config.ctrs.token.address.mainnet:app.config.ctrs.token.address.testnet);
    var ctrBsc = new web3Bsc.eth.Contract(app.config.ctrs.bep20.abi,config.testnet?app.config.ctrs.bep20.address.mainnet:app.config.ctrs.bep20.address.testnet);

    return {web3eth,web3Bsc,ctrEth,ctrBsc};
  }

  bridge.initEventHandlers = async () => {

    bridge.contractEvtEth = new app.web3.eth.Contract(app.config.ctrs.token.abi,app.config.ctrs.token.address.mainnet);
   // bridge.contractEvtBsc = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.bep20.abi,app.config.ctrs.bep20.address.mainnet);
    
    //bridge.contractEvtBsc.events.Transfer({filter:{to:app.config.SattBep20Addr}},bridge.eventBSCtoETH);
    bridge.contractEvtEth.events.Transfer({filter:{to:app.config.SattBep20Addr}},bridge.eventETHtoBSC);
  }

  bridge.unlockOwnerBsc = async () => {
    app.web3Bep20Websocket.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);
  }

  

  bridge.eventETHtoBSC = async (error, evt) => {

    console.log("eventETHtoBSC")

    if(error) {
      console.log(error);
      return;
    }

      var dbl = await app.db.bep20().findOne({ethTxHash:evt.transactionHash});

      if(dbl)
      {
        return;
      }
      
      var to = evt.returnValues.to;
      var value = evt.returnValues.value;
      var from = evt.returnValues.from;

      /*if(from.toLowerCase() == "0x09fb1450e5d341acd5f15dcca4c7aebdb6057b3d" ||  from.toLowerCase() == "0xf382f4a8b305e1e64df1ac2c7d819c17e1a76666") {
        console.log("recup hack",evt);
        return;
      }*/


      var log = {
        type:"ETH-BSC",
        from:from,
        to:to,
        value:value,
        status:"pending",
        ethTxHash:evt.transactionHash,
        date :Math.floor(Date.now()/1000)
      }
      var ins = await app.db.bep20().insertOne(log);

  }


  bridge.eventBSCtoETH = async (error, evt) => {
    if(error)
    {
      console.log("evt error")
      console.log(error)
      return;
    }

    var dbl = await app.db.bep20().findOne({bscTxHash:evt.transactionHash});
    if(dbl)
    {
      return;
    }

    var from = evt.returnValues.from;
    var to = evt.returnValues.to;
    var value = evt.returnValues.value;

    
     if(from == nullAddress ||to == nullAddress || to.toLowerCase() != app.config.SattBep20Addr.toLowerCase())
    {
      console.log("dropped")
      return;
    }
    else {

      /*if(from.toLowerCase() == "0x09fb1450e5d341acd5f15dcca4c7aebdb6057b3d" ||  from.toLowerCase() == "0xf382f4a8b305e1e64df1ac2c7d819c17e1a76666") {
        console.log("recup hack",evt);
        return;
      }*/

      var log = {
        type:"BSC-ETH",
        from:from,
        to:to,
        value:value,
        bscTxHash:evt.transactionHash,
        status:"pending",
        date :Math.floor(Date.now()/1000)
      }
      var ins = await app.db.bep20().insertOne(log);

    }
  }

  bridge.bscToEth = async (ctrs,to,value) => {

   
    ctrs.web3Bsc.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);
    ctrs.web3eth.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);

    var gasPriceBsc = await ctrs.web3Bsc.eth.getGasPrice();
    var gasPriceEth = await ctrs.web3eth.eth.getGasPrice();
    var gas = 60000;

    var receiptBurn = await ctrs.ctrBsc.methods.burn(value).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPriceBsc})
    var receiptTransfer = await ctrs.ctrEth.methods.transfer(to,value).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPriceEth})

    
    return {burnTxHash:receiptBurn.transactionHash,ethTxHash:receiptTransfer.transactionHash}

  }

  bridge.ethToBsc = async (ctrs,to,value) => {

    ctrs.web3Bsc.eth.accounts.wallet.decrypt([app.config.sattBep20], app.config.SattReservePass);

    var gasPriceBsc = await ctrs.web3Bsc.eth.getGasPrice();
    var gas = 60000;

    var receiptMint = await ctrs.ctrBsc.methods.mint(value).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPriceBsc})
    var receiptTransfer = await ctrs.ctrBsc.methods.transfer(to,value).send({from:app.config.SattBep20Addr,gas:gas,gasPrice: gasPriceBsc})

    return {mintTxHash:receiptMint.transactionHash,bscTxHash:receiptTransfer.transactionHash}


  }

  bridge.poll = async () => {
    var ctrs =  bridge.getCronCtrs(); 
    var txs = await app.db.bep20().find({status:"pending"}).toArray();
    for(var i=0;i<txs.length;i++) {
      var tx = txs[i];
      if(tx.type == "BSC-ETH") {
        var hashes = await bridge.bscToEth(ctrs,tx.from,tx.value);
        await app.db.bep20().updateOne({_id:tx._id},{$set:{status:"ok", burnTxHash:hashes.burnTxHash,ethTxHash:hashes.ethTxHash}});
      }
      /* if(tx.type == "ETH-BSC") {
        var hashes = await bridge.ethToBsc(ctrs,tx.from,tx.value);
        await app.db.bep20().updateOne({_id:tx._id},{$set:{status:"ok", mintTxHash:hashes.mintTxHash,bscTxHash:hashes.bscTxHash}});
      }*/
    }

  }



  await bridge.initEventHandlers();

  
    cron.schedule('*/10 * * * *', async () => {
      await bridge.poll();
    });


}
catch(e) {
  console.log(e)
}
})()
