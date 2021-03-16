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

  var bals = await app.db.balance().find({balance:{$ne:"0"}}).toArray();
  var n = bals.length;

  var reservePath = fs.readFileSync("./conf/steps/campaign.json",'utf8');
  var reserveBep20 = JSON.parse(reservePath);

  app.web3Bep20.eth.accounts.wallet.decrypt([reserveBep20], app.config.SattReservePass);
  var total = new BN("0");
  var div18 =  new BN("1000000000000000000");
 for (var i = 6666; i < bals.length; i++) {
   var bal = (new BN (bals[i].balance)).div(new BN("20"));
   var amount = bal.div(new BN(20));
   //var amount = bal.div(div18);
   total = total.add(amount);
   console.log(i,n,bals[i].address,bal.toString(),total.toString());

   //var receipt = await app.bep20.transferBEP(bals[i].address,bal,{address:"0x"+reserveBep20.address});
   //console.log(receipt);

 }


 console.log("done");



}




catch(e) {
  console.log(e)
}
})()
