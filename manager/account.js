module.exports = async function (app) {

	const fs = require('fs')

	var child = require('child_process');
	var bip32 = require("bip32")
	var bip39 = require('bip39');
	var bitcoinjs = require('bitcoinjs-lib');
	var coinselect = require('coinselect');
	const ethUtil = require('ethereumjs-util');
	var BN = require("bn.js");
	var speakeasy = require("speakeasy");
	var QRCode = require('qrcode');
    var Big = require('big.js');
    var Long = require('mongodb').Long;
	var rp = require('request-promise');
    const xChangePricesUrl = app.config.xChangePricesUrl;
	var ctrBonus =  new app.web3.eth.Contract(app.config.ctrs.priceGap.abi,app.config.ctrs.priceGap.address.mainnet);
    const bad_login_limit = app.config.bad_login_limit;
	const { createLogger, format, transports } = require('winston');
	const { combine, timestamp, label, prettyPrint, myFormat } = format;

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
			var checksumAddress = ethUtil.toChecksumAddress('0x'+addressBuffer.toString('hex'));
			// var addressEth = ethUtil.addHexPrefix(checksumAddress);
			var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'));
			var pubBtc = childBtc.publicKey.toString("hex");
			var account = app.web3.eth.accounts.privateKeyToAccount(privkey).encrypt(pass);
			if(!app.config.testnet) {
			  child.execSync(app.config.btcCmd+" importpubkey "+pubBtc+" 'default' false");
		  }
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
				app.web3.eth.accounts.wallet.decrypt([account.keystore], oldpass);
			}
			catch (e) {
				reject({error:"Wrong password"});
				return;
			}
			finally {
				app.web3.eth.accounts.wallet.remove("0x"+account.keystore.address);
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
      if(!app.config.testnet) {
			  child.execSync(app.config.btcCmd+" importpubkey "+pubBtc+" 'default' false");
		  }
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
			finally {
				app.web3.eth.accounts.wallet.remove("0x"+account.keystore.address);
			}

		})
	}


	accountManager.recoverBtc = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {
			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];

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
			finally {
				app.web3.eth.accounts.wallet.remove("0x"+account.keystore.address);
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
				app.web3Bep20.eth.accounts.wallet.decrypt([account.keystore], pass);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			resolve({address:"0x"+account.keystore.address});
		});
	}


	accountManager.unlockBSC = async function (userId,pass) {

		return new Promise( async (resolve, reject) => {
			var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
			account = account[0];
			//app.web3.eth.accounts.wallet.clear();
			try {
				app.web3Bep20.eth.accounts.wallet.decrypt([account.keystore], pass);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			resolve({address:"0x"+account.keystore.address});
		});
	}

	accountManager.lock =  function (addr) {
		app.web3.eth.accounts.wallet.remove(addr);
		app.web3Bep20.eth.accounts.wallet.remove(addr);
	}

	accountManager.lockBSC =  function (addr) {
		app.web3Bep20.eth.accounts.wallet.remove(addr);
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

  if(!app.config.testnet) {
		child.execSync(app.config.btcCmd+" importpubkey "+pub+" 'default' false");
	}
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
			if(!account || !account.unclaimed) return resolve(false)
			

			account = account[0];
			
			var address = "0x"+account.keystore.address;

			var ether_balance = await app.web3.eth.getBalance(address);

			var bnb_balance = await app.web3Bep20.eth.getBalance(address);

			var satt_balance = await app.token.contract.methods.balanceOf(address).call();
			var res = {address:"0x"+account.keystore.address,ether_balance:ether_balance,bnb_balance:bnb_balance,satt_balance:satt_balance?satt_balance.toString():0,version:(account.mnemo?2:1)}
			res.btc_balance = 0;
			if(!app.config.testnet && account.btc && account.btc.addressSegWitCompat ) {

				res.btc = account.btc.addressSegWitCompat;


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

				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
				resolve(account.keystore);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			finally {
				app.web3.eth.accounts.wallet.remove("0x"+account.keystore.address);
			}


		})
	};

	accountManager.exportkeyBtc = async function (userId,pass) {
		return new Promise( async (resolve, reject) => {

			try {
				var account = await app.db.wallet().find({UserId: parseInt(userId)}).sort( { _id: 1 } ).toArray();
				account = account[0];
				app.web3.eth.accounts.wallet.decrypt([account.keystore], pass);
				resolve(account.btc.ek);
			}
			catch (e) {
				reject({error:"Wrong password"});
			}
			finally {
				app.web3.eth.accounts.wallet.remove("0x"+account.keystore.address);
			}


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

	accountManager.getTxs = async function (myaccount,token) {
		return new Promise( async (resolve, reject) => {
			var txs  = await app.db.indexedtx().find({ token : token , $or: [ { from: myaccount }, { to : myaccount } ] }).sort({"date":-1}).toArray();
			resolve(txs);
		});
	}

	accountManager.getHolders = async function (token) {
		return new Promise( async (resolve, reject) => {
			var holders = [];
			holders["0xAB8199eba802e7e6634d4389Bf23999b7Ae6b253"] = {address :"0xAB8199eba802e7e6634d4389Bf23999b7Ae6b253",balance:"20000000000000000000000000000"};
			var txs  = await app.db.indexedtx().find({ token : token} ).sort({"date":1}).toArray();

			for(var i = 0;i<txs.length;i++)
			{
				var value = new BN(txs[i].value);
				if(!holders[txs[i].to])
				{
					holders[txs[i].to] = {address :txs[i].to,balance:"0"};
				}
				holders[txs[i].from].balance = ((new BN(holders[txs[i].from].balance)).sub(value)).toString();
				holders[txs[i].to].balance = ((new BN(holders[txs[i].to].balance)).add(value)).toString();

				await app.db.balance2().updateOne({address:txs[i].from},{$set: {balance:holders[txs[i].from].balance}},{ upsert: true})
				await app.db.balance2().updateOne({address:txs[i].to},{$set: {balance:holders[txs[i].to].balance}},{ upsert: true})
			}



    resolve("a")

		})

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
	accountManager.getWalletBydIdUser = async function (userId) {
		return new Promise( async (resolve, reject) => {
			try {
				var res = await app.db.wallet().findOne({UserId: parseInt(userId)});
				var wallet='0x'+res.keystore.address;
				resolve(wallet);
			}
			catch (e) {
				reject({message:e.message});
			}
		})
	}

	accountManager.getBalanceByUid = async  (userId, crypto) => {
      return new Promise( async (resolve, reject) => {
       try {

		  var [Total_balance,CryptoPrices] = [0,crypto];
		  var token_info=  Object.assign({}, app.config.Tokens);
			delete token_info['SATT']
			delete token_info['BNB']
			
				let ret = await accountManager.getAccount(userId)
				delete ret.btc
				delete ret.version

				let userTokens = await app.db.customToken().find({sn_users:  {$in: [userId]}}).toArray();
			    if(userTokens.length){
				for(let i = 0; i < userTokens.length; i++){
                let symbol = userTokens[i].symbol
				if(token_info[symbol]) symbol = `${symbol}_${userTokens[i].network}`
			    token_info[symbol] = {dicimal : Number(userTokens[i].decimal), symbol :userTokens[i].symbol, network : userTokens[i].network, contract :userTokens[i].tokenAdress, name :userTokens[i].tokenName, picUrl : userTokens[i].picUrl, addedToken:true   }
				}  	  
			  }

				for(const T_name in token_info){
				var network=token_info[T_name].network
				let networkToken = network=="ERC20" ? app.erc20: app.bep20;
                let balance = await networkToken.getBalance(token_info[T_name].contract,ret.address);
				let key = T_name.split('_')[0];
				if( (token_info[T_name].contract==token_info['SATT_BEP20'].contract) || (token_info[T_name].contract==token_info['WSATT'].contract)){
				   key = 'SATT'
				}
                 if(CryptoPrices.hasOwnProperty(key)) Total_balance+=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[key].price))
					 }
                     delete ret.address
					 for(const Amount in ret){
						let tokenSymbol = Amount.split('_')[0].toUpperCase();
						tokenSymbol = tokenSymbol === "ETHER" ? "ETH" : tokenSymbol;
                        let decimal =  tokenSymbol === "BTC" ? 8 : 18;
						Total_balance+=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(decimal)).toNumber() + "")*CryptoPrices[tokenSymbol].price))
					  }

						Total_balance=Total_balance.toFixed(2)

						return resolve({Total_balance});
	   }catch (e) {
				reject({message:e.message});
			}
	  })
	}



	  accountManager.getListCryptoByUid = async  (userId, crypto) => {
		return new Promise( async (resolve, reject) => {
		 try {
			let listOfCrypto=[];			
			var token_info=  Object.assign({}, app.config.Tokens);
			let sattContract=token_info['SATT'].contract;
			  delete token_info['SATT']
			  delete token_info['BNB']
			  var CryptoPrices = crypto;

				  var ret = await accountManager.getAccount(userId)
				  delete ret.btc
				  delete ret.version

			 let userTokens = await app.db.customToken().find({sn_users:  {$in: [userId]}}).toArray();
			  if(userTokens.length){
				for(let i = 0; i < userTokens.length; i++){
               let symbol = userTokens[i].symbol
			   if(token_info[symbol]) symbol = `${symbol}_${userTokens[i].network}`
			    token_info[symbol] = {dicimal : Number(userTokens[i].decimal), symbol :userTokens[i].symbol, network : userTokens[i].network, contract :userTokens[i].tokenAdress, name :userTokens[i].tokenName, picUrl : userTokens[i].picUrl, addedToken:true   }

				}  	  
			  }

			  for(let T_name in token_info){
				let network=token_info[T_name].network;
			        let crypto={};
				crypto.picUrl = token_info[T_name].picUrl || false;
				crypto.symbol=token_info[T_name].symbol.split("_")[0];
				crypto.name=token_info[T_name].name;
				crypto.AddedToken = token_info[T_name].addedToken ?  token_info[T_name].contract : false;
				crypto.contract=token_info[T_name].contract;
                crypto.decimal = token_info[T_name].dicimal
				crypto.network = network;
				crypto.undername=token_info[T_name].undername;
				crypto.undername2=token_info[T_name].undername2;
                [crypto.price,crypto.total_balance] = Array(2).fill(0.00);

             let networkToken = network=="ERC20" ? app.erc20: app.bep20;
             let balance = await networkToken.getBalance(token_info[T_name].contract,ret.address);
                       let key = T_name.split("_")[0];

			 if( (token_info[T_name].contract==token_info['SATT_BEP20'].contract) || (token_info[T_name].contract==token_info['WSATT'].contract)){
                key = 'SATT'
			 }
			 if(key == "WBNB") key = "BNB";
				  if(CryptoPrices.hasOwnProperty(key)){
              		crypto.price=CryptoPrices[key].price;
					crypto.variation=CryptoPrices[key].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(balance['amount']).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[key].price))*1		
				  }		
			     crypto.quantity=app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber());


			  listOfCrypto.push(crypto);

			}
			delete ret.address
			for(const Amount in ret){	
			      let crypto={}	
				let tokenSymbol = Amount.split('_')[0].toUpperCase();
				let decimal =  tokenSymbol === "BTC" ? 8 : 18;
				tokenSymbol = tokenSymbol === "ETHER" ? "ETH" : tokenSymbol;
				if(tokenSymbol == "BTC") {
					crypto.name='Bitcoin'
					crypto.network='BTC';
				};
				if(tokenSymbol == "ETH"){
					crypto.name='Ethereum';
					crypto.network='ERC20';
				} 
				if(tokenSymbol == "SATT") {
					crypto.name='SaTT'
					crypto.network='ERC20';
					crypto.contract=sattContract;
				}
				else if(tokenSymbol == 'BNB'){
					crypto.name='BNB';
					crypto.network='BEP20';
				}
				[crypto.symbol , crypto.undername, crypto.undername2] = Array(3).fill(tokenSymbol);
					crypto.price=CryptoPrices[tokenSymbol].price;
					crypto.variation=CryptoPrices[tokenSymbol].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(ret[Amount]).div(new Big(10).pow(decimal)).toNumber()+"")*CryptoPrices[tokenSymbol].price))
					crypto.quantity=new Big(ret[Amount]).div(new Big(10).pow(decimal)).toNumber().toFixed(8);
					listOfCrypto.push(crypto);
			  }
					resolve({listOfCrypto});
		 }catch (e) {
				  reject({message:e.message});
			  }
		})
	  }

	   /*
	@description: Script that loops & calculate users balances
	@params:
    condition : a condition when you should execute the script it should be ('daily','weekly','monthly')
	{headers}
	@Output saving users with updated balances with the according time frame
	*/
	  accountManager.BalanceUsersStats = async (condition)=> {

	   let today = (new Date()).toLocaleDateString("en-US");
	   let [currentDate, result]= [Math.round(new Date().getTime()/1000), {}];

	   [result.Date, result.convertDate] = [currentDate,today]

	   let Crypto =  app.account.getPrices();

	      var users_;

		let queryField = condition +'.convertDate'
		users_ = await app.db.sn_user().find({ $and:[{userSatt : true},{hasWallet:true}, {[queryField]: { $nin: [today] }}]},{projection: {daily: true,weekly:true,monthly:true }}).toArray();

		 let[counter, usersCount] = [0,users_.length];
		  while(counter<usersCount) {
			    let balance;

				var user = users_[counter];
				let id = user._id; //storing user id in a variable
				delete user._id

			if(!user[condition]){user[condition] = []}; //adding time frame field in users depending on condition if it doesn't exist.

			 balance = await accountManager.getBalanceByUid(id, Crypto);
			
			 result.Balance = balance["Total_balance"];

			 if(!result.Balance || isNaN(parseInt(result.Balance)) || result.Balance === null){
                counter++;
			} else{
			 user[condition].unshift(result);
			 if(user[condition].length>7){user[condition].pop();} //balances array should not exceed 7 elements
			 await app.db.sn_user().updateOne({_id:id}, {$set: user});
			 delete result.Balance ;
			 delete id;
             counter++;
			}

		}


}

