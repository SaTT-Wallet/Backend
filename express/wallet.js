const { async } = require('hasha');
var Big = require('big.js');

module.exports = function (app) {
	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )
	var BN = require('bn.js');
    const cron = require('node-cron');
	var rp = require('request-promise');
	const xChangePricesUrl = app.config.xChangePricesUrl;


	app.get('/v2/erc20/:token/balance/:addr',async function(req, response) {

			var token = req.params.token;
			var addr = req.params.addr;
			var balance = await app.erc20.getBalance(token,addr);

			response.end(JSON.stringify({token:token,balance:balance}));
	})

	app.get('/v2/bep20/:token/balance/:addr',async function(req, response) {

			var token = req.params.token;
			var addr = req.params.addr;

			var balance = await app.bep20.getBalance(token,addr);

			response.end(JSON.stringify({token:token,balance:balance}));
	})

     /*
     @Url : /v2/balances/:tokens/:addr'
     @description: calculate Total balance of each token
     @parameters :
     addr : wallet address of user
     tokens : accept one more contract address
     @response : balance of each contract address (Token)
     */

	app.get('/v2/balances/:tokens/:addr',async function(req, response) {
		try{
			var tokens = req.params.tokens.split(",");
			var addr = req.params.addr;
			var balances={}
			var token_info=app.config.Tokens

			for(var i=0;i<tokens.length;i++){
				let name;
				let network;
				for(const T_name in token_info){
					if(token_info[T_name]['contract']==tokens[i]){
						name=T_name
						network=token_info[T_name].network
					}
				}
				if(network=="ERC20"){
					balance = await app.erc20.getBalance(tokens[i],addr);
				   balances[name]=balance['amount']
					}else{
					balance = await app.bep20.getBalance(tokens[i],addr);
				   balances[name]=balance['amount']
					}
			}
		    response.end(JSON.stringify({balance:balances}));

		}catch(err){
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

})

/*
     @Url : /v2/total_balance'
     @description: calculate Total balance of a user
     @parameters :
     header : access token
     @response : Total Balance Object
     */

    app.get('/v2/total_balance', async (req, res) =>{

		try {
			const Fetch_crypto_price = {
				method: 'GET',
				uri: xChangePricesUrl,
				json: true,
				gzip: true
			  };
		  let token = req.headers["authorization"].split(" ")[1];
		  const auth = await app.crm.auth(token);
		  const id = auth.id;
		  let Crypto = await rp(Fetch_crypto_price);
		  let date = Math.round(new Date().getTime()/1000);
		  Total_balance = await app.account.getBalanceByUid(id, Crypto);

		//   const user =  await app.db.sn_user().findOne({_id : id}) ;
		//   if(user.daily && user.daily[0].Date !== date){
		// 	user.daily.unshift({Date : date, Balance : Total_balance.Total_balance});
		// 	if(user.daily.length > 7){user.daily.pop()}
		// 	delete user._id
		// 	await app.db.sn_user.updateOne({_id : id}, {$set: user})
		//   }
		
		  res.end(JSON.stringify({Total_balance})).status(201);

		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});

//conmatibilité
	app.get('/v2/total_balance/:addr/:token', async (req, res) =>{

	try {
		const Fetch_crypto_price = {
			method: 'GET',
			uri: xChangePricesUrl,
			json: true,
			gzip: true
			};

		let token = req.params.token;
		const auth = await app.crm.auth(token);
		const id = auth.id;
		let Crypto = await rp(Fetch_crypto_price);
		Total_balance = await app.account.getBalanceByUid(id, Crypto);
		res.end(JSON.stringify({Total_balance})).status(201);

	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
});

	app.get('/v2/mywallet/:token', async function(req, response) {
		try {
			var res = await app.crm.auth( req.params.token);

			var count = await app.account.hasAccount(res.id);
			var ret = {err:"no_account"};
			if(count)
			{
				var ret = await app.account.getAccount(res.id);
			}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});
/**
 * @swagger
 * /v2/newallet:
 *   get:
 *     summary: create password wallet {deprecated} , new api:/v3/newallet.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:account_exists OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v2/newallet/:token/:pass', async function(req, response) {

		var pass = req.params.pass;

		try {

			var res = await app.crm.auth( req.params.token);
			var count = await app.account.hasAccount(res.id);
			console.log("newwallet",res.id,req.connection.remoteAddress);
			var ret = {err:"account_exists"};
			if(!count)
			{
				var ret = await app.account.createAccount(res.id,pass);
			}
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});
/**
 * @swagger
 * /v3/newallet:
 *   get:
 *     summary: create password wallet.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:account_exists OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v3/newallet', async function(req, response) {

		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];

		try {

			var res = await app.crm.auth(token);
			var count = await app.account.hasAccount(res.id);
			console.log("newwallet",res.id,req.connection.remoteAddress);
			var ret = {err:"account_exists"};
			if(!count)
			{
				var ret = await app.account.createAccount(res.id,pass);
			}
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});
/**
 * @swagger
 * /v2/printseed/:token/:pass:
 *   get:
 *     summary: export Mnemo {deprecated} , new api:/v3/printseed.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:no_exists OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v2/printseed/:token/:pass', async function(req, response) {

		var pass = req.params.pass;

		try {

			var res = await app.crm.auth( req.params.token);

			var count = await app.account.hasAccount(res.id);
			var ret = {err:"no_exists"};
			if(count)
			{
				var ret = await app.account.printSeed(res.id,pass);
			}
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});
/**
 * @swagger
 * /v3/printseed:
 *   get:
 *     summary: export Mnemo.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:no_exists OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v3/printseed', async function(req, response) {

		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {

			var res = await app.crm.auth(token);

			var count = await app.account.hasAccount(res.id);
			var ret = {err:"no_exists"};
			if(count)
			{
				var ret = await app.account.printSeed(res.id,pass);
			}
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});





	app.post('/v2/newallet2', async function(req, response) {

		var pass = req.body.pass;

		try {


			var res = await app.crm.auth( req.body.token);

			var count = await app.account.hasAccount(res.id);
			console.log("newwallet",res.id,req.connection.remoteAddress);
			var ret = {err:"account_exists"};
			if(!count)
			{
				var ret = await app.account.createSeed(res.id,pass);
			}
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});


	app.post('/v2/recover', async function(req, response) {

		var pass = req.body.pass;
		var oldpass = req.body.oldpass;
		var wordlist = req.body.wordlist;

		try {

			var res = await app.crm.auth( req.body.token);

			var count = await app.account.hasAccount(res.id);
			var ret = {err:"no_account"};
			if(count)
			{
				var ret = await app.account.recover(res.id,wordlist,oldpass,pass);
			}
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});

	app.get('/v2/newalletbtc/:token/:pass', async function(req, response) {

		var pass = req.params.pass;

		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = {err:"no_account"};

			var acc = await app.account.getAccount(res.id)
			if(acc)
			{

				if(acc.version == 1) {
				  ret = await app.account.createBtcAccount(res.id,pass);
				}
				if(acc.version == 2) {
					ret = await app.account.recoverBtc(res.id,pass);
				}
			}

			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	});

	app.get('/v3/newalletbtc', async function(req, response) {

		var pass=req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = {err:"no_account"};

			var acc = await app.account.getAccount(res.id)
			if(acc)
			{

				if(acc.version == 1) {
				  ret = await app.account.createBtcAccount(res.id,pass);
				}
				if(acc.version == 2) {
					ret = await app.account.recoverBtc(res.id,pass);
				}
			}

			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	});

	app.get('/v2/resetpass/:token/:pass/:newpass', async function(req, response) {

		var pass = req.params.pass;

		try {
			var res = await app.crm.auth( req.params.token);

			var ret = {err:"no_account"};
			var count = await app.account.hasAccount(res.id);
			if(count)
			{
				var ret = await app.account.changePass(res.id,pass,req.params.newpass);
			}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});

	app.get('/v3/resetpass', async function(req, response) {

		var pass=req.body.pass;
		var newpass=req.body.newpass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);

			var ret = {err:"no_account"};
			var count = await app.account.hasAccount(res.id);
			if(count)
			{
				var ret = await app.account.changePass(res.id,pass,newpass);
			}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});

	app.get('/v2/export/:pass/:token',async function(req, response) {
		var pass = req.params.pass;
		response.attachment();

		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.account.exportkey(res.id,pass);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v3/export',async function(req, response) {
		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		response.attachment();

		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.account.exportkey(res.id,pass);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v2/exportbtc/:pass/:token', async function(req, response) {
		var pass = req.params.pass;
		response.attachment();

		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.account.exportkeyBtc(res.id,pass);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v3/exportbtc', async function(req, response) {
		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		response.attachment();

		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.account.exportkeyBtc(res.id,pass);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v2/transfer/:token/:pass/:to/:val/:gas/:estimate/:gasprice', async function(req, response) {
		var pass = req.params.pass;
		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = req.params.to;
			var amount = req.params.val;
			var ret = await app.token.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {

			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}


	})

	app.get('/v3/transfer/:to/:val/:gas/:estimate/:gasprice', async function(req, response) {
		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];

		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = req.params.to;
			var amount = req.params.val;
			var ret = await app.token.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {

			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}


	})
/**
 * @swagger
 * /v2/transferether/{token}/{pass}/{to}/{val}/{gas}/{estimate}/{gasprice}:
 *   get:
 *     summary: transfer ether {deprecated}.
 *     description: parametres acceptées :no parameters .
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v2/transferether/:token/:pass/:to/:val/:gas/:estimate/:gasprice', async function(req, response) {
		var pass = req.params.pass;
		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = req.params.to;
			var amount = req.params.val;
			var ret = await app.cryptoManager.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})
/**
 * @swagger
 * /v3/transferether/{to}/{val}:
 *   get:
 *     summary: transfer ether .
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR data
 *       "500":
 *          description: error:error message
 */
	app.get('/v3/transferether/:to/:val', async function(req, response) {
		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = req.params.to;
			var amount = req.params.val;
			var ret = await app.cryptoManager.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})
/**
 * @swagger
 * /v2/transferbtc/{token}/{pass}/{to}/{val}:
 *   get:
 *     summary: transfer btc .
 *     description: no parameters.
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR hash
 *       "500":
 *          description: error:error message
 */
	app.get('/v2/transferbtc/:token/:pass/:to/:val', async function(req, response) {

		var pass = req.params.pass;
		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			var hash = await app.cryptoManager.sendBtc(res.id,pass, req.params.to,req.params.val);
			response.end(JSON.stringify({hash:hash}));

		} catch (err) {
			console.log(err.message?err.message:err.error);
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})
/**
 * @swagger
 * /v3/transferbtc/{to}/{val}:
 *   get:
 *     summary: transfer btc .
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR hash
 *       "500":
 *          description: error:error message
 */
	app.get('/v3/transferbtc/:to/:val', async function(req, response) {

		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			var hash = await app.cryptoManager.sendBtc(res.id,pass, req.params.to,req.params.val);
			response.end(JSON.stringify({hash:hash}));

		} catch (err) {
			console.log(err.message?err.message:err.error);
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v2/transferbyuid/:token/:pass/:uid/:val/:gas/:estimate/:gasprice', async function(req, response) {

		var pass = req.params.pass;
		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.params.uid);
			var amount = req.params.val;
			var ret = await app.token.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end(err.message?err.message:err.error);
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}


	})

	app.get('/v3/transferbyuid/:uid/:val/:gas/:estimate/:gasprice', async function(req, response) {

		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.params.uid);
			var amount = req.params.val;
			var ret = await app.token.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end(err.message?err.message:err.error);
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}


	})


	app.get('/v2/transferetherbyuid/:token/:pass/:uid/:val/:gas/:estimate/:gasprice', async function(req, response) {
		var pass = req.params.pass;
		try {
			var res = await app.crm.auth( req.params.token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.params.uid);
			var amount = req.params.val;
			var ret = await app.cryptoManager.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v3/transferetherbyuid/:uid/:val/:gas/:estimate/:gasprice', async function(req, response) {
		var pass = req.body.pass;
		var token = req.headers["authorization"].split(" ")[1];
		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.params.uid);
			var amount = req.params.val;
			var ret = await app.cryptoManager.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.get('/v2/receivewalleteth/:token', async function(req, response) {

		try {
			var res = await app.crm.auth( req.params.token);
			var addr = await app.cryptoManager.getReceiveEthWallet(res.id);
			response.end(JSON.stringify({address:addr}));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	app.get('/v2/receivewalletbtc/:token', async function(req, response) {

		try {
			var res = await app.crm.auth( req.params.token);
			var addr = await app.cryptoManager.getReceiveBtcWallet(res.id);
			response.end(JSON.stringify({address:addr}));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})



	app.get('/v2/confirmselleth/:token',async function(req, response) {

		try {
			var res = await app.crm.auth( req.params.token);
			var res2 = await app.cryptoManager.receiveEthWallet(res.id);
			response.end(JSON.stringify(res2));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	})

	app.get('/v2/confirmsellbtc/:token',async function(req, response) {
		try {
			var res = await app.crm.auth( req.params.token);
			var res2 = await app.cryptoManager.receiveBtcWallet(res.id);
			response.end(JSON.stringify(res2));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	app.get('/v2/ethpaylist', async function(req, response) {
		var res = await app.cryptoManager.listEthPayers();
		response.end(JSON.stringify(res));
	})

	app.get('/v2/btcpaylist', async function(req, response) {
		var res = await app.cryptoManager.listBtcPayers();
		response.end(JSON.stringify(res));
	})

	app.get('/v2/ethreceive/:token/:fbid', async function(req, response) {

		try {
			var res = await app.crm.auth( req.params.token);
			if(res.id != app.config.appAdminV2)
			{
				response.end('{"error":"admin required"}');
			}

			var ret = await app.cryptoManager.receiveEthWallet(req.params.fbid);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	})
	app.get('/v2/btcreceive/:token/:fbid', async function(req, response) {

		try {
			var res = await app.crm.auth( req.params.token);
			if(res.id != app.config.appAdminV2)
			{
				response.end('{"error":"admin required"}');
			}

			var ret = await app.cryptoManager.receiveBtcWallet(req.params.fbid);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})



	app.get('/balance/:addr',async function(req, response) {

			var balance = await app.web3.eth.getBalance(req.params.addr);
			var count = await app.web3.eth.getTransactionCount(req.params.addr);
			var balance2 = await app.token.contract.methods.balanceOf(req.params.addr).call();
			response.end(JSON.stringify({eth:balance,count:count,satt:balance2.toString()}));
	})

	app.get('/gasprice', async function(req, response) {
			var gasPrice = await app.web3.eth.getGasPrice();
			response.end(JSON.stringify({gasPrice:(gasPrice/1000000000)}));
	})

	app.get('/bnb/gasprice', async function(req, response) {
			var gasPrice = await app.web3Bep20.eth.getGasPrice();
			response.end(JSON.stringify({gasPrice:(gasPrice/1000000000)}));
	})

	app.get('/supply', async function(req, response) {

		var balance = await app.token.contract.methods.balanceOf(app.config.SattReserve).call();
		response.end(JSON.stringify({balance:(balance/1000000000000000000),supply:"1150000000"}));
	})

	app.get('/supply2', async function(req, response) {

		var balance3 = await app.token.contract.methods.balanceOf(app.config.SattStep3).call();

		var balance4 = await app.token.contract.methods.balanceOf(app.config.SattStep4).call();
		balance3 = balance3 /1000000000000000000;
		balance4 = balance4 /1000000000000000000;
		response.end(JSON.stringify({balance: (balance3+balance4),supply:"5650000000"}));
	})

	app.get('/checkaccount/:addr', async function(req, response) {
		var res = await app.account.getSubscription(req.params.addr);
		response.end(JSON.stringify(res));
	})

	app.get('/v2/txs/:account', async function(req, response) {

		var res = await app.account.getTxsFullSatt(req.params.addr);
		console.log("holders",res.length)
		response.end(JSON.stringify(res));
	})

	app.get('/txs/:account/:token', async function(req, response) {

		var res = await app.account.getTxs(app.web3.utils.toChecksumAddress(req.params.account),req.params.token);
		response.end(JSON.stringify(res));
	})

	app.get('/holders/:token', async function(req, response) {

		var res = await app.account.getHolders(req.params.token);
		var res = "";
		response.end(res);
	})

	app.get('/supply/total', async function(req, response) {

		var balance = await app.token.contract.methods.balanceOf("0x000000000000000000000000000000000000dead").call();
		var bn18 =  new BN("1000000000000000000");
		var max =  new BN("20000000000");
		var burn = (new BN(balance)).div(bn18);
		//console.log((max.sub(burn)).toString());
		response.end((max.sub(burn)).toString());
	})

	app.get('/supply/circulating', async function(req, response) {

		var balanceburn = await app.token.contract.methods.balanceOf("0x000000000000000000000000000000000000dead").call();
		var balanctraesury = await app.token.contract.methods.balanceOf("0xab8199eba802e7e6634d4389bf23999b7ae6b253").call();
		var balanceshare = await app.token.contract.methods.balanceOf("0x22d5d08bc8006d27cc47728998b91bc1b164c896").call();
		var balanceteam = await app.token.contract.methods.balanceOf("0xe70ea3697996f6b6dcaf9f3202d40020433f5541").call();
		var balancencent = await app.token.contract.methods.balanceOf("0xa32b828b031f383781f8b7c46b3529bfe422a0cd").call();
		var balancebonus = await app.token.contract.methods.balanceOf("0xf117674e1890b56be87db3b0dc12750023ee69d9").call();
		var balancebounty = await app.token.contract.methods.balanceOf("0xa6e8db5b6a78f9edfd7c868abe23a23b60ef3092").call();
		var balancebounty = await app.token.contract.methods.balanceOf("0x66290b22df130468f08bfffed04252f3b0cf4e40").call();
		var bn18 =  new BN("1000000000000000000");
		var max =  new BN("20000000000");

		max.isub((new BN(balanceburn)).div(bn18));
		max.isub((new BN(balanctraesury)).div(bn18));
		max.isub((new BN(balanceshare)).div(bn18));
		max.isub((new BN(balanceteam)).div(bn18));
		max.isub((new BN(balancencent)).div(bn18));
		max.isub((new BN(balancebonus)).div(bn18));
		max.isub((new BN(balancebounty)).div(bn18));

		response.end(max.toString());
	})


	app.get('/factor/:id',async function(req, response) {


		try {
			response.set('Content-Type', 'text/html');

			//var pass = req.body.pass;

			//var res = await app.crm.auth( req.body.access_token);
			//var cred = await app.account.unlock(res.id,pass);
			var data = await app.account.create2FA(req.params.id);
			response.end("<img src='"+data+"'>");
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})


	app.get('/factorvrfy/:id/:code',async function(req, response) {


		try {

			//var pass = req.body.pass;

			//var res = await app.crm.auth( req.body.access_token);
			//var cred = await app.account.unlock(res.id,pass);
			var data = await app.account.verify2FA(req.params.id,req.body.code);
			response.end(data);
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})




	app.get('/v2/erc20/:token/approval/:addr/:spender',async function(req, response) {

			var token = req.params.token;
			var spender = req.params.spender;
			//var allowance = await app.erc20.getApproval(token,req.params.addr,spender);
			var allowance = {amount:"10000000000000000000000000000"};
			response.end(JSON.stringify({token:token,allowance:allowance,spender:spender}));
	})
	/**
 * @swagger
 * /v2/erc20/transfer:
 *   post:
 *     summary: transfer erc20 {deprecated}.
 *     description: parametres acceptées :body{transferParameter}.
 *     parameters:
 *       - name: token
 *         description: tokenERC20.
 *       - name: to
 *         description: transfert to.
 *       - name: pass
 *         description: password wallet.
 *       - name: amount
 *         description: amount to transfer
 *       - name: access_token
 *         description: access_token
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */
	app.post('/v2/erc20/transfer',async function(req, response) {

		try {

			var token = req.body.token;
			var to = req.body.to;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var res = await app.crm.auth( req.body.access_token);

			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var ret = await app.erc20.transfer(token,to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})


	/**
 * @swagger
 * /v3/erc20/transfer:
 *   post:
 *     summary: transfer erc20.
 *     description: parametres acceptées :body{transferParameter} , headers{headers}.
 *     parameters:
 *       - name: token
 *         description: tokenERC20.
 *       - name: to
 *         description: transfert to.
 *       - name: pass
 *         description: password wallet.
 *       - name: amount
 *         description: amount to transfer
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR hash
 *       "500":
 *          description: error:error message
 */
	app.post('/v3/erc20/transfer',async function(req, response) {

		try {
			let token = req.headers["authorization"].split(" ")[1];
			var tokenERC20 = req.body.token;
			var to = req.body.to;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var res = await app.crm.auth(token);

			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var ret = await app.erc20.transfer(tokenERC20,to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	app.post('/v2/erc20/allow',async function(req, response) {

		try {

			var token = req.body.token;
			var spender = req.body.spender;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var res = await app.crm.auth( req.body.access_token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var ret = await app.erc20.approve(token,cred.address,spender,amount);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})

	/////////////////
	app.get('/v2/bep20/:token/approval/:addr/:spender',async function(req, response) {



			var token = req.params.token;
			var spender = req.params.spender;
			if(spender == app.config.ctrs.campaign.address.mainnet || spender == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				spender = app.config.ctrs.campaignBep20.address.mainnet;
			}
			if(spender == app.config.ctrs.campaign.address.testnet)
			{
				spender = app.config.ctrs.campaignBep20.address.testnet;
			}
			var allowance = await app.bep20.getApproval(token,req.params.addr,spender);

			response.end(JSON.stringify({token:token,allowance:allowance,spender:spender}));
	})
	/**
 * @swagger
 * /v3/erc20/transfer:
 *   post:
 *     summary: transfer erc20.
 *     description: parametres acceptées :body{transferParameter} , headers{headers}.
 *     parameters:
 *       - name: token
 *         description: tokenERC20.
 *       - name: to
 *         description: transfert to.
 *       - name: pass
 *         description: password wallet.
 *       - name: amount
 *         description: amount to transfer
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR hash
 *       "500":
 *          description: error:error message
 */
	app.post('/v2/bep20/transfer',async function(req, response) {

		try {

			var token = req.body.token;
			var to = req.body.to;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var res = await app.crm.auth( req.body.access_token);

			var cred = await app.account.unlockBSC(res.id,pass);
			cred.from_id = res.id;
			var ret = await app.bep20.transferBEP(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lockBSC(cred.address);
		}
	})


		/**
 * @swagger
 * /v3/bep20/transfer:
 *   post:
 *     summary: transfer bep20.
 *     description: parametres acceptées :body{transferParameter} , headers{headers}.
 *     parameters:
 *       - name: token
 *         description: access token .
 *       - name: to
 *         description: transfert to.
 *       - name: pass
 *         description: password wallet.
 *       - name: amount
 *         description: amount to transfer
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR hash
 *       "500":
 *          description: error:error message
 */
		 app.post('/v3/bep20/transfer',async function(req, response) {

			try {
	
				var token = req.body.access_token;
				var to = req.body.to;
				var amount = req.body.amount;
				var pass = req.body.pass;
				var res = await app.crm.auth(token);
	
				var cred = await app.account.unlockBSC(res.id,pass);
				cred.from_id = res.id;
				var ret = await app.bep20.transferBEP(to,amount,cred);
				response.end(JSON.stringify(ret));
			} catch (err) {
					response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
			}
			finally {
					if(cred)
				app.account.lockBSC(cred.address);
			}
		})

	app.post('/v2/bep20/allow',async function(req, response) {

		try {

			var token = req.body.token;
			var spender = req.body.spender;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var res = await app.crm.auth( req.body.access_token);
			var cred = await app.account.unlockBSC(res.id,pass);
			cred.from_id = res.id;
			if(spender == app.config.ctrs.campaign.address.mainnet || spender == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				spender = app.config.ctrs.campaignBep20.address.mainnet;
			}
			if(spender == app.config.ctrs.campaign.address.testnet)
			{
				spender = app.config.ctrs.campaignBep20.address.testnet;
			}
			var ret = await app.bep20.approve(token,cred.address,spender,amount);
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lockBSC(cred.address);
		}
	})
	/////////////////

	app.post('/v2/bonus',async function(req, response) {


		try {
			var address = req.body.address;
			var pass = req.body.pass;
			var res = await app.crm.auth( req.body.access_token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.account.getBonus(cred.address);
			await app.db.sn_user().updateOne({_id: parseInt(res.id)}, {$set: {converted_sattv : "done"}});
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			if(cred)
				app.account.lock(cred.address);
		}
	})


	app.post('/v2/wrap',async function(req, response) {


		try {
			var pass = req.body.pass;
			var amount = req.body.amount;
			var res = await app.crm.auth( req.body.access_token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.account.wrapSatt(amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				if(cred)
			app.account.lock(cred.address);
		}
	})


	app.post('/v2/unwrap',async function(req, response) {


		try {
			var pass = req.body.pass;
			var amount = req.body.amount;
			var res = await app.crm.auth( req.body.access_token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.account.unWwrapSatt(amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	})

	/*
     @url : /prices
     @description: fetch crypto prices
     @params:
     @Input idKit : id of the kid
	 @Output delete message
     */


	app.get("/prices", async (req, res) => {

		if(app.prices.status && (Date.now() - (new Date(app.prices.status.timestamp)).getTime() < 1200000)) {

					}

					else {

						const requestOptions = {
						  method: 'GET',
						  uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest',
						  qs: {
							start: 1,
							limit: 200,
							convert: 'USD'
						  },
						  headers: {
							'X-CMC_PRO_API_KEY': app.config.cmcApiKey
						  },
						  json: true,
						  gzip: true
						};
						var p = await rp(requestOptions);
						app.prices = p;
				}

				var response = app.prices.data;
				// console.log(req.app.config.bwPrice)
	    //   var bwSatt = await rp({uri:req.app.config.bwPrice,json: true});
        var prices = [];
        var str = "{";
        for(var i = 0;i<response.length;i++)
        {
                var price = {
                        price:response[i].quote.USD.price,
                        percent_change_24h:response[i].quote.USD.percent_change_24h,
                        market_cap:response[i].quote.USD.market_cap,
                        volume_24h:response[i].quote.USD.volume_24h,
                        circulating_supply:response[i].circulating_supply,
                        total_supply:response[i].total_supply,
                        max_supply:response[i].max_supply
                }
                prices[""+response[i].symbol] = price;
                str += '"'+response[i].symbol+'":'+JSON.stringify(price)+",";
        }
		// 		str+='"SATT":{"price":'+bwSatt.datas[1]+',"percent_change_24h":0},';
		// 		str+='"JET":{"price":0.002134,"percent_change_24h":0}';
        // prices["SATT"] = {price:bwSatt.datas[1]};
				response=str.substring(0, str.length-1);
		 		response+="}"
				res.end(response)
})

app.get('/v2/feebtc', async function(req, response) {

	try {

		var res = await rp({uri:app.config.BtcFees,json: true});
		var feeRate = parseInt(res.fastestFee);
		response.end(JSON.stringify({fee:feeRate*138}));

	} catch (err) {
		console.log(err.message?err.message:err.error);
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
})
/**
 * @swagger
 * /v2/transferbnb/{token}/{pass}/{to}/{val}/{gas}/{estimate}/{gasprice}:
 *   get:
 *     summary: transfer bnb {deprecated}.
 *     description: parametres acceptées :non parametrs .
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR data
 *       "500":
 *          description: error:error message
 */
app.get('/v2/transferbnb/:token/:pass/:to/:val/:gas/:estimate/:gasprice', async function(req, response) {
	var pass = req.params.pass;
	try {
		var res = await app.crm.auth( req.params.token);
		var cred = await app.account.unlockBSC(res.id,pass);
		cred.from_id = res.id;
		var to = req.params.to;
		var amount = req.params.val;
		var ret = await app.bep20.transferNativeBNB(to,amount,cred);
		response.end(JSON.stringify(ret));
	} catch (err) {
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	finally {
		app.account.lockBSC(cred.address);
	}
})

/**
 * @swagger
 * /v3/transferbnb/{to}/{val}:
 *   get:
 *     summary: transfer bnb .
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password wallet.
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant OR data
 *       "500":
 *          description: error:error message
 */
app.get('/v3/transferbnb/:to/:val', async function(req, response) {
	var pass = req.body.pass;
	var token = req.headers["authorization"].split(" ")[1];

	try {
		var res = await app.crm.auth(token);
		var cred = await app.account.unlockBSC(res.id,pass);
		cred.from_id = res.id;
		var to = req.params.to;
		var amount = req.params.val;
		var ret = await app.bep20.transferNativeBNB(to,amount,cred);
		response.end(JSON.stringify(ret));
	} catch (err) {
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	finally {
		app.account.lockBSC(cred.address);
	}
})

/*
app.get('/v2/sum', async function(req, response) {


	try {
		var sum = 0.0;
		var res = [];
  	var payments = await app.db.buy().find({ "status": "paid", "created":{$gte: new Date("2020-08-27T00:00:00.000Z"), $lt: new Date("2020-09-01T00:00:00.000Z")}}).toArray();
		for (var i = 0; i < payments.length; i++) {
			var pay = payments[i];
			sum += parseFloat(pay.amount)
			res.push({idUser:pay.idNode,created:pay.created,amount:pay.amount});
		}
		response.end(JSON.stringify(res));

	} catch (err) {
		console.log(err.message?err.message:err.error);
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
})
*/


 app.get('/v2/transaction_history/:address', async function(req, response) {
	var address = req.params.address;
	var btcAddress=req.params.addressBTC
	try {
		//ETH Network
		const requestOptions_ETH_transactions = {
			method: 'GET',
			uri: app.config.etherscanApiUrl_+address+"&action=txlist",
			json: true,
			gzip: true
		  };

		const requestOptions_ERC20_transactions = {
			method: 'GET',
			uri: app.config.etherscanApiUrl_+address+"&action=tokentx",
			json: true,
			gzip: true
		  };

		 /* const requestOptions_BTC_transactions = {
			method: 'GET',
			uri: 'https://blockchain.info/rawaddr/'+ btcAddress ,
			json: true,
			gzip: true
		};*/

		  //var BTC_transactions =  await rp(requestOptions_BTC_transactions);
		  //console.log(BTC_transactions)
		  var Eth_transactions =  await rp(requestOptions_ETH_transactions);
		  var ERC20_transactions= await rp(requestOptions_ERC20_transactions);
		  var all_Eth_transactions=app.cryptoManager.FilterTransactionsByHash(Eth_transactions,ERC20_transactions,'ERC20')

        //BNB Network
		const requestOptions_BNB_transactions = {
			method: 'GET',
			uri: app.config.bscscanApi+address+"&action=txlist",
			json: true,
			gzip: true
		  };

		const requestOptions_BEP20_transactions = {
			method: 'GET',
			uri: app.config.bscscanApi+address+"&action=tokentx",
			json: true,
			gzip: true
		  };

		  var BNB_transactions= await rp(requestOptions_BNB_transactions);
		  var BEP20_transactions= await rp(requestOptions_BEP20_transactions);
          var all_BNB_transactions=app.cryptoManager.FilterTransactionsByHash(BNB_transactions,BEP20_transactions,'BEP20')

		  const All_Transactions = all_Eth_transactions.concat(all_BNB_transactions)

		  response.end(JSON.stringify(All_Transactions));
	} catch (err) {
		throw err
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
})


  /*
     @Url :/v2/profile/update'
     @description: update profile
     @parameters => request_body :
     New_user_data:data To be updated
     */

app.post('/v2/profile/update', async function(req, response) {
	try{
		let authheader = req.headers['authorization'].split(" ")[1]
        let checkEmail= await app.db.user().find({email:req.body.email}, function (err, docs) {
          for(var i=0;i<docs.length;i++){
			  if(docs[i].accessToken!=authheader){
				  if(docs[i].email==req.body.email){
					 return res.end("EmailExiste")
				  }
			  }
		  }
		})
		let Update_ =await app.db.user().findOneAndUpdate({'accessToken':authheader},req.body,null, (error, doc) => {
	         if(error){
				return res.end(error)
			 }
			 res.end("Profile Updated")
		  })
	   }catch(err){
	  res.end(JSON.stringify(err))
	 }
	})

	app.get('/user/balance', async (req,res)=>{
		try {
			 let token = req.headers["authorization"].split(" ")[1];
             const auth = await app.crm.auth(token);
			const idUser = auth.id
			const Fetch_crypto_price = {
				method: 'GET',
				uri: xChangePricesUrl,
				json: true,
				gzip: true
			  };
			let Crypto = await rp(Fetch_crypto_price);
			const balance = await app.account.getListCryptoByUid(idUser,Crypto);
			res.send(balance)
		}catch (err) {
		   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	return app;
}
