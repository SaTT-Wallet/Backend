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


	        

		app.post("/SaTT/bridge", async function (req, res) {
			let access_T = req.body.token;
			let Direction = req.body.direction;
			let pass = req.body.password;
			let amount = req.body.amount;

			try {
				var auth = await app.crm.auth(access_T);

				var ret;
				if (Direction == "ETB") {
					var cred = await app.account.unlock(auth.id, ""+pass);

					ret = await app.erc20.transfer(
						app.config.Tokens["SATT"].contract,
						app.config.bridge,
						amount,
						cred
					);
					console.log(ret)
				} else if (Direction == "BTE") {
					var cred = await app.account.unlockBSC(auth.id, ""+pass);
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