accountManager.handleId=async function () {
	var Collection=await app.db.UsersId().findOne()
	var id =Collection.UserId
	
	var UpdateCollection = await app.db.UsersId().replaceOne({UserId:id},{UserId:(id+1)})
	let userId=UpdateCollection.ops[0].UserId
	if(UpdateCollection.result.nModified){
		return userId
	}else{
		return "error"
	}
  }





  accountManager.HandleReferral = async function (referral, userId) {
	let user = await app.db.sn_user().findOne({ _id: Long.fromNumber(referral) })

	if (user) {
		var CheckRef = await app.db.referral().findOne({ filleul: Long.fromNumber(userId) })

		if (CheckRef) {

			return { error: true, message: 'Already referred' }

		} else {

			await app.db.referral().insertOne({ parrain: Long.fromNumber(referral), filleul: Long.fromNumber(userId) })
			return { error: false, message: 'Referral successfully saved' }

		}

	} else {

		return { error: true, message: 'wrong referral code check again' }
	}
 }

    accountManager.notificationManager = async (id, NotifType, label)=>{

        let notification={
			idNode:"0"+id,
			type:NotifType,
			status:"done",
			label,
			isSeen:false,
			isSend:false,
			attachedEls:{
				id:id
		  },
		  created:new Date()
		}
	    
		await app.db.notification().insertOne(notification);
		let user = await app.db.sn_user().findOne({_id:+id},{projection: { fireBaseAccessToken: true,_id:false }});
               
		if(user.fireBaseAccessToken){
		let data= {
			"message":{
			  "token": user.fireBaseAccessToken,
			  "data": {
				  "obj":JSON.stringify(notification),                       
			  }
			}   
		  }
		  await app.notification.sendNotification(data)
		}
	}

	accountManager.isBlocked = async (user, auth=false)=>{

		let dateNow = Math.floor(Date.now() / 1000);
		var  res = false;
		let logBlock = {};
		if(auth){
		 if(user.account_locked){

			 if(accountManager.differenceBetweenDates(user.date_locked, dateNow) < app.config.lockedPeriod){        
			   logBlock.date_locked = dateNow
			   logBlock.failed_count = 0
			   res = true
			 } else{
			  logBlock.failed_count = 0
			  logBlock.account_locked = false
			   res = false
			 }

		 } 
		} else{
		  let failed_count = user.failed_count? user.failed_count + 1 : 1;  
		  logBlock.failed_count = failed_count 
		  if(failed_count == 1)logBlock.dateFirstAttempt =  dateNow;
		  if(user.account_locked){ 
			  logBlock.date_locked = dateNow  
			  logBlock.failed_count = 0
			  res= true
			}
		 else if (!user.account_locked  && (failed_count >= bad_login_limit) && accountManager.differenceBetweenDates(user.dateFirstAttempt, dateNow) < app.config.failInterval ) {
			logBlock.account_locked = true
			logBlock.failed_count = 0
			logBlock.date_locked = dateNow   
			res= true
		  } 
		  else if(failed_count >= bad_login_limit) logBlock.failed_count = 1
		}
	if(Object.keys(logBlock).length) await app.db.sn_user().updateOne({_id : user._id},{$set:logBlock})
        
		return {res,blockedDate:dateNow, auth};
		 
	  }


 accountManager.differenceBetweenDates=(authDate,dateNow)=>{
	return Math.ceil(Math.abs(dateNow * 1000 - authDate * 1000)/60000);   
	  }

	  accountManager.manageTime =()=>{
		var d = new Date();
		var date = d.getDate();
		var month = d.getMonth() + 1;
		var year = d.getFullYear();
		var seconds = d.getSeconds();
		var minutes = d.getMinutes();
		var hour = d.getHours();
		return year+ "-" + month + "-" + date+" "+hour+":"+minutes+":"+seconds
	   }



	   accountManager.getFacebookPages= (UserId,accessToken, isInsta=false)=>{
		return new Promise( async (resolve, reject) => {
			try {
			let message="account_linked_with_success";
			var instagram_id = false;
				   var accountsUrl = "https://graph.facebook.com/"+app.config.fbGraphVersion+"/me/accounts?fields=instagram_business_account,access_token,username,name,picture,fan_count&access_token="+accessToken;
		   
				   var res = await rp({uri:accountsUrl,json: true})
				   if(res.data.length===0){
					message="required_page"
				   }
				   else{
					while(true) {
		   
						for (var i = 0;i<res.data.length;i++) {
						  let page={UserId:UserId,username:res.data[i].username,token:res.data[i].access_token,picture:res.data[i].picture.data.url,name:res.data[i].name,subscribers:res.data[i].fan_count};
						  
						  if(res.data[i].instagram_business_account) {
							if(!isInsta){
							  message+="_instagram_facebook";
							  isInsta=true;
							}
							instagram_id = res.data[i].instagram_business_account.id;
							page.instagram_id=instagram_id;
							var media = "https://graph.facebook.com/"+app.config.fbGraphVersion+"/"+instagram_id+"?fields=username,followers_count&access_token="+accessToken;
							var resMedia = await rp({uri:media,json: true})
							page.instagram_username = resMedia.username;
							page.subscribers=resMedia.followers_count
						  }
						  await app.db.fbPage().updateOne({id:res.data[i].id,UserId},{$set:page},{ upsert: true });
						}
						if(!res.paging || !res.paging.next)
						{
						  break;
						}
						res = await rp({uri:res.paging.next,json: true})
					 }	   
		   
					if(!isInsta && res.data.length > 0) message+="_facebook";
				   }  
				   resolve(message)
				}catch (e) {
					reject({message:e.message});
				}
		})
	   }
	   accountManager.updateAndGenerateCode = async (_id,type) =>{
		return new Promise( async (resolve, reject) => {
			try{
				const code = Math.floor(100000 + Math.random() * 900000);
				let secureCode = {}
				secureCode.code=code, secureCode.expiring = (Date.now() + (3600*20)*5),secureCode.type = type;
				await app.db.sn_user().updateOne({_id},{$set:{secureCode}})
				resolve(code)
			}catch (e) {
					reject({message:e.message});
				}
		}) 
	   }

	   /*logger object of application logs */
	   accountManager.sysLogger = createLogger({
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss'
				}),
				format.printf(info => `${info.timestamp} ${info.message}`)        
			),    
			transports: [new transports.File({ filename: '/var/log/node-satt/app.log' })]		
		})

		/*logger object of application errors log */
		accountManager.errorLogger = createLogger({
			format: format.combine(
				format.timestamp({
					format: 'YYYY-MM-DD HH:mm:ss'
				}),
				format.printf(info => `${info.timestamp} ${info.message}`)        
			),    
			transports: [new transports.File({ filename: '/var/log/node-satt/app-error.log' })]		
		})

		/*global function to write into "app.log" all application's logs
			log: dateTime origin FN_name log's_data
		*/
	   	accountManager.sysLog = (source,origin,data/*,level="medium"*/)=>{
		//if(app.config.testnet /*|| level=="highest"*/){
			accountManager.sysLogger.log('info',` ${origin} FN_${source} ${data}`);
		//}
	   }
	   
	   /*global function to write into "app-error.log" all application's logs error 
	   		log: dateTime origin FN_name log's_data
	   */
	   accountManager.sysLogError = (data)=>{
		//if(app.config.testnet /*|| level=="highest"*/){
			let error = data.message?data.message:data.error
			accountManager.errorLogger.log('error',` ${error}`);
		//}
	   }

	   accountManager.log = (...arguments)=>{
        let logInfo = arguments.map((element)=>{ return JSON.stringify(element)}).join(' ');
		accountManager.sysLogger.log('info',logInfo);	
	   }

	   accountManager.getPrices = ()=>{
		if(app.prices.status && (Date.now() - (new Date(app.prices.status.timestamp)).getTime() < 1200000)) {

			return app.prices.data;
		}
		else {
			var r = child.execSync("curl \"https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD&CMC_PRO_API_KEY="+app.config.cmcApiKey+"\"");
			var response = JSON.parse(r);
			var r2 = child.execSync("curl \"https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SATT%2CJET&convert=USD&CMC_PRO_API_KEY="+app.config.cmcApiKey+"\"");
          	var responseSattJet = JSON.parse(r2);
			response.data.push(responseSattJet.data.SATT);
			response.data.push(responseSattJet.data.JET);

			var priceMap = response.data.map((elem) =>{
				var obj = {};
				obj = {symbol:elem.symbol,
					name:elem.name,
					price:elem.quote.USD.price,
					percent_change_24h:elem.quote.USD.percent_change_24h,
                    market_cap:elem.quote.USD.market_cap,
                    volume_24h:elem.quote.USD.volume_24h,
                    circulating_supply:elem.circulating_supply,
                    total_supply:elem.total_supply,
                    max_supply:elem.max_supply,
					logo: "https://s2.coinmarketcap.com/static/img/coins/128x128/"+elem.id+".png"
				}
				return obj;
			})
			var finalMap = {};
			for(var i=0;i<priceMap.length;i++)
			{
				finalMap[priceMap[i].symbol] = priceMap[i];
				delete(finalMap[priceMap[i].symbol].symbol);
			}

			for(var i=0;i<app.config.token200.length;i++)
			{
				var token = app.config.token200[i];
				if(finalMap[token.symbol]) {
					finalMap[token.symbol].network = token.platform.network;
					finalMap[token.symbol].tokenAddress = token.platform.token_address;
					finalMap[token.symbol].decimals = token.platform.decimals;
				}
			}
		}
		response.data = finalMap;
		app.prices = response;

		return finalMap;

	  }


	app.account = accountManager;
	return app;
}

//push test
