(async function() {

try {
  var app = {};
  app = await require("./conf/config")(app);
  app = await require("./conf/const")(app);

  app = await require("./db/db")(app);

  app = await require("./web3/provider")(app);


  var n = 0;

  var contract = new app.web3.eth.Contract(app.config.ctrs.token.abi,app.config.ctrs.token.address.mainnet);


  contract.getPastEvents("Transfer",{fromBlock:7398763,toBlock:8000000},async function (error, evt){
    console.log(error,evt)
    var from =  evt.returnValues.from;
    var to =  evt.returnValues.to;
    var value =  evt.returnValues.value;

		var tx = {
			from:from,
      to:to,
      value:value,
      token:evt.address.toLowerCase()
		};
    console.log(tx);
    var res = await app.db.indexedtx().insertOne(tx);
    console.log(res);
  
  });


}
catch(e) {
  console.log(e)
}
})()
