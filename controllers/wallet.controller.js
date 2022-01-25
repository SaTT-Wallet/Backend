


var requirement= require('../helpers/utils')
// const rp = require('request-promise');
// const {randomUUID}= require('crypto');
// const { v5 : uuidv5 } = require('uuid');
// const Big = require('big.js');

var connection;
let app
(connection = async  ()=>{
    app = await requirement.connection();
    // app = await require("../web3/provider")(app);
    // app = await require("../web3/eth")(app);
	// app = await require("../web3/erc20")(app); 
})();





exports.exportBtc=async(req,response)=>{

    var pass = req.body.pass;
    response.attachment();

    try {
        let token=await app.crm.checkToken(req,res);
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

}

exports.exportEth=async(req,response)=>{
    var pass = req.body.pass;
    response.attachment();

    try {
        let token=await app.crm.checkToken(req,res);
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

}

exports.mywallet= async(req, response)=>{

    try{

        var count = await app.account.hasAccount(req.user._id);
        var ret = {err:"no_account"};

        if(count)
        {
            var ret = await app.account.getAccount(req.user._id);

        }
        
        response.end(JSON.stringify(ret));

    } catch (err) {
        response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }

}




exports.userBalance= async(req, response)=>{

	try {

          let Crypto =  app.account.getPrices();
          const balance = await app.account.getListCryptoByUid(req.user._id,Crypto);

          let listOfCrypto = [...new Set(balance.listOfCrypto)];
        response.send(JSON.stringify({listOfCrypto}))
    }catch (err) {
       response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }

}

exports.gasPriceBep20= async(req,res)=>{

    var gasPrice = await app.web3Bep20.eth.getGasPrice();
    res.end(JSON.stringify({gasPrice:(gasPrice/1000000000)}));
}


exports.gasPriceErc20= async(req,res)=>{


    let app= await requirement.connection()

    var gasPrice = await app.web3.eth.getGasPrice();
			res.end(JSON.stringify({gasPrice:(gasPrice/1000000000)}));


}



exports.cryptoDetails= async(req, res)=>{

    var prices = app.account.getPrices()
		res.end(JSON.stringify(prices))
}

exports.totalBalances= async(req, res)=>{
    try {

        /*let token=await app.crm.checkToken(req,res);
        var auth =	await app.crm.auth(token);*/
        var id = /*auth.id*/req.user._id;
        let Crypto =  app.account.getPrices(); 
      
      var Total_balance = await app.account.getBalanceByUid(id, Crypto);
      res.end(JSON.stringify({Total_balance:Total_balance.Total_balance})).status(201);

    } catch (err) {
        res.end(JSON.stringify({error:err.message?err.message:err.error}))
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
}


exports.transfertErc20= async(req,response)=>{
	try {

        let token=await app.crm.checkToken(req,res);
        var res =	await app.crm.auth(token);
        var tokenERC20 = req.body.token;
        var to = req.body.to;
        var amount = req.body.amount;
        var pass = req.body.pass;
        var currency=req.body.symbole;
        var decimal = req.body.decimal;
        var cred = await app.account.unlock(res.id,pass);
        cred.from_id = res.id;
        var result = await app.account.getAccount(res.id);
        let balance = await app.erc20.getBalance(tokenERC20,result.address);
        if(new Big(amount).gt(new Big(balance.amount))){
            response.end(JSON.stringify({message:"not_enough_budget"}));
            return;
        }
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

}

exports.transfertBep20= async(req,response)=>{

    try {

        var currency = req.body.symbole
        var to = req.body.to;
        var amount = req.body.amount;
        var decimal = req.body.decimal;
        var pass = req.body.pass;
        let token=await app.crm.checkToken(req,res);
        var res =	await app.crm.auth(token);
        var cred = await app.account.unlockBSC(res.id,pass);
        cred.from_id = res.id;
        req.body.token = !req.body.token ? "0x448bee2d93be708b54ee6353a7cc35c4933f1156": req.body.token;


        var result = await app.account.getAccount(res.id);

        let balance = await app.bep20.getBalance(req.body.token,result.address);
       
        if(new Big(amount).gt(new Big(balance.amount))){
            response.end(JSON.stringify({message:"not_enough_budget"}));
            return;
        }
       
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

}


exports.checkWalletToken= async(req,res)=>{
    try {

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

}


exports.addNewToken= async(req,res)=>{

    try {

        /*let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);*/
        let customToken = {};
        let [tokenAdress,symbol,decimal,network] = [req.body.tokenAdress,req.body.symbol,req.body.decimal,req.body.network]
        
        let tokenExist =  await app.db.customToken().findOne({tokenAdress,symbol,decimal,network,sn_users:{$in: [req.user._id]} });

        if(tokenExist){
            res.send(JSON.stringify({error:"token already added"}));
            return;
        }

          let CryptoPrices =  app.account.getPrices();

        let tokenFounded = await app.db.customToken().findOne({tokenAdress,symbol,decimal,network});
        
        if(!tokenFounded){
            customToken = req.body;
            customToken.sn_users = [req.user._id]
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
            await app.db.customToken().updateOne({_id:app.ObjectId(id)},{$push:{sn_users:req.user._id}});
        }
        res.end(JSON.stringify({message:"token added"}))
    }catch (err) {

        res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
     }

}


exports.transfertBtc= async(req , response)=>{


    try {


        var pass = req.body.pass;

        /*let token=await app.crm.checkToken(req,res);
        var res =	await app.crm.auth(token);*/
        var cred = await app.account.unlock(req.user._id,pass);
        var result = await app.account.getAccount(req.user._id);
        if(new Big(req.body.val).gt(new Big(result.btc_balance))){
                response.end(JSON.stringify({message:"not_enough_budget"}));
                return;
        }    
        var hash = await app.cryptoManager.sendBtc(req.user._id,pass, req.body.to,req.body.val);
        response.end(JSON.stringify({hash}));

    } catch (err) {
        response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }
    finally {
            if(cred)
        app.account.lock(cred.address);
    }

}


exports.transfertBNB= async(req , response)=>{

    var pass = req.body.pass;

	try {


        /*let token=await app.crm.checkToken(req,res);
		var res =	await app.crm.auth(token);*/
		var cred = await app.account.unlockBSC(req.user._id,pass);
		cred.from_id = req.user._id;
		var to = req.body.to;
		var amount = req.body.val;
		var result = await app.account.getAccount(req.user._id);
            if(new Big(amount).gt(new Big(result.bnb_balance))){
                response.end(JSON.stringify({message:"not_enough_budget"}));
                return;
            }
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

}


exports.transfertEther= async(req , response)=>{

    var pass = req.body.pass;
    var to = req.body.to;
    var amount = req.body.val;
    try {

        /*let token=await app.crm.checkToken(req,res);
        var res =	await app.crm.auth(token);*/
        var result = await app.account.getAccount(req.user._id);
        if(new Big(amount).gt(new Big(result.ether_balance))){
            response.end(JSON.stringify({message:"not_enough_budget"}));
            return;
        }
        var cred = await app.account.unlock(req.user._id,pass);
        cred.from_id = req.user._id;
        var ret = await app.cryptoManager.transfer(to,amount,cred);
        response.end(JSON.stringify(ret));
    } catch (err) {
        response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }
    finally {
        if(cred) app.account.lock(cred.address);
        if(ret.transactionHash){
            await app.account.notificationManager(req.user._id, "transfer_event",{amount,currency :'ETH',to, transactionHash : ret.transactionHash, network : "ERC20"})
            const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
            if(wallet){
            
                await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency :'ETH',from : cred.address, transactionHash : ret.transactionHash, network : "ERC20"})
            }
        }
}

}

exports.getQuote = async (req, res)=>{

    try {

        /*let token=await app.crm.checkToken(req,res);
        var auth = await app.crm.auth(token);*/
        let requestQuote = req.body;
        requestQuote["end_user_id"]= String(req.user._id);
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
    }


}


exports.payementRequest = async(req , res)=>{

    try {

        /*let token=await app.crm.checkToken(req,res);
		var auth = await app.crm.auth(token);*/
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "";
        if (ip) ip = ip.split(":")[3];
		let payment_id=randomUUID();
		const uiad = app.config.uiad;	

		let user_agent = req.headers['user-agent'];
		const http_accept_language =  req.headers['accept-language'];
		let user = await app.db.sn_user().findOne({_id:req.user._id},{projection: { email: true, phone: true,created:true}});

		let request = {};
		request._id = req.user._id.toString(), request.installDate=user.created


		request.email=user.email,request.addressIp=ip,request.user_agent = user_agent;
		request.language=http_accept_language;

		request.quote_id = req.body.quote_id
		request.order_id =  uuidv5(app.config.orderSecret, uiad);
	
		request.uuid = payment_id

		request.currency = req.body.currency;
		request.idWallet= req.body.idWallet;




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
		paymentSubmitted && app.account.log(`requestedPayment by ${req.user._id}` )	
	}


}



exports.bridge= async(req , res)=>{


    let access_T=await app.crm.checkToken(req,res);
    let Direction = req.body.direction;
    let pass = req.body.password;
    let amount = req.body.amount;
    var sattContract=app.config.ctrs.token.address.mainnet;
    if(app.config.testnet){
        sattContract=app.config.ctrs.token.address.testnet
    }
    try {
        var auth = await app.crm.auth(access_T);
        var network;
        var ret;
        if (Direction == "ETB") {
            network = "ERC20";
            var cred = await app.account.unlock(auth.id,pass);

            ret = await app.erc20.transfer(
                sattContract,
                app.config.bridge,
                amount,
                cred
            );
        } else if (Direction == "BTE") {
            network = "BEP20";
            var cred = await app.account.unlockBSC(auth.id,pass);
            ret = await app.bep20.transferBEP(app.config.bridge, amount, cred);
        }
        

        res.end(JSON.stringify(ret));
    } catch (err) {
        res.end(JSON.stringify(err));
    } finally {
        if (cred) app.account.lock(cred.address);
        if(ret.transactionHash){
            await app.account.notificationManager(auth.id,"convert_event",{amount,Direction,transactionHash : ret.transactionHash,currency :'SATT', network})		
        }
    }

}







