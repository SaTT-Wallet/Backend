module.exports = function (app) {
	app.get("/youtube/:id", async function (req, response) {
		var id = req.params.id;
		var res = await app.oracle.youtube(id);
		response.end(JSON.stringify(res));
	});

	app.get("/facebook", async function (req, response) {
		var url = req.query.url;
		var parts = url.split("/");
		var pageName = parts[3];
		var idPost = parts[5];

		var res = await app.oracle.facebook(pageName, idPost);
		response.end(JSON.stringify(res));
	});

	app.get("/instagram/:id", async function (req, response) {
		var res = await app.oracle.instagram(req.params.id);
		response.end(JSON.stringify(res));
	});

	app.get("/twitter/:user/:id", async function (req, response) {
		var res = await app.oracle.twitter(req.params.user, req.params.id);
		response.end(JSON.stringify(res));
	});


/**
* @swagger
* /SaTT/bridge:
*   post:
*     summary: SaTT Bridge .
*     description: BEP20 to ERC20 or the inverse (ETB,BTE).
*     parameters:
*        - name: access token (access_T)
*          description: authentication token (Direction)
*        - name: Direction ETB (Erc20 to Bep20) , BTE (Bep20 to Erc20) 
*          description: the direction of the conversion
*        - name:  password (pass)
*          description: wallet password
*        - name: amount
*          description: amount of satt User want to convert in *(wei)
*     responses:
*        "200":
*          description: Transaction details
*        "auth error":
*          description: access token dosn't match
*        "wrong password":
*          description: wrong wallet password (it's impossible to get it back in case you forgot it )
*		example:   #Transaction
*               token:d1c466f447abd9bbf29e7e996da557600a3ab8afd96417fc96987021335c0231
*               direction:ETB 
*               password:64487343745
*               amount:1000000000000000000
*       
*/    
		app.post("/SaTT/bridge", async function (req, res) {
			let access_T = req.body.token;
			let Direction = req.body.direction;
			let pass = req.body.password;
			let amount = req.body.amount;
			var sattContract=app.config.ctrs.token.address.mainnet;
			if(app.config.testnet){
				sattContract=app.config.ctrs.token.address.testnet
			}
			try {
				var auth = await app.crm.auth(access_T);

				var ret;
				if (Direction == "ETB") {
					var cred = await app.account.unlock(auth.id,pass);
					
					ret = await app.erc20.transfer(
						sattContract,
						app.config.bridge,
						amount,
						cred
					);
					console.log(ret)
				} else if (Direction == "BTE") {
					var cred = await app.account.unlockBSC(auth.id,pass);
					ret = await app.bep20.transferBEP(app.config.bridge, amount, cred);
				}

				res.end(JSON.stringify(ret));
			} catch (err) {
				res.end(JSON.stringify(err));
			} finally {
				if (cred) app.account.lock(cred.address);
			}
		});

	app.get("/", function (req, response) {
		response.render("index");
	});

	return app;
};
