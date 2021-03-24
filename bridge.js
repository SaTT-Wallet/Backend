(async function() {

try {
  var app = {};
  app = await require("./conf/config")(app);
  app = await require("./conf/const")(app);

  app = await require("./db/db")(app);

  app = await require("./web3/provider")(app);

  app = await require("./web3/satt")(app);

  app = await require("./manager/bep20")(app);
  app = await require("./manager/account")(app);

  app.token.followContract();

  // test doublons
  await bep20Manager.eventETHtoBSC(false,{transactionHash:"0xdafd0bbef6eaebcdcbb3178191ef38c844d728a60460d8c6f67a7ccb6101b02f"});
  // test doublons

  bep20Manager.eventETHtoBSC

  //await app.bep20.initEventHandlers();

}
catch(e) {
  console.log(e)
}
})()
