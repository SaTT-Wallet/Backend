module.exports = async function (app) {

	var child = require('child_process');
	var bip32 = require("bip32")
	var bip39 = require('bip39');
	var bitcoinjs = require('bitcoinjs-lib');
	var coinselect = require('coinselect');
	const ethUtil = require('ethereumjs-util');
	var BN = require("bn.js");
	var speakeasy = require("speakeasy");
	var QRCode = require('qrcode');

	var rp = require('request-promise');

	var ctrBonus =  new app.web3.eth.Contract(app.config.ctrs.priceGap.abi,app.config.ctrs.priceGap.address.mainnet);

	var ctrwSaTT =  new app.web3.eth.Contract(app.config.ctrs.wSaTT.abi,app.config.ctrs.wSaTT.address.mainnet);

	var accountManager = {};

	app.prices = false;

	accountManager.createSeed = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {
			var escpass = pass.replace(/'/g, "\\'");
			var mnemonic = child.execSync(app.config.bxCommand+' seed -b 256 | '+app.config.bxCommand+' mnemonic-new ',app.config.proc_opts).toString().replace("\n","");
			const seed = await bip39.mnemonicToSeed(mnemonic,pass);
			const rootBtc = bip32.fromSeed(seed,app.config.networkSegWitCompat);
			const rootBtcBc1 = bip32.fromSeed(seed,app.config.networkSegWit);
			const rootEth = bip32.fromSeed(seed);
			const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat);
			const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit);
			const childEth = rootEth.derivePath(app.config.pathEth);

			const address = bitcoinjs.payments.p2sh({
				  redeem: bitcoinjs.payments.p2wpkh({ pubkey: childBtc.publicKey, network: app.config.networkSegWitCompat }),
				  network: app.config.networkSegWitCompat
				}).address

			const  addressbc1  = bitcoinjs.payments.p2wpkh({ pubkey: childBtcBc1.publicKey, network: app.config.networkSegWit }).address

			var addressBuffer = ethUtil.privateToAddress(childEth.privateKey);
			var checksumAddress = ethUtil.toChecksumAddress(addressBuffer.toString('hex'));
			var addressEth = ethUtil.addHexPrefix(checksumAddress);
			var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'));
			var pubBtc = childBtc.publicKey.toString("hex");
			var account = app.web3.eth.accounts.privateKeyToAccount(privkey).encrypt(pass);

			child.execSync(app.config.btcCmd+" importpubkey "+pubBtc+" 'default' false");
			//await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});

			var ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+childBtc.privateKey.toString("hex"),app.config.proc_opts).toString().replace("\n","");
			var btcWallet = {publicKey:pubBtc,addressSegWitCompat:address,addressSegWit:addressbc1,publicKeySegWit:childBtcBc1.publicKey.toString("hex"),ek:ek};
			var count = await accountManager.getCount();

			app.db.wallet().insertOne({UserId:parseInt(userId),keystore:account,num:count,btc: btcWallet,mnemo:mnemonic});
			resolve({address:"0x"+account.address,btcAddress:btcWallet.addressSegWitCompat});

		})
	}

	accountManager.recover = async function (userId,wordlist,oldpass,pass) {
		return new Promise( async (resolve, reject) => {

			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
			    account = account[0];
				app.web3.eth.accounts.wallet.clear();
				app.web3.eth.accounts.wallet.decrypt([account.keystore], oldpass);
			}
			catch (e) {
				reject({error:"Wrong password"});
				return;
			}

			var escpass = pass.replace(/'/g, "\\'");
			var mnemonic = wordlist.join(" ");

			const seed = await bip39.mnemonicToSeed(mnemonic,pass);
			const rootBtc = bip32.fromSeed(seed,app.config.networkSegWitCompat);
			const rootBtcBc1 = bip32.fromSeed(seed,app.config.networkSegWit);
			const rootEth = bip32.fromSeed(seed);
			const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat);
			const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit);
			const childEth = rootEth.derivePath(app.config.pathEth);

			const address = bitcoinjs.payments.p2sh({
				  redeem: bitcoinjs.payments.p2wpkh({ pubkey: childBtc.publicKey, network: app.config.networkSegWitCompat }),
				  network: app.config.networkSegWitCompat
				}).address

			const  addressbc1  = bitcoinjs.payments.p2wpkh({ pubkey: childBtcBc1.publicKey, network: app.config.networkSegWit }).address

			var addressBuffer = ethUtil.privateToAddress(childEth.privateKey);
			var checksumAddress = ethUtil.toChecksumAddress(addressBuffer.toString('hex'));
			var addressEth = ethUtil.addHexPrefix(checksumAddress);
			var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'));
			var pubBtc = childBtc.publicKey.toString("hex");
			var account = app.web3.eth.accounts.privateKeyToAccount(privkey).encrypt(pass);

			child.execSync(app.config.btcCmd+" importpubkey "+pubBtc+" 'default' false");
			//await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});

			var ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+childBtc.privateKey.toString("hex"),app.config.proc_opts).toString().replace("\n","");
			var btcWallet = {publicKey:pubBtc,addressSegWitCompat:address,addressSegWit:addressbc1,publicKeySegWit:childBtcBc1.publicKey.toString("hex"),ek:ek};
			var count = await accountManager.getCount();

			var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: {keystore:account,num:count,btc: btcWallet,mnemo:mnemonic}});

		})
	}

	accountManager.printSeed = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {
			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];
				app.web3.eth.accounts.wallet.clear();
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);

				if(account.mnemo && !account.btc.addressSegWitCompat)
				{
					var escpass = pass.replace(/'/g, "\\'");
					const seed = await bip39.mnemonicToSeed(account.mnemo,pass);
					const rootBtc = bip32.fromSeed(seed,app.config.networkSegWitCompat);
					const rootBtcBc1 = bip32.fromSeed(seed,app.config.networkSegWit);
					const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat);
					const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit);
					const address = bitcoinjs.payments.p2sh({
						  redeem: bitcoinjs.payments.p2wpkh({ pubkey: childBtc.publicKey, network: app.config.networkSegWitCompat }),
						  network: app.config.networkSegWitCompat
						}).address

					const  addressbc1  = bitcoinjs.payments.p2wpkh({ pubkey: childBtcBc1.publicKey, network: app.config.networkSegWit }).address;
					var pubBtc = childBtc.publicKey.toString("hex");
					//await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});
					var ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+childBtc.privateKey.toString("hex"),app.config.proc_opts).toString().replace("\n","");
					var btcWallet = {publicKey:pubBtc,addressSegWitCompat:address,addressSegWit:addressbc1,publicKeySegWit:childBtcBc1.publicKey.toString("hex"),ek:ek};

					var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: {btc: btcWallet}});

				}

				if(account.mnemo)
					resolve(account.mnemo.split(" "));
				else
					reject({error:"no seed"});
			}
			catch (e) {
				reject({error:"Wrong password"});
			}

		})
	}


	accountManager.recoverBtc = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {
			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];
				app.web3.eth.accounts.wallet.clear();
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
				var address = false;

				if(account.mnemo && !account.btc.addressSegWitCompat)
				{
					var escpass = pass.replace(/'/g, "\\'");
					const seed = await bip39.mnemonicToSeed(account.mnemo,pass);
					const rootBtc = bip32.fromSeed(seed,app.config.networkSegWitCompat);
					const rootBtcBc1 = bip32.fromSeed(seed,app.config.networkSegWit);
					const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat);
					const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit);
					address = bitcoinjs.payments.p2sh({
						  redeem: bitcoinjs.payments.p2wpkh({ pubkey: childBtc.publicKey, network: app.config.networkSegWitCompat }),
						  network: app.config.networkSegWitCompat
						}).address

					const  addressbc1  = bitcoinjs.payments.p2wpkh({ pubkey: childBtcBc1.publicKey, network: app.config.networkSegWit }).address;
					var pubBtc = childBtc.publicKey.toString("hex");
					//await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});
					var ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+childBtc.privateKey.toString("hex"),app.config.proc_opts).toString().replace("\n","");
					var btcWallet = {publicKey:pubBtc,addressSegWitCompat:address,addressSegWit:addressbc1,publicKeySegWit:childBtcBc1.publicKey.toString("hex"),ek:ek};

					var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: {btc: btcWallet}});

				}

				if(address)
					resolve(address);
				else
					reject({error:"no seed"});
			}
			catch (e) {
				console.log(e)
				reject({error:"Wrong password"});
			}

		})
	}

	accountManager.unlock = async function (userId,pass) {

		return new Promise( async (resolve, reject) => {
			var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
			account = account[0];
			//app.web3.eth.accounts.wallet.clear();
			try {
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			resolve({address:"0x"+account.keystore.address});
		});
	}

	accountManager.getCount = async function() {
		return new Promise( async (resolve, reject) => {
			var count = await app.db.wallet().countDocuments();
			resolve(count+1);
		});
	}

	accountManager.genBtcWallet = async function (pass) {
		var escpass = pass.replace(/'/g, "\\'");

		var priv = child.execSync(app.config.bxCommand+' seed -b 256 | '+app.config.bxCommand+' ec-new ',app.config.proc_opts).toString().replace("\n","");
		var wif = child.execSync(app.config.bxCommand+' ec-to-wif '+priv,app.config.proc_opts).toString().replace("\n","");
		var ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+priv,app.config.proc_opts).toString().replace("\n","");
		var pub = child.execSync(app.config.bxCommand+' ec-to-public '+priv,app.config.proc_opts).toString().replace("\n","");



		const keyPair = bitcoinjs.ECPair.fromWIF(wif);

		const  address1 = bitcoinjs.payments.p2pkh({ pubkey: keyPair.publicKey }).address;
		const addressbc1 = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey }).address
		const address3 = bitcoinjs.payments.p2sh({
			  redeem: bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey })
			}).address;

			
		child.execSync(app.config.btcCmd+" importpubkey "+pub+" 'default' false");
		//await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});

		return {publicKey:pub,address:address1,addressSegWit:addressbc1,addressSegWitCompat:address3,ek:ek};

	}



	accountManager.hasAccount = async function (userId) {
		return new Promise( async (resolve, reject) => {
			var account = await app.db.wallet().findOne({UserId: parseInt(userId)});
			resolve(account && !account.unclaimed)
		});
	};

	accountManager.getAccount = async function (userId) {
		return new Promise( async (resolve, reject) => {

			var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
			account = account[0];
			var address = "0x"+account.keystore.address;

			var ether_balance = await app.web3.eth.getBalance(address);

			var satt_balance = await app.token.contract.methods.balanceOf(address).call();
			var res = {address:"0x"+account.keystore.address,ether_balance:ether_balance,satt_balance:satt_balance?satt_balance.toString():0,version:(account.mnemo?2:1)}
			if(account.btc && account.btc.addressSegWitCompat) {

				res.btc = account.btc.addressSegWitCompat;

				res.btc_balance = 0;

				/*try {
					var balance = await rp({uri:app.config.btcElectrumUrl+"balance/"+account.btc.addressSegWitCompat,json: true});
					res.btc_balance = Math.floor(parseFloat(balance)*100000000);
				}*/


				try {
					var utxo = JSON.parse(child.execSync(app.config.btcCmd+" listunspent 1 1000000 '[\""+account.btc.addressSegWitCompat+"\"]'"));

					if(!utxo.length)
						res.btc_balance = "0";
					else {
						var red  = utxo.reduce(function(r,cur) {
							r.amount += parseFloat(cur.amount);
							return r;
						})
						res.btc_balance =  Math.floor(red.amount*100000000);
					}
				}
				/*
				try {
					var balance = await rp({uri:app.config.blockCypher+account.btc.addressSegWitCompat+"/balance",json: true});
					res.btc_balance = parseInt(balance.balance);
				}*/
				catch(e)
				{
					console.log(e);
					res.btc_balance = 0;
				}
			}
			resolve(res);
		});
	};

	accountManager.createAccount = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {
			if(!pass)
			{
				defaultpass = app.web3.utils.randomHex(6);
			}
			else{
				defaultpass = pass;
			}

			var account = await app.db.wallet().findOne({UserId: parseInt(userId)});
			if(account && account.unclaimed) {
				var oldpass = await app.db.passwallet().findOne({UserId: parseInt(userId)});
				var newAccount = app.web3.eth.accounts.decrypt(account.keystore,oldpass.value).encrypt(defaultpass);
				var update = {keystore: newAccount,unclaimed:false};
				if(account.btc) {
					var escpassold = oldpass.value.replace(/'/g, "\\'");
					var escpass = defaultpass.replace(/'/g, "\\'");
					var ek = account.btc.ek;
					var addr = account.btc.address;
					var priv = child.execSync(app.config.bxCommand+' ek-to-ec \''+escpassold+'\' '+ek,app.config.proc_opts).toString().replace("\n","");
					var new_ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+priv,app.config.proc_opts).toString().replace("\n","");
					update.btc = {ek:new_ek};
				}

				var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: update});
				resolve({result:"OK"});
			}
			else {
				account = app.web3.eth.accounts.create().encrypt(defaultpass);
				var btcWallet = accountManager.genBtcWallet(defaultpass);
				var count = await accountManager.getCount();
				app.db.wallet().insertOne({UserId:parseInt(userId),keystore:account,num:count,btc: btcWallet});
				resolve({address:"0x"+account.address,btcAddress:btcWallet.addressSegWitCompat});
			}
		});

	};

	accountManager.createBtcAccount = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {

			var account = await app.db.wallet().findOne({UserId: parseInt(userId)});

			if(account && account.mnemo)
			{
				reject({error:"Wrong wallet type"});
				return;
			}

			try {

				app.web3.eth.accounts.decrypt(account.keystore,pass);

				var btcWallet = await accountManager.genBtcWallet(pass);
				var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: {btc: btcWallet}});
				resolve({result:"OK"});
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
		});
	};

	accountManager.changePass = async function (userId,oldPass,newPass) {
		return new Promise( async (resolve, reject) => {
			try {
				var account = await app.db.wallet().findOne({UserId: parseInt(userId)});
				var newAccount = app.web3.eth.accounts.decrypt(account.keystore,oldPass).encrypt(newPass);
			}
			catch (e) {
				reject({error:"Wrong password"});
				return;
			}
			var update = {keystore: newAccount};
			if(account.mnemo)
			{
				reject({error:"Wrong wallet type"});
				return;
			}
			if(account.btc)
			{
				var escpassold = oldPass.replace(/'/g, "\\'");
				var escpass = newPass.replace(/'/g, "\\'");
				var ek = account.btc.ek;
				var addr = account.btc.address;
				var priv = child.execSync(app.config.bxCommand+' ek-to-ec \''+escpassold+'\' '+ek,app.config.proc_opts).toString().replace("\n","");
				var new_ek = child.execSync(app.config.bxCommand+' ec-to-ek \''+escpass+'\' '+priv,app.config.proc_opts).toString().replace("\n","");
				update["btc.ek"] = new_ek;
			}

			var result = await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: update});
			resolve({changed:true});
		});
	};

	accountManager.exportkey = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {

			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];
				app.web3.eth.accounts.wallet.clear();
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			resolve(account.keystore);

		})
	};

	accountManager.exportkeyBtc = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {

			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];
				app.web3.eth.accounts.wallet.clear();
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			resolve(account.btc.ek);

		})
	};

	accountManager.getAddrByUid = async function (userId) {
		return new Promise( async (resolve, reject) => {
			var count = await app.db.wallet().count({UserId: parseInt(userId)});
			if(count) {
				var account = await app.db.wallet().findOne({UserId: parseInt(userId)});
				resolve("0x"+account.keystore.address);
			}
			else {
				var pass = app.web3.utils.randomHex(6);
				var account = app.web3.eth.accounts.create().encrypt(pass);

				var count = await accountManager.getCount();
				var btcWallet = accountManager.genBtcWallet(pass);

				app.db.wallet().insertOne({UserId:parseInt(userId),keystore:account,num:count,unclaimed:true,btc:btcWallet});
				app.db.passwallet().insertOne({UserId:parseInt(userId),value:pass});
				resolve("0x"+account.address);
			}
		});
	};

	accountManager.getTxs = async function (myaccount,txtype) {
		return new Promise( async (resolve, reject) => {
			/*
			var docs = await app.db.txs().find({"txtype":txtype,$or :[{"from":myaccount},{"to":myaccount}]}).toArray();
			var docs2 = [];
			for(var i=0;i<docs.length;i++)
			{
				var docres = docs[i];
				if(docs[i].amount) {
					if(docs[i].amount.negative) {
						var BNbig = new BN(0);
						BNbig.negative = docs[i].amount.negative;
						BNbig.words = docs[i].amount.words;
						BNbig.length = docs[i].amount.length;
						docres.amount =  BNbig.toString();
					}
				}
				docs2.push(docres);
			}
			resolve(docs2);
			*/
			var txs = [];
			var res = await rp({uri:app.config.etherscanApiUrl+myaccount,json:true});
			for(var i=0;i< res.result.length;i++)
			{
				var tx = res.result[i];
				if(tx.contractAddress == app.config.tokenContract)
				{
					var receipt = await app.web3.eth.getTransactionReceipt(tx.hash);
					var to = receipt.logs[0].topics[2]? "0x"+receipt.logs[0].topics[2].slice(-40):"";
					var satttx = {
						hash : tx.hash,
						from: "0x"+receipt.logs[0].topics[1].slice(-40),
						to : to,
						txtype : "SATT",
						amount : app.web3.utils.hexToNumberString(receipt.logs[0].data)
					}

					txs.push(satttx);

				}
			}
			resolve(txs);
		});
	}

	accountManager.getTxsFullSatt = async function (myaccount) {
		return new Promise( async (resolve, reject) => {
		    var docs = await app.db.txs().find({from:myaccount}).sort({"date":1}).toArray();
			resolve(docs);
		 });
	}

	accountManager.getSubscription = async function (myaccount) {
		return new Promise( async (resolve, reject) => {
			var docs = await  app.db.txs().find({from:myaccount,to:app.config.atayenSubscriptionAddress}).sort({"date":1}).toArray();
			resolve(docs);
		});
	}

	accountManager.getBonus = async function (myaccount) {
		return new Promise( async (resolve, reject) => {

			try {

				var txs = await  app.db.satt_tx().find({idWallet:myaccount}).toArray();
				var amt = new BN(0);
				for (var i =0;i<txs.length;i++)
				{
					amt = amt.add(new BN(txs[i].amount));
				}
				var amount = Math.round(amt.div(new BN("1000000000000000000")).toNumber());
				var h1 = app.web3.utils.sha3(app.web3.eth.abi.encodeParameters(['address','uint256'],[myaccount,amount]));
				app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
				var sign = await app.web3.eth.sign(h1,app.config.campaignOwner);
				var r = sign.slice(0, 66)
				var s = '0x' + sign.slice(66, 130)
				var v = '0x' + sign.slice(130, 132)
				v = app.web3.utils.hexToNumber(v);
				console.log("bonus",myaccount,amount,v,r,s);
				var gasPrice = await app.web3.eth.getGasPrice();
				//var gas = await  ctrBonus.methods.getGap(myaccount,amount,v,r,s).estimateGas({from:myaccount,gasPrice: gasPrice});
				var gas = 100000;
				var receipt = await ctrBonus.methods.getGap(myaccount,amount,v,r,s).send({from:myaccount,gas:gas,gasPrice:gasPrice});

				resolve(receipt.hash);
			}
			catch (e) {
				reject({message:e.message});
			}
			//resolve("");
		});
	}

	accountManager.wrapSatt = async function (amount,cred) {

		return new Promise( async (resolve, reject) => {
			try {
				var addr = app.config.ctrs.wSaTT.address.mainnet;
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  app.token.contract.methods.transfer(addr,amount).estimateGas({from:cred.address,gasPrice: gasPrice});
				var receipt = await app.token.contract.methods.transfer(addr,amount).send({from:cred.address,gas:gas,gasPrice:gasPrice});
				resolve(receipt.hash);
				}
			catch (e) {
				reject({message:e.message});
			}
		})

	}

	accountManager.unWwrapSatt = async function (amount,cred) {
		return new Promise( async (resolve, reject) => {
			try {
				var gasPrice = await app.web3.eth.getGasPrice();
				var gas = await  ctrwSaTT.methods().contributeWSATT(amount).estimateGas({from:cred.address,gasPrice: gasPrice});
				var receipt = await ctrwSaTT.methods().contributeWSATT(amount).send({from:cred.address,gas:gas,gasPrice:gasPrice});
				resolve(receipt.hash);
				}
			catch (e) {
				reject({message:e.message});
			}
		})
	}



	accountManager.create2FA = async function (userId) {
		return new Promise( async (resolve, reject) => {
			try {
				var res = await app.db.wallet().find({UserId: parseInt(userId)}).toArray();
				if(res[0].G2FA)
				{
					reject({message:"2FA already set"});
				}
				var secret = speakeasy.generateSecret({length: 20,name:"satt.atayen.us"});
				await app.db.wallet().updateOne({UserId: parseInt(userId)}, {$set: {G2FA:secret.base32}});

				QRCode.toDataURL(secret.otpauth_url, function(err, data_url) {
					resolve(data_url);
				});
			}
			catch (e) {
				reject({message:e.message});
			}
		})
	}

	accountManager.verify2FA = async function (userId,code) {
		return new Promise( async (resolve, reject) => {
			try {
				var res = await app.db.wallet().find({UserId: parseInt(userId)}).toArray();
				if(!res[0].G2FA)
				{
					reject({message:"2FA not set"});
				}
				var verified = speakeasy.totp.verify({ secret: res.G2FA,encoding: 'base32',token: code });
				resolve(verified);


			}
			catch (e) {
				reject({message:e.message});
			}
		})
	}


	app.account = accountManager;
	return app;
}
