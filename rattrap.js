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

  var n = bals2.length;

  var reservePath = fs.readFileSync("./conf/steps/campaign.json",'utf8');
  var reserveBep20 = JSON.parse(reservePath);

  app.web3Bep20.eth.accounts.wallet.decrypt([reserveBep20], app.config.SattReservePass);
var j = 0;


  var total = new BN("0");
  var div18 =  new BN("1000000000000000000");

  var deltas = await app.db.delta().find().toArray();
  for (var i = 0; i < deltas.length; i++) {
    var delta = deltas[i];
    console.log(i,deltas.length,delta.address, delta.amount.toString());
    var receipt = await app.bep20.transferBEP(delta.address,delta.amount,{address:"0x"+reserveBep20.address});
    console.log(receipt);
  }
  /*
 for (var i = 0; i < bals2.length; i++) {

   var bal2 = bals2[i];
   var delta = false;

   var bal1 = await app.db.balance().findOne({address:bal2.address});
    var amount2 = new BN(bal2.balance);
   if(!bal1) {
    delta = amount2;
  }
  else {
    var amount1 = new BN(bal1.balance);
    delta = amount2.sub(amount1);
  }

   if(delta.gt(new BN(0)))
   {
     j++;
     total = total.add(delta);
    console.log(j,bal2.address, delta.toString(),total.toString());
    await app.db.delta().insertOne({address:bal2.address,amount:delta.toString()});

    var receipt = await app.bep20.transferBEP(,,{address:"0x"+reserveBep20.address});
    console.log(receipt);

  }
  */






 console.log("done");



}




catch(e) {
  console.log(e)
}
})()
