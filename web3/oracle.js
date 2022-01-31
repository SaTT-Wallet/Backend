module.exports = async function (app) {

	var fs = require("fs");
	var child = require('child_process');

	var ContractToken = {};
	ContractToken.isDeplyed = false;

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);


	ContractToken.eventCallback = async function(evt){



		if( evt.signature != "0xb67322f1a9b0ad182e2b242673f8283103dcd6d1c8a19b47ff5524f89d9758ed" || evt.event != "AskRequest" || evt.event == "AskRequestBounty")
		{
			return;
		}

		var isBounty = ( evt.event == "AskRequestBounty");


		var idRequest = isBounty?evt.returnValues.idProm: evt.returnValues.idRequest ;
		var typeSN = ""+evt.returnValues.typeSN;
		var idPost = evt.returnValues.idPost;
		var idUser = evt.returnValues.idUser;


		var request = await app.db.request().findOne({id: idRequest});
		if(!request) {

			var answer = {
				_id : idRequest,
				id : idRequest,
				date :Date.now(),
				typeSN:typeSN,
				idPost:idPost,
				idUser:idUser,
				isBounty:isBounty,
				isNew:true
			}

			await app.db.request().insertOne(answer);


		}
		else {
			console.log("response already sent");
		}

	}


	ContractToken.answerOne = async (typeSN,idPost,idUser,type=null,linkedinProfile=null) =>{
		switch(typeSN) {
				case "1" :
					var res = await app.oracle.facebook(idUser,idPost);

				break;
				case "2" :
					var res = await app.oracle.youtube(idPost);

				break;
				case "3" :
					var campaign_link = await app.db.campaign_link().findOne({idPost});
					var userWallet=await app.db.wallet().findOne({"keystore.address":campaign_link.id_wallet.toLowerCase().substring(2)});
					var res = await app.oracle.instagram(userWallet.UserId,idPost);

				break;
				case "4" :
					var res = await app.oracle.twitter(idUser,idPost)

				break;
				case "5" :
					var res = await app.oracle.linkedin(idUser,idPost,type,linkedinProfile)

				break;
				default :
					var res = {likes:0,shares:0,views:0,date:Date.now()};
				break;
			}

			return res;
	}

	ContractToken.answerAbos = async (typeSN,idPost,idUser,linkedinProfile=null)=> {
		switch(typeSN) {
				case "1" :
					var res = await app.oracle.facebookAbos(idUser,idPost);

				break;
				case "2" :
					var res = await app.oracle.youtubeAbos(idPost);

				break;
				case "3" :
					var res = await app.oracle.instagramAbos(idPost)

				break;
				case "4" :
					var res = await app.oracle.twitterAbos(idUser,idPost)

				break;
				case "5" :
					var res = await app.oracle.linkedinAbos(linkedinProfile,idUser)

				break;
				default :
					var res = 0;
				break;
			}

			return res;
	}

	ContractToken.limitStats = (typeSN,stats,ratios,abos, limit="") =>{
       if(!limit){
		var limits = ratios[4];
		limit = limits[parseInt(typeSN)-1];
	   }
		if(limit>0)
			{
				limit = parseFloat(limit);
				var max = Math.ceil(limit*parseFloat(abos)/100);
				if(+stats.views > max) {
					stats.views = max;
				}
				if(+stats.likes > max) {
					stats.likes = max
				}
				if(+stats.shares > max) {
					stats.shares = max
				}
			}

			return stats;
	}

	ContractToken.checkAnswer = async function () {

		app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
		app.web3Bep20.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);

		var requests = await app.db.request().find({isNew: true,isBounty:false}).toArray();
		for(var i = 0;i<requests.length;i++)
		{
			var request = requests[i];
			switch(request.typeSN) {
				case "1" :
					var res = await app.oracle.facebook(request.idUser,request.idPost);

				break;
				case "2" :
					var res = await app.oracle.youtube(request.idPost);

				break;
				case "3" :
					var res = await app.oracle.instagram(request.idPost)

				break;
				case "4" :
					var res = await app.oracle.twitter(request.idUser,request.idPost)

				break;
				default :
				break;
			}

			var prevstat = await app.db.request().find({isNew:false,typeSN:request.typeSN,idPost:request.idPost,idUser:request.idUser}).sort({date: -1}).toArray();
			if(prevstat.length && ( prevstat[0].likes >= res.likes || prevstat[0].shares >= res.shares || prevstat[0].views >= res.views))
			{
				await app.db.request().deleteOne({_id:request.id});

			}
			else {
				await app.db.request().updateOne({_id:request.id},{$set:{likes:res.likes,shares:res.shares,views:res.views,isNew:false}});
				await ContractToken.answerCall({from:app.config.oracleOwner,campaignContract:app.campaign.contract.options.address,idRequest:request.id,likes:res.likes,shares:res.shares,views:res.views});
			}
		}


	}

	ContractToken.checkAnswerBounty = async function () {
		try{
			app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			app.web3Bep20.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);

			var requests = await app.db.request().find({isNew: true,isBounty:true}).toArray();
			for(var i = 0;i<requests.length;i++)
			{
				var request = requests[i];

				var nbAbos = ContractToken.answerAbos(request.typeSN,request.idPost,request.idUser);
				await app.db.request().updateOne({_id:request.id},{$set:{likes:res.likes,shares:res.shares,views:res.views,isNew:false}});
				await ContractToken.answerBounty({from:app.config.oracleOwner,campaignContract:app.campaign.contract.options.address,idProm:request.id,nbAbos:nbAbos});

			}
		}
		catch (err)
		{
			reject(err);
		}
	}



	ContractToken.followContract = async function () {
		if(app.config.testnet) {
			ContractToken.contract = new app.web3.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.testnet);
		}
		else {
			ContractToken.contract = new app.web3.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.mainnet);
		}

		ContractToken.contract.getGasPrice = async function () {
		 var gas = await app.web3.eth.getGasPrice();
		 return gas;
		}

		if(app.config.testnet)
		{
			ContractToken.contractBep20 = new app.web3Bep20.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.testnetBep20);
			ContractToken.contractBep20WS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.testnetBep20);
		}
		else
		{
			ContractToken.contractBep20 = new app.web3Bep20.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.mainnetBep20);
			ContractToken.contractBep20WS = new app.web3Bep20Websocket.eth.Contract(app.config.ctrs.oracle.abi,app.config.ctrs.oracle.address.mainnetBep20);
		}





		ContractToken.contractBep20.getGasPrice = async function () {
		 var gas = await app.web3Bep20.eth.getGasPrice();
		 return gas;
		}

		ContractToken.contract.events.AskRequest().on('data', async (event) => {
			await ContractToken.eventCallback(event);
		});

		ContractToken.contractBep20WS.events.allEvents  (async function(err,evt) {
					await ContractToken.eventCallback(evt);
		});

	
		ContractToken.isDeplyed = true;

	}

	ContractToken.addCampaign = async function (addr) {
		return new Promise(async (resolve, reject) => {
			app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			var gas = await ContractToken.contract.methods.changeAsk(addr,true).estimateGas();
			var gasPrice = await app.web3.eth.getGasPrice();
			ContractToken.contract.methods.changeAsk(addr,true).send({from: app.config.oracleOwner,gas:gas,gasPrice: gasPrice})
			.on('transactionHash', function(hash){
				console.log("transactionHash",hash);
				resolve({result : "OK",hash:hash});
				headerSent = true;
			})
			.on('receipt', function(receipt){
				console.log("receipt")
			})
			.on('confirmation', function(confirmationNumber, receipt){
				console.log('confirmation',confirmationNumber);

			})
			.on('error', function(error){
				if(!headerSent)
					reject({error : ""+error});
				console.log("oracle error:",error);

			});
		})
	}


	ContractToken.answerCall = async function (opts) {
		return new Promise(async (resolve, reject) => {
			var ctr;
		if(opts.campaignContract == app.config.ctrs.campaign.address.mainnet || opts.campaignContract == app.config.ctrs.campaign.address.testnet ) {
			ctr = ContractToken.contract;
			ctr.getGasPrice =  app.web3.eth.getGasPrice;
		}
		else {
			ctr = ContractToken.contractBep20;
			ctr.getGasPrice =  app.web3Bep20.eth.getGasPrice;
		}

		console.log("opts",opts);

		app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
		app.web3Bep20.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);

			var headerSent = false;
			var gasPrice = await ctr.getGasPrice();

			//var gas = await ContractToken.contract.methods.answer(opts.campaignContract,opts.idRequest,opts.likes,opts.shares,opts.views).estimateGas({from: opts.from,value:0});

			var receipt = await  ctr.methods.answer(opts.campaignContract,opts.idRequest,opts.likes,opts.shares,opts.views).send({from: opts.from,gas:500000,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("oracle answerCall transactionHash",hash)});
			resolve({result : "OK",hash:receipt.hash});

		});

	}

	ContractToken.answerBounty = async function (opts) {
		return new Promise(async (resolve, reject) => {
			try {
			var ctr;
		if(opts.campaignContract == app.config.ctrs.campaign.address.mainnet || opts.campaignContract == app.config.ctrs.campaign.address.testnet ) {
			ctr = ContractToken.contract;
			ctr.getGasPrice =  app.web3.eth.getGasPrice;
		}
		else {
			ctr = ContractToken.contractBep20;
			ctr.getGasPrice =  app.web3Bep20.eth.getGasPrice;
		}

		app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
		app.web3Bep20.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);


			var gasPrice = await ctr.getGasPrice();

			var receipt = await  ctr.methods.answerBounty(opts.campaignContract,opts.idProm,opts.nbAbos).send({from: opts.from,gas:500000,gasPrice: gasPrice}).once('transactionHash', function(hash){console.log("oracle answerBounty transactionHash",hash)});
			resolve({result : "OK",hash:receipt.hash});
		}
		catch (err)
		{
			reject(err);
		}
		});

	}

	ContractToken.checkSocialUser = async function (typeSN,id) {

		return new Promise(async (resolve, reject) => {
			try {
				let userId;
				switch (typeSN) {
					case "1" || "3":
						fbProfile = await app.db.fbProfile().findOne({id:id});
						userId=fbProfile.UserId;	 
					break;
					case "2":
					googleProfile = await app.db.googleProfile().findOne({google_id:id });
					userId=googleProfile.UserId;
					break;
					case "4":
					var twitterProfile = await app.db.twitterProfile().findOne({twitter_id:id});
					userId=twitterProfile.UserId;
					break;
					case "5":
					var linkedinProfile = await app.db.linkedinProfile().findOne({linkedinId:id});
					userId=linkedinProfile.userId;
					break;
					
				}
				resolve(userId);
	
				
			}
			catch (err)
			{
				reject(err);
			}

	}
	)
	}



	app.oracleManager = ContractToken;




	return app;
}
