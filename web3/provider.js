module.exports = async function (app) {
	var net = require('net');
	var Web3 = require('web3');




const options = {
    timeout: 30000, 
   

    clientConfig: {
      // Useful if requests are large
      maxReceivedFrameSize: 100000000,   // bytes - default: 1MiB
      maxReceivedMessageSize: 100000000, // bytes - default: 8MiB

      // Useful to keep a connection alive
      keepalive: true,
      keepaliveInterval: 60000 // ms
    },

    // Enable auto reconnection
    reconnect: {
        auto: true,
        delay: 5000, // ms
        maxAttempts: 5,
        onTimeout: false
    }
};


	app.web3 = new Web3(new Web3.providers.WebsocketProvider(app.config.web3Url,options));
	//app.web3Inf  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlInf,options));

	

	app.web3Bep20 = new Web3(new Web3.providers.HttpProvider(app.config.web3UrlBep20,options));
  app.web3Bep20Websocket = false;

  if(app.config.web3UrlBep20Websocket) {
		app.web3Bep20Websocket  = new Web3(new Web3.providers.WebsocketProvider(app.config.web3UrlBep20Websocket,options));

		app.web3Bep20Websocket.eth.transactionBlockTimeout = 200;
		app.web3Bep20Websocket.transactionConfirmationBlocks = 1;
  }


    app.web3.eth.transactionBlockTimeout = 200;
	app.web3.transactionConfirmationBlocks = 1;

	return app;
}
