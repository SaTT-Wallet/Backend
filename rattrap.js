(async function() {

try {
  var app = {};
  var fs = require('fs');

  var BN = require("bn.js");
  app = await require("./conf/config")(app);
  app = await require("./conf/const")(app);

  app = await require("./db/db")(app);

  app = await require("./web3/provider")(app);

  app = await require("./manager/bep20")(app);
  app = await require("./manager/account")(app);

//  var bals2 = await app.db.balance2().find({balance:{$ne:"0"}}).toArray();

  //var n = bals2.length;

  var reservePath = fs.readFileSync("./conf/steps/campaign.json",'utf8');
  var reserveBep20 = JSON.parse(reservePath);

  app.web3Bep20.eth.accounts.wallet.decrypt([reserveBep20], app.config.SattReservePass);
  var j = 0;


  var total = new BN("0");
  var div18 =  new BN("1000000000000000000");

  var deltas = await app.db.delta().find().toArray();
  for (var i = 0; i < deltas.length; i++) {
    var delta = deltas[i];

  }


}




catch(e) {
  console.log(e)
}
})()
