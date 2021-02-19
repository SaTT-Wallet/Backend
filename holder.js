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

  for(var i = 0;i<evt.length;i++)
  {
    var from =  evt[i].returnValues.from;
    var to =  evt[i].returnValues.to;
    var value =  evt[i].returnValues.value;

		var tx = {
			from:from,
      to:to,
      value:value,
      token:evt[i].address.toLowerCase(),
      transactionHash:evt[i].transactionHash
		};

    var res = await app.db.indexedtx().insertOne(tx);


  }


  });


}
catch(e) {
  console.log(e)
}
})()
