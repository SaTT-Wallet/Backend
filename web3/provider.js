module.exports = async function (app) {
	var net = require('net');
	var Web3 = require('web3');

/*	var options = {
		  reconnect: {
			auto: true
		  }
	};*/

	const options = {
  // Enable auto reconnection
  reconnect: {
      auto: true,
      delay: 5000, // ms
      maxAttempts: 5,
      onTimeout: false
  }
};


	app.web3 = new Web3(new Web3.providers.WebsocketProvider(app.config.web3Url,options));
	app.web3Inf  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlInf,options));
	if(app.config.web3UrlBep20.substring(0, 4) == "http")
	{
		app.web3Bep20 = new Web3(new Web3.providers.HttpProvider(app.config.web3UrlBep20,options));
	}
	else {
		app.web3Bep20  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlBep20,options));
  }


	app.web3.transactionPollingTimeout = 600;
	app.web3.transactionConfirmationBlocks = 1;

	return app;
}
