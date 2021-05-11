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


	accountManager.getBalanceByUid = async  (userId, crypto) => {	
      return new Promise( async (resolve, reject) => {
       try {
          var token_info=app.config.Tokens
			delete token_info['SATT']
			delete token_info['BNB']		
			var CryptoPrices = crypto;
			var count = await accountManager.hasAccount(userId);

			var ret = {err:"no_account"};
			var Total_balance=0
            if(count)
			{
				var ret = await accountManager.getAccount(userId)
				delete ret.btc
				delete ret.version
			}else{
				resolve(ret);
			}
            for(const T_name in token_info){
				var network=token_info[T_name].network
				 if(network=="ERC20"){
					balance = await app.erc20.getBalance(token_info[T_name].contract,ret.address);
					if(token_info[T_name].contract==token_info['WSATT'].contract){
						Total_balance+=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices['SATT'].price))*1
					}else{
						Total_balance+=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[T_name].price))*1
					}
				  }else{
					 balance = await app.bep20.getBalance(token_info[T_name].contract,ret.address);
					if(token_info[T_name].contract==token_info['SATT_BEP20'].contract){
						Total_balance+=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices['SATT'].price))*1
					}else{
						Total_balance+=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[T_name].price))*1
					}
				  }
				 }
	
				 for(const Amount in ret){
					if(Amount=="ether_balance"){
						Total_balance+=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['ETH'].price))*1
					}else if(Amount=="satt_balance"){
						Total_balance+=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['SATT'].price))*1
					}else if(Amount=="bnb_balance"){
						Total_balance+=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['BNB'].price))*1
					}else if(Amount=="btc_balance"){
						Total_balance+=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(8)).toNumber() + "")*CryptoPrices['BTC'].price))*1
					}
				  }
				  Total_balance=Total_balance.toFixed(2)

				  resolve({Total_balance});
	   }catch (e) {
				reject({message:e.message});
			}
	  })
	}	

	accountManager.getListCryptoByUid = async  (userId, crypto) => {	
		return new Promise( async (resolve, reject) => {
		 try {
			var token_info=app.config.Tokens
			  delete token_info['SATT']
			  delete token_info['BNB']		
			  var CryptoPrices = crypto;
			  var count = await accountManager.hasAccount(userId);
  
			   var ret = {err:"no_account"};
			  if(count)
			  {
				  var ret = await accountManager.getAccount(userId)
				  delete ret.btc
				  delete ret.version
			  }else{
				resolve(ret);
			  }
			  listOfCrypto=[];
			  for(const T_name in token_info){
				var network=token_info[T_name].network;
				crypto={};
				crypto.symbol=token_info[T_name].symbol;
				crypto.name=token_info[T_name].name;
				crypto.undername=token_info[T_name].undername;
				crypto.undername2=token_info[T_name].undername2;
				if(network=="ERC20"){
				balance = await app.erc20.getBalance(token_info[T_name].contract,ret.address);				
				   if(token_info[T_name].contract==token_info['WSATT'].contract){
					crypto.price=CryptoPrices['SATT'].price;
					crypto.variation=CryptoPrices['SATT'].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices['SATT'].price))*1
				   }else {
					crypto.price=CryptoPrices[T_name].price;
					crypto.variation=CryptoPrices[T_name].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[T_name].price))*1

					}
				}else{
				balance = await app.bep20.getBalance(token_info[T_name].contract,ret.address);
					if( token_info[T_name].contract==token_info['SATT_BEP20'].contract){
					crypto.price=CryptoPrices['SATT'].price;
					crypto.variation=CryptoPrices['SATT'].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices['SATT'].price))*1

				}	else {
					crypto.price=CryptoPrices[T_name].price;
					crypto.variation=CryptoPrices[T_name].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber() + "")*CryptoPrices[T_name].price))*1

				}	 	  
			  }
			  crypto.quantity=app.token.filterAmount(new Big(balance['amount']*1).div(new Big(10).pow(token_info[T_name].dicimal)).toNumber());
			  listOfCrypto.push(crypto);

			}
			for(const Amount in ret){
				crypto={}
				if(Amount=="ether_balance"){
					crypto.symbol='ETH';
					crypto.name='Ethereum';
					crypto.undername='ETH';
					crypto.undername2='ETH'; 
					crypto.price=CryptoPrices['ETH'].price;
					crypto.variation=CryptoPrices['ETH'].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['ETH'].price))*1
					crypto.quantity=app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber());
					listOfCrypto.push(crypto);
				}else if(Amount=="satt_balance"){
					crypto.total_balance=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['SATT'].price))*1
					crypto.symbol='SATT';
					crypto.name='SaTT';
					crypto.undername='SATT';
					crypto.undername2='SATT'; 
					crypto.price=CryptoPrices['SATT'].price;
					crypto.variation=CryptoPrices['SATT'].percent_change_24h;
					crypto.quantity=app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber());
					listOfCrypto.push(crypto);
				}else if(Amount=="bnb_balance"){
					crypto.symbol='BNB';
					crypto.name='BNB';
					crypto.undername='(SMART CHAIN)';
					crypto.undername2='BNB'; 
					crypto.price=CryptoPrices['BNB'].price;
					crypto.variation=CryptoPrices['BNB'].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber() + "")*CryptoPrices['BNB'].price))*1
					crypto.quantity=app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(18)).toNumber());
					listOfCrypto.push(crypto);
				}else if(Amount=="btc_balance"){
					crypto.symbol='BTC';
					crypto.name='Bitcoin';
					crypto.undername='BTC';
					crypto.undername2='BTC'; 
					crypto.price=CryptoPrices['BTC'].price;
					crypto.variation=CryptoPrices['BTC'].percent_change_24h;
					crypto.total_balance=((app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(8)).toNumber() + "")*CryptoPrices['BTC'].price))*1
					crypto.quantity=app.token.filterAmount(new Big(ret[Amount]*1).div(new Big(10).pow(8)).toNumber());	
					listOfCrypto.push(crypto);
				}

			  }
				  	
					resolve({listOfCrypto,count});
		 }catch (e) {
				  reject({message:e.message});
			  }
		})
	  }

	accountManager.BalanceUsersStats = async (condition)=> {
		debugger;
		try{

	   let date = Math.round(new Date().getTime()/1000);
	   let balance;
	   let result = {};
       result.Date = date;

	   const Fetch_crypto_price = {
		method: 'GET',
		uri: 'https://3xchange.io/prices',
		json: true,
		gzip: true
	  };

	   let Crypto = await rp(Fetch_crypto_price);

	   	var users_ = await app.db.sn_user().find({userSatt : true}).toArray();
		var usersCount = users_.length; 
	  	var counter = 0;

		  while(counter<usersCount) {
				var user = users_[counter];

				if(!user.daily){user.daily = []};
				if(!user.weekly){user.weekly = []};
				if(!user.monthly){user.monthly = []};
	 
			 balance = await accountManager.getBalanceByUid(user._id, Crypto);
	 
			 if(condition === "daily"){
				   result.Balance = balance;
					  user.daily.unshift(result);
						if(user.daily.length>7){user.daily.pop();}
						  await app.db.sn_user().save(user);
						  counter++;
			 console.log("count : ", counter );
			 console.log("user Inserted : ", user );
			 }
	 
			 if(condition === "weekly"){
				 result.Balance = balance;
					  user.weekly.unshift(result)	
						if(user.weekly.length > 7){user.weekly.pop();}
							  await  app.db.sn_user().save(user);
							  counter++;
							  console.log("count : ", counter );
							  console.log("user Inserted : ", user );
							}
	 
			 if(condition === "monthly" && balance.Total_balance){
				 result.Balance = balance.Total_balance
					 user.monthly.unshift(result)
					   if(user.monthly.length > 7){user.monthly.pop();}
										  await   app.db.sn_user().save(user);
										  counter++;
										  console.log("count : ", counter );
										  console.log("user Inserted : ", user );
			 }

		}	   
   } catch (err) {
	   console.log(err)
   }
}


	app.account = accountManager;
	return app;
}

//push test
