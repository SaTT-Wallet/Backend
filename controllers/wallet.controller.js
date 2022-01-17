var connection;

var express = require('express');

const Big = require('big.js');
var rp = require('request-promise');



var app = express();
(connection = async function (){
    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
    app = await require("../crm/crm")(app);
    app = await require("../fb/fb_init")(app);
    app = await require("../web3/oracle")(app);
    app= await require('../manager/notification')(app)

    app = await require("../web3/provider")(app);
    app = await require("../manager/bep20")(app);   

     app = await require("../web3/campaign")(app);
    app = await require("../web3/satt")(app);
     app = await require("../web3/eth")(app);
     app = await require("../web3/erc20")(app);

    app = await require("../manager/account")(app);
    app = await require("../web3/initcontracts")(app);


})();

exports.mywallet= async(req, response)=>{

    try{
        let token = req.headers["authorization"].split(" ")[1];

        var res =	await app.crm.auth(token);
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

}




exports.userBalance= async(req, response)=>{

	try {
  
          const token = req.headers["authorization"].split(" ")[1];

          var auth =	await app.crm.auth(token);
          let Crypto =  app.account.getPrices();

          const balance = await app.account.getListCryptoByUid(auth.id,Crypto);

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

    var gasPrice = await app.web3.eth.getGasPrice();
			res.end(JSON.stringify({gasPrice:(gasPrice/1000000000)}));


}



exports.prices= async(req, res)=>{
    var prices = app.account.getPrices()
		res.end(JSON.stringify(prices))
}

exports.totalBalances= async(req, res)=>{
    try {
        
          const token = req.headers["authorization"].split(" ")[1];
          var auth =	await app.crm.auth(token);
          var id = auth.id;
      let Crypto =  app.account.getPrices(); 
      
      let variation = 0.00
      var Total_balance = await app.account.getBalanceByUid(id, Crypto);

      res.end(JSON.stringify({Total_balance, variation})).status(201);

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
        let balance = await app.erc20.getBalance(tokenERC20,result.address);

        if(new Big(amount).gt(new Big(balance.amount)))

        response.end(JSON.stringify({message:"not_enough_budget"}));
        var ret = await app.erc20.transfer(tokenERC20,to,amount,cred);
        
        response.end(JSON.stringify(ret));
    } catch (err) {
            response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }
    finally {
            // cred && app.account.lock(cred.address);
            // if(ret && ret.transactionHash){
            //     await app.account.notificationManager(res.id, "transfer_event",{amount,currency,to, transactionHash : ret.transactionHash, network : "ERC20", decimal} )
            //     const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
               
            //     if(wallet){
            //         await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount,currency,from :cred.address, transactionHash : ret.transactionHash, network : "ERC20",decimal } )
            //     }

            // }
    }

}

exports.transfertBep20= async(req,response)=>{

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


        console.log(req.body);
        var result = await app.account.getAccount(res.id);

        console.log("result", result);
        let balance = await app.bep20.getBalance(req.body.token,result.address);
       
        console.log("balance", balance);

        if(new Big(amount).gt(new Big(balance.amount)))
        response.end(JSON.stringify({message:"not_enough_budget"}));

        var ret = await app.bep20.sendBep20(req.body.token,to,amount,cred);
        console.log('ret', ret);
        response.end(JSON.stringify(ret));
    } catch (err) {

        console.log(err);
            response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }
    finally {


  //cred && app.account.lockBSC(cred.address)
// if(ret && ret.transactionHash){
//     await app.account.notificationManager(res.id, "transfer_event",{amount, network :'BEP20', to :req.body.to , transactionHash : ret.transactionHash, currency, decimal})	
//     const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
//     if(wallet){
//         await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount, network :'BEP20', from :cred.address , transactionHash : ret.transactionHash, currency,decimal} )
//     }

// }
    }

}


exports.checkWalletToken= async(req,res)=>{
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

}


exports.addNewToken= async(req,res)=>{


    try {

        console.log(("start"));
        const token = req.headers["authorization"].split(" ")[1];
        let auth = await app.crm.auth(token);
        let customToken = {};
        let [tokenAdress,symbol,decimal,network] = [req.body.tokenAdress,req.body.symbol,req.body.decimal,req.body.network]
        
        let tokenExist =  await app.db.customToken().findOne({tokenAdress,symbol,decimal,network,sn_users:{$in: [auth.id]} });

        if(tokenExist){
            res.send(JSON.stringify({error:"token already added"}));
            return;
        }


        console.log("app",app.config.xChangePricesUrl);

        console.log("body", req.body);
       
          let CryptoPrices =  app.account.getPrices();
       //   console.log("CryptoPrices", CryptoPrices);

        let tokenFounded = await app.db.customToken().findOne({tokenAdress,symbol,decimal,network});
        
        console.log("body",tokenFounded);

        if(!tokenFounded){


            console.log(app.config.cmcUrl , symbol);
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
       console.log("metaData", metaData);			
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

        console.log(err);
        res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
     }

}




