module.exports = async function (app ) {



	var deployContracts = async function () {

		var campaignAddress = await  app.campaign.deployContract();
		var oracleAddress = await app.oracleManager.deployContract();
		var r = await app.campaign.addOracle(oracleAddress);
		console.log(r);
		var r2 = await app.campaign.addToken(app.config.tokenContract);
		console.log(r2);
		var r3 = await app.oracleManager.addCampaign(campaignAddress);
		console.log("all contracts deployed");
		//followContracts();
	}


	var followContracts = async function () {

		app.campaign.followContract();
		app.oracleManager.followContract();
		app.token.followContract();
		//await app.bep20.initEventHandlers();
		app = await require("../manager/eventWatcher")(app);

	}

	// premiere execution deployContracts() et ensuite  followContracts()

	if(app.config.deploy) {
		await deployContracts();
	}
	else {
	  await	followContracts();
	}

	return app;
}
