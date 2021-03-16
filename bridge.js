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

  await app.bep20.initEventHandlers();



}
catch(e) {
  console.log(e)
}
})()
