const {randomUUID}= require('crypto');
const { response } = require('express');
const converter = require('json-2-csv');
var fs = require('fs');
const os = require('os');
const Big = require('big.js');

module.exports = function (app) {
	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )
	var BN = require('bn.js');
	var rp = require('request-promise');
	const { v5 : uuidv5 } = require('uuid')
	const xChangePricesUrl = app.config.xChangePricesUrl;
    const log = console.log.bind(console,"logged");
   
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

    app.get('/v2/total_balance', async (req, response) =>{

		try {
			/*const Fetch_crypto_price = {
				method: 'GET',
				uri: xChangePricesUrl,
				json: true,
				gzip: true
			  };*/
			  const token = req.headers["authorization"].split(" ")[1];
			  var auth =	await app.crm.auth(token);
		      var id = auth.id;
		  //let Crypto = await rp(Fetch_crypto_price);
		  let Crypto =  app.account.getPrices(); 
		  let variation = 0.00
		  var Total_balance = await app.account.getBalanceByUid(id, Crypto);
		  response.end(JSON.stringify({Total_balance, variation})).status(201);

		} catch (err) {
			response.end(JSON.stringify({error:err.message?err.message:err.error}))
		}
		finally{
			if(id){
			let date = Math.round(new Date().getTime()/1000);
			var today = (new Date()).toLocaleDateString("en-US");
			const user =  await app.db.sn_user().findOne({_id : id},{ 'fields': { '_id': 0}});
			if(!user.daily){user.daily = []}
			if(!user.daily[0] || user.daily[0].convertDate !== today){
			  user.daily.unshift({Date : date, Balance : Total_balance.Total_balance, convertDate : today});
			  if(user.daily.length > 7){user.daily.pop()}
			  await app.db.sn_user().updateOne({_id : id}, {$set: user});
			}
			}
		}
	});

