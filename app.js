
(async function() {

	try {



		var fs = require('fs');

		var express = require('express')
		var app = express();
		var cors = require('cors')
		require('dotenv').config()

        var bodyParser = require('body-parser');
        app.use(bodyParser.json({limit: '4mb'}));
        app.use(bodyParser.urlencoded({limit: '4mb', extended: true}));
		app.use(cors())

        
		app.use('/assets', express.static('public'))
		app.set('view engine', 'ejs');
		app = await require("./conf/config")(app);
		app = await require("./conf/const")(app);
		var https = require('https');
	
		var httpServer = https.createServer({
		  key: fs.readFileSync(app.config.SSLKeyFile,'utf8'),
		  cert: fs.readFileSync(app.config.SSLCertFile,'utf8')
		}, app);
		
		httpServer.listen(app.config.listenPort, function(){
			console.log('io listening on *:'+app.config.listenPort);
		});
        
		const swaggerJSDoc = require('swagger-jsdoc');
		const swaggerUi = require('swagger-ui-express');
		const swaggerDefinition = {
			openapi: '3.0.0',
			info: {
			  title: 'API for node-satt' ,
		  	  customCss: '.swagger-ui .topbar { display: none }'
			},
			components: {
				securitySchemes: {
				  bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				  }
				}
			  },
			  security: [{
				bearerAuth: []
			  }]
		  };
		  var cssOptions = {
			customCss: `
			.topbar-wrapper img {content:url(/assets/SaTT.png); width:50px; height:auto;}`,
			customSiteTitle: "SaTT",
			customfavIcon:'/assets/SaTT-noire.png'
		  };
		const options = {
		swaggerDefinition,
		apis: [
			 './routes/*.js']
		};
		const swaggerSpec = swaggerJSDoc(options);
		app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, cssOptions));

		// app = await require("./db/db")(app);

		app = await require("./manager/oracle")(app);
		app = await require("./web3/provider")(app);
		app = await require("./manager/notification")(app);
		app = await require("./manager/account")(app);
		app = await require("./manager/i18n")(app);




		const loginroutes= require('./routes/login.routes')
		const walletroutes= require('./routes/wallet.routes')
		const profileroutes= require('./routes/profile.routes')
        const campaignroutes= require('./routes/campaign.routes')


		app.use('/auth', loginroutes);
		app.use('/wallet', walletroutes);
		app.use('/profile', profileroutes);
        app.use('/campaign', campaignroutes);

		


     	app = await require("./web3/oracle")(app);
		app = await require("./web3/campaign")(app);
		app = await require("./web3/graph")(app);
		app = await require("./web3/satt")(app);
		app = await require("./web3/eth")(app);
		app = await require("./web3/erc20")(app);
		app = await require("./manager/bep20")(app);




		app.use(function(req, res, next) {
		  res.header("content-type","application/json");
		  res.header("Access-Control-Allow-Origin", "*");
		  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");




		  next();
		});
		app = await require("./web3/initcontracts")(app);
	} catch (e) {
		console.log(e.stack);
	} finally {

	}

})();
