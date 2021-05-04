(async function() {
   const cron = require('node-cron');
    try {
      var app = {};
      app = await require("./conf/config")(app);
      app = await require("./conf/const")(app);
      app = await require("./express/wallet")(app);
      app = await require("./db/db")(app);
      app = await require("./manager/bep20")(app);
      app = await require("./web3/provider")(app);
      app = await require("./web3/eth")(app);
	  app = await require("./web3/erc20")(app);
      app = await require("./web3/satt")(app);
      app = await require("./web3/initcontracts")(app);
      app = await require("./manager/account")(app);
      app = await  require("./express/https")(app);
      app = await require("./crm/crm")(app);


    cron.schedule('50 23 * * *',  () => {
		   app.wallet.BalanceUsersStats("daily");
	  });

	  cron.schedule("* * 1 * *", () =>{
		app.wallet.BalanceUsersStats("monthly");
	  });

      cron.schedule("0 0 * * 0", () =>{
		app.wallet.BalanceUsersStats("weekly");
	  });

  
    
    
    }
    catch(e) {
      console.log(e)
    }
    })()