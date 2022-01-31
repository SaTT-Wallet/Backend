(async function() {
	const cron =require('node-cron');
    try {
      var app = {};
      app = await require("./conf/config")(app);
      app = await require("./conf/const")(app);

    app = await require("./db/db")(app);
		app = await require("./crm/crm")(app);
		app = await require("./web3/provider")(app);
		app = await require("./manager/account")(app);
		app = await require("./web3/oracle")(app);
		app = await require("./web3/campaign")(app);
		app = await require("./web3/satt")(app);
		app = await require("./web3/eth")(app);
		app = await require("./web3/erc20")(app);
		app = await require("./manager/bep20")(app);

    app.token.followContract();
    

   
    
    }
    catch(e) {
      console.log(e)
    }
    })()