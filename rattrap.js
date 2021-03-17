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

  var bals2 = await app.db.balance2().find({balance:{$ne:"0"}}).toArray();

  var n = bals2.length;

  var reservePath = fs.readFileSync("./conf/steps/campaign.json",'utf8');
  var reserveBep20 = JSON.parse(reservePath);

  app.web3Bep20.eth.accounts.wallet.decrypt([reserveBep20], app.config.SattReservePass);

  var total = new BN("0");
  var div18 =  new BN("1000000000000000000");
 for (var i = 0; i < bals2.length; i++) {

   var bal2 = bals2[i];

   var bal1 = await app.db.balance().findOne({address:bal2.address});


   var amount1 = new BN(bal1.balance);
   var amount2 = new BN(bal2.balance);


   var delta = amount2.sub(amount1);
   if(delta.gt(new BN(0)))
    console.log(bal2.address, delta.toString());

   //var receipt = await app.bep20.transferBEP(,,{address:"0x"+reserveBep20.address});
   //console.log(receipt);

 }


 console.log("done");



}




catch(e) {
  console.log(e)
}
})()