//conmatibilité nop
	app.get('/v2/total_balance/:addr/:token', async (req, res) =>{

	try {
		const Fetch_crypto_price = {
			method: 'GET',
			uri: xChangePricesUrl,
			json: true,
			gzip: true
			};

			const token = req.headers["authorization"].split(" ")[1];
			var auth =	await app.crm.auth(token);
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
			
			const token = req.params.token;
			var res =	await app.crm.auth(token);

			req.session.user = res.id;
			
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



	//yes
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
			const token = req.headers["authorization"].split(" ")[1];
			var auth =	await app.crm.auth(token);
			var count = await app.account.hasAccount(auth.id);
			console.log("newwallet",auth.id,req.connection.remoteAddress);
			var ret = {err:"account_exists"};
			if(!count)
			{
				var ret = await app.account.createAccount(auth.id,pass);
			}
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});

	//yes
/**
 * @swagger
 * /v3/newallet:
 *   post:
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
	app.post('/v3/newallet', async function(req, response) {

		var pass = req.body.pass;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	//yes
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
	app.post('/v3/printseed', async function(req, response) {

		var pass = req.body.pass;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var count = await app.account.hasAccount(res.id);			
			var ret = {err:"account_exists"};
			if(!count)
			{
				var ret = await app.account.createSeed(res.id,pass);
			}
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}finally{
			if(ret.address) await app.db.walletUserNode().insertOne({
				wallet:ret.address,
				idUser:res.id
			})
           !count && ret.address && app.account.sysLog("/newallet2",req.addressIp,`new wallet for created ${ret.address}`);
		}

	});


	app.post('/v2/recover', async function(req, response) {
		const token = req.headers["authorization"].split(" ")[1];
		var res =	await app.crm.auth(token);
		var pass = req.body.pass;
		var oldpass = req.body.oldpass;
		var wordlist = req.body.wordlist;

		try {


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

			const token = req.headers["authorization"].split(" ")[1];
			var auth =	await app.crm.auth(token);
			var cred = await app.account.unlock(auth.id,pass);
			var ret = {err:"no_account"};

			var acc = await app.account.getAccount(auth.id)
			if(acc)
			{

				if(acc.version == 1) {
				  ret = await app.account.createBtcAccount(auth.id,pass);
				}
				if(acc.version == 2) {
					ret = await app.account.recoverBtc(auth.id,pass);
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

	app.post('/v3/newalletbtc', async function(req, response) {

		var pass=req.body.pass;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var auth =	await app.crm.auth(token);
			var cred = await app.account.unlock(auth.id,pass);
			var ret = {err:"no_account"};

			var acc = await app.account.getAccount(auth.id)
			if(acc)
			{

				if(acc.version == 1) {
				  ret = await app.account.createBtcAccount(auth.id,pass);
				}
				if(acc.version == 2) {
					ret = await app.account.recoverBtc(auth.id,pass);
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

			var ret = {err:"no_account"};
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	app.post('/v3/resetpass', async function(req, response) {

		var pass=req.body.pass;
		var newpass=req.body.newpass;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	app.post('/v3/export',async function(req, response) {
		var pass = req.body.pass;
		response.attachment();

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	app.post('/v3/exportbtc', async function(req, response) {
		var pass = req.body.pass;
		response.attachment();

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var auth =	await app.crm.auth(token);
			var cred = await app.account.unlock(auth.id,pass);
			cred.from_id = auth.id;
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

	app.post('/v3/transfer', async function(req, response) {
		var pass = req.body.pass;
		var amount = req.body.val;
		var to = req.body.to;

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
				if(cred) app.account.lock(cred.address);
				if(ret.transactionHash){
					await app.account.notificationManager(res.id, "transfer_event",{amount,currency :'ETH',to, transactionHash : ret.transactionHash, network : "ERC20"})
					const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
					if(wallet){
					
						await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency :'ETH',from : cred.address, transactionHash : ret.transactionHash, network : "ERC20"})
					}
				}
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
	app.post('/v3/transferether', async function(req, response) {
		var pass = req.body.pass;
		var to = req.body.to;
		var amount = req.body.val;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			
			var ret = await app.cryptoManager.transfer(to,amount,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			if(cred) app.account.lock(cred.address);
			if(ret.transactionHash){
				await app.account.notificationManager(res.id, "transfer_event",{amount,currency :'ETH',to, transactionHash : ret.transactionHash, network : "ERC20"})
				const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
				if(wallet){
				
					await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency :'ETH',from : cred.address, transactionHash : ret.transactionHash, network : "ERC20"})
				}
			}
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);

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
	app.post('/v3/transferbtc', async function(req, response) {

		var pass = req.body.pass;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			var result = await app.account.getAccount(res.id);
			if(new Big(req.body.val).gt(new Big(result.btc_balance)))
				response.end(JSON.stringify({message:"not_enough_budget"}));
			var hash = await app.cryptoManager.sendBtc(res.id,pass, req.body.to,req.body.val);
			response.end(JSON.stringify({hash:hash}));

		} catch (err) {
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	app.post('/v3/transferbyuid', async function(req, response) {

		var pass = req.body.pass;
		var amount = req.body.val;

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.body.uid);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

	app.post('/v3/transferetherbyuid', async function(req, response) {
		var pass = req.body.pass;
		var amount = req.body.val;
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var to = await  app.account.getAddrByUid(req.body.uid);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var addr = await app.cryptoManager.getReceiveEthWallet(res.id);
			response.end(JSON.stringify({address:addr}));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	app.get('/v2/receivewalletbtc/:token', async function(req, response) {

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var addr = await app.cryptoManager.getReceiveBtcWallet(res.id);
			response.end(JSON.stringify({address:addr}));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})



	app.get('/v2/confirmselleth/:token',async function(req, response) {

		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var res2 = await app.cryptoManager.receiveEthWallet(res.id);
			response.end(JSON.stringify(res2));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	})

	app.get('/v2/confirmsellbtc/:token',async function(req, response) {
		try {
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			var allowance = await app.erc20.getApproval(token,req.params.addr,spender);
			//var allowance = {amount:"10000000000000000000000000000"};
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
            var tokenERC20 = req.body.token;
			var to = req.body.to;
			var amount = req.body.amount;
			var pass = req.body.pass;
			var currency=req.body.symbole;
			var decimal = req.body.decimal;
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var result = await app.account.getAccount(res.id);
			let balance = await app.bep20.getBalance(req.body.token,result.address);
			if(new Big(amount).gt(new Big(balance.amount)))
			response.end(JSON.stringify({message:"not_enough_budget"}));
			var ret = await app.erc20.transfer(tokenERC20,to,amount,cred);
			
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
				cred && app.account.lock(cred.address);
				if(ret && ret.transactionHash){
					await app.account.notificationManager(res.id, "transfer_event",{amount,currency,to, transactionHash : ret.transactionHash, network : "ERC20", decimal} )
					const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
					if(wallet){
						await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency,from :cred.address, transactionHash : ret.transactionHash, network : "ERC20",decimal } )
					}
	
				}
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
			var tokenERC20 = req.body.token;
			var to = req.body.to;
			var amount = req.body.amount;
			var pass = req.body.pass;
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

			var spender = req.body.spender;
			var amount = req.body.amount;
			const acces = req.headers["authorization"].split(" ")[1];
            const token = req.body.token
			var res =	await app.crm.auth(acces);
			var pass = req.body.pass;
			var cred = await app.account.unlock(res.id,pass);
			cred.from_id = res.id;
			var ret = await app.erc20.approve(token,cred.address,spender,amount);
			console.log("ret",ret);
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



			/*if(spender == app.config.ctrs.campaign.address.mainnet || spender == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				spender = app.config.ctrs.campaignBep20.address.mainnet;
			}
			if(spender == app.config.ctrs.campaign.address.testnet)
			{
				spender = app.config.ctrs.campaignBep20.address.testnet;
			}*/
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
            var currency = req.body.symbole
			var to = req.body.to;
			var amount = req.body.amount;
			var decimal = req.body.decimal;
			var pass = req.body.pass;
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);

			var cred = await app.account.unlockBSC(res.id,pass);
			cred.from_id = res.id;
			req.body.token = !req.body.token ? "0x448bee2d93be708b54ee6353a7cc35c4933f1156": req.body.token;
			var result = await app.account.getAccount(res.id);
			let balance = await app.bep20.getBalance(req.body.token,result.address);
			if(new Big(amount).gt(new Big(balance.amount)))
			response.end(JSON.stringify({message:"not_enough_budget"}));

			var ret = await app.bep20.sendBep20(req.body.token,to,amount,cred);
			
			response.end(JSON.stringify(ret));
		} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
	cred && app.account.lockBSC(cred.address)
	if(ret && ret.transactionHash){
		await app.account.notificationManager(res.id, "transfer_event",{amount, network :'BEP20', to :req.body.to , transactionHash : ret.transactionHash, currency, decimal})	
		const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
		if(wallet){
			await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount, network :'BEP20', from :cred.address , transactionHash : ret.transactionHash, currency,decimal} )
		}

	}
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

				var to = req.body.to;
				var amount = req.body.amount;
				var pass = req.body.pass;
				const token = req.headers["authorization"].split(" ")[1];
				var res =	await app.crm.auth(token);
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

			var spender = req.body.spender;
			var amount = req.body.amount;
			var pass = req.body.pass;

			const token = req.headers["authorization"].split(" ")[1];
			const bep20TOken = req.body.token
			var res =	await app.crm.auth(token);
			var cred = await app.account.unlockBSC(res.id,pass);
			cred.from_id = res.id;
			/*if(spender == app.config.ctrs.campaign.address.mainnet || spender == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				spender = app.config.ctrs.campaignBep20.address.mainnet;
			}
			if(spender == app.config.ctrs.campaign.address.testnet)
			{
				spender = app.config.ctrs.campaignBep20.address.testnet;
			}*/
			var ret = await app.bep20.approve(bep20TOken,cred.address,spender,amount);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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
			const token = req.headers["authorization"].split(" ")[1];
			var res =	await app.crm.auth(token);
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

		var prices = app.account.getPrices()

		res.end(JSON.stringify(prices))
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
		const token = req.headers["authorization"].split(" ")[1];
		var res =	await app.crm.auth(token);
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
    if(cred) app.account.lockBSC(cred.address);
    if(ret.transactionHash){
	await app.account.notificationManager(res.id, "transfer_event",{amount,currency :'BNB',to , transactionHash : ret.transactionHash, network : "BEP20"})
	const wallet = await  app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
		if(wallet){
			await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency :'BNB',from : cred.address, transactionHash : ret.transactionHash, network : "BEP20"} )
		}
}
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
 app.post('/v3/transferbnb', async (req, response)=> {
	var pass = req.body.pass;

	try {
		const token = req.headers["authorization"].split(" ")[1];
		var res =	await app.crm.auth(token);
		var cred = await app.account.unlockBSC(res.id,pass);
		cred.from_id = res.id;
		var to = req.body.to;
		var amount = req.body.val;
		var result = await app.account.getAccount(res.id);
		if(new Big(amount).gt(new Big(result.bnb_balance)))
			response.end(JSON.stringify({message:"not_enough_budget"}));

		var ret = await app.bep20.transferNativeBNB(to,amount,cred);
		response.end(JSON.stringify(ret));
	} catch (err) {
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	finally {
		cred && app.account.lockBSC(cred.address);
		if(ret.transactionHash){
		await app.account.notificationManager(res.id, "transfer_event",{amount,currency :'BNB',to , transactionHash : ret.transactionHash, network : "BEP20"})
		const wallet = await  app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
			if(wallet){
				await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency :'BNB',from : cred.address, transactionHash : ret.transactionHash, network : "BEP20"} )
			}
	}
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

	app.get('/user/balance', async (req,response)=>{
		try {
			// const Fetch_crypto_price = {
			// 	method: 'GET',
			// 	uri: xChangePricesUrl,
			// 	json: true,
			// 	gzip: true
			//   };
			  const token = req.headers["authorization"].split(" ")[1];
			  var auth =	await app.crm.auth(token);
			// let Crypto = await rp(Fetch_crypto_price);
			let Crypto =  app.account.getPrices();
			const balance = await app.account.getListCryptoByUid(auth.id,Crypto);
			let listOfCrypto = [...new Set(balance.listOfCrypto)];

			response.send(JSON.stringify({listOfCrypto}))
		}catch (err) {
		   response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	app.post('/wallet/token', async (req, res) =>{
		try {
			const token = req.headers["authorization"].split(" ")[1];
			let auth = await app.crm.auth(token);
            let id = auth.id
			let [tokenAdress,network] = [req.body.tokenAdress,req.body.network];

			let abi = network === "bep20" ? app.config.ctrs.bep20.abi : app.config.ctrs.token.abi;       
            let networkToken = network === "bep20" ? app.web3Bep20.eth : app.web3.eth;

			let code = await networkToken.getCode(tokenAdress)
			if(code === '0x'){res.send({error:'not a token address'})}
			else{
			let contract = new networkToken.Contract(abi,tokenAdress)
			decimal = await contract.methods.decimals().call();
			tokenName = await contract.methods.name().call();
			network = network.toUpperCase();
			symbol = await contract.methods.symbol().call();
			res.send({message : "Token found", tokenName, symbol,decimal,tokenAdress,network})
			}
		}catch (err) {
		   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})
app.post('/wallet/add/token', async (req, res) =>{
		try {
			const token = req.headers["authorization"].split(" ")[1];
			let auth = await app.crm.auth(token);
			let customToken = {};
			let [tokenAdress,symbol,decimal,network] = [req.body.tokenAdress,req.body.symbol,req.body.decimal,req.body.network]
			
			let tokenExist =  await app.db.customToken().findOne({tokenAdress,symbol,decimal,network,sn_users:{$in: [auth.id]} });
			if(tokenExist){
				res.send(JSON.stringify({error:"token already added"}));
				return;
			}
			const Fetch_crypto_price = {
				method: 'GET',
				uri: xChangePricesUrl,
				json: true,
				gzip: true
			  };
			  let CryptoPrices = await rp(Fetch_crypto_price);

			let tokenFounded = await app.db.customToken().findOne({tokenAdress,symbol,decimal,network});
			if(!tokenFounded){
				customToken = req.body;
				customToken.sn_users = [auth.id]
            if(CryptoPrices.hasOwnProperty(symbol)){
            const cryptoMetaData = {
				method: 'GET',
				uri: app.config.cmcUrl + symbol,
				headers : {
			     'X-CMC_PRO_API_KEY': app.config.cmcApiKey
				},
				json: true,
				gzip: true
			  };
           let metaData = await rp(cryptoMetaData);			
			customToken.picUrl = metaData.data[customToken.symbol].logo
			 }
			await app.db.customToken().insertOne(customToken)
			res.end(JSON.stringify({message:"token added"}))
				return;
			} else {
				let id = tokenFounded._id
			//	tokenFounded.sn_users.push(auth.id)
				await app.db.customToken().updateOne({_id:app.ObjectId(id)},{$push:{sn_users:auth.id}});
			}
			res.end(JSON.stringify({message:"token added"}))
		}catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		 }
	})

app.post('/wallet/remove/token', async (req, res) =>{
		try {
			const token = req.headers["authorization"].split(" ")[1];
			let auth = await app.crm.auth(token);
            let id = auth.id
	        let tokenAdress = req.body.tokenAdress
			let token2 = await app.db.customToken().findOne({tokenAdress})
			let splicedArray = token2.sn_users.filter(item => item !== id)
			await app.db.customToken().updateOne({tokenAdress},{$set:{sn_users:splicedArray}});
			res.end(JSON.stringify({message:"token removed"}));
			}
		catch (err) {
		   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})

	app.get('/getMnemo', async (req, res) => {
		try{
			const token = req.headers["authorization"].split(" ")[1];
			let auth = await app.crm.auth(token);
		    let wallet=await app.db.wallet().findOne({UserId:auth.id},{projection: { mnemo: true }})
		    let mnemo=wallet.mnemo;
	
		    res.send(JSON.stringify({mnemo}));
		} catch (err) {
		  res.end(JSON.stringify({"error":err.message?err.message:err.error}));
		 }
	  })

	  app.post('/verifyMnemo', async (req, res) => {
		try{
			const token = req.headers["authorization"].split(" ")[1];
			let auth = await app.crm.auth(token);
			let mnemo = req.body.mnemo;
		    let wallet=await app.db.wallet().findOne({$and:[{UserId:auth.id},{mnemo}]})
			let verify = wallet ? true : false;
		    res.send(JSON.stringify({verify}));
		} catch (err) {
		  res.end(JSON.stringify({"error":err.message?err.message:err.error}));
		 }
	  })
	app.post('/GetQuote', async (req, res) => {
		try {
		    const token = req.headers["authorization"].split(" ")[1];
			var auth = await app.crm.auth(token);
			let requestQuote = req.body;
			requestQuote["end_user_id"]= String(auth.id);
			requestQuote["client_ip"]= req.addressIp;
            requestQuote["payment_methods"]= ["credit_card"];
            requestQuote["wallet_id"]= "satt";
		const simplexQuote ={
			url: app.config.sandBoxUri +"/wallet/merchant/v2/quote",
			method: 'POST',
			  body:requestQuote, 
			headers: {
				'Authorization': `ApiKey ${app.config.sandBoxKey}`,
			  },
			json: true
		  };
		  var quote = await rp(simplexQuote);
		  delete quote.supported_digital_currencies;
		  delete quote.supported_fiat_currencies;
		  app.account.log("Quote from simplex", quote);
		  res.end(JSON.stringify(quote));
		}
		catch (err) {
		   app.account.sysLogError(err);
		   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally{
		//quote && app.account.log(`requestedQuote by ${auth.id}`,quote.digital_money.currency,`via ${quote.fiat_money.currency}`,`amount ${quote.fiat_money.total_amount}` )
		}
	})

	app.post('/PaymentRequest/:idWallet', async (req, res)=>{
		try {
		const token = req.headers["authorization"].split(" ")[1];
		var auth = await app.crm.auth(token);
		let payment_id=randomUUID();	
		const uiad = app.config.uiad;	
		let user_agent = req.headers['user-agent'];
		const http_accept_language =  req.headers['accept-language'];
		let user = await app.db.sn_user().findOne({_id:auth.id},{projection: { email: true, phone: true,created:true}});
		let request = {};
		request._id = auth.id.toString(), request.installDate=user.created
		request.email=user.email,request.addressIp=req.addressIp,request.user_agent = user_agent;
		request.language=http_accept_language;
		request.quote_id = req.body.quote_id //from /getQuote api
		request.order_id =  uuidv5(app.config.orderSecret, uiad);
	
		request.uuid = payment_id

		request.currency = req.body.currency;
		request.idWallet= req.params.idWallet;
		 let payment = app.config.paymentRequest(request)
		const paymentRequest ={
			url: app.config.sandBoxUri +"/wallet/merchant/v2/payments/partner/data",
			method: 'POST',
			 body:payment, 
			headers: {
				'Authorization': `ApiKey ${app.config.sandBoxKey}`,
			  },
			json: true
		  };

		  var paymentSubmitted = await rp(paymentRequest);
              paymentSubmitted.payment_id = payment_id;
			res.end(JSON.stringify(paymentSubmitted));
	}
	catch (err) {
	   app.account.sysLogError(err);
	   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	finally{
		paymentSubmitted && app.account.log(`requestedPayment by ${auth.id}` )	
	}
	})

app.get('/events/:paymentId', async (req, response)=>{
	try{
		const token = req.headers["authorization"].split(" ")[1];
		var auth = await app.crm.auth(token);

        const eventRequest ={
			url: app.config.sandBoxUri +"/wallet/merchant/v2/events",
			method: 'GET',
			headers: {
				'Authorization': `ApiKey ${app.config.sandBoxKey}`,
			  },
			json: true
		  };
		  
		const eventSubmitted = await rp(eventRequest);
		let event={userId:auth.id};
        eventSubmitted.events.forEach(async(elem)=>{
        if(elem.payment.id === req.params.paymentId){
			if(elem.name=="payment_simplexcc_approved"){
			event.status = "payment_simplexcc_approved";
			await app.db.paymentEvents().insertOne(event);
			}
			    const paymentRequest ={
		       url: app.config.sandBoxUri +"/wallet/merchant/v2/events/"+elem.event_id,
		       method: 'DELETE',
		       headers: {
			   'Authorization': `ApiKey ${app.config.sandBoxKey}`,
		       },
		       json: true
	  };
	     await rp(paymentRequest);
		}
		})

	  response.status(200).json({message:"event handled"})
	}catch(err){
		app.account.sysLogError(err);
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	 }	
})

app.get('/GetEmailsSatt', async (req, res) => {
	try {
		console.log(os.homedir());

		var userWithoutWallet=[];
		var userWithWallet=[];
		let users = await app.db.sn_user().find({userSatt:true}).toArray();
		for(let i=0;i<users.length;i++){
				wallet=await app.db.wallet().findOne({UserId:users[i]._id});
				if(!wallet){
					let user={email:users[i].email};
					userWithoutWallet.push(user);
				}
				else{
					let user={email:users[i].email};
					userWithWallet.push(user);
				}
		}

		converter.json2csv(userWithWallet, (err, csv) => {
			if (err) {
				throw err;
			}
		    fs.writeFileSync(os.homedir()+'/userWithWallet.csv', csv);
		});
		
		converter.json2csv(userWithoutWallet, (err, csv) => {
			if (err) {
				throw err;
			}
		    fs.writeFileSync(os.homedir()+'/userWithoutWallet.csv', csv);
		});
		res.status(200).json({message:"success"})

	}
	catch (err) {
	   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}
	
})


	return app;
}
