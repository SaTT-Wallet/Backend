var connection;

var express = require('express');
var app = express();
(connection = async function (){
    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
    app = await require("../crm/crm")(app);
    app = await require("../fb/fb_init")(app);
    app = await require("../web3/oracle")(app);
    
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

        console.log(token);
        console.log("boddy");

        console.log(req.body);
        console.log(req.body.pass);


       
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

}

exports.transfertBep20= async(req,res)=>{


//     try {
//         var currency = req.body.symbole
//         var to = req.body.to;
//         var amount = req.body.amount;
//         var decimal = req.body.decimal;
//         var pass = req.body.pass;
//         const token = req.headers["authorization"].split(" ")[1];
//         var res =	await app.crm.auth(token);

//         var cred = await app.account.unlockBSC(res.id,pass);
//         cred.from_id = res.id;
//         req.body.token = !req.body.token ? "0x448bee2d93be708b54ee6353a7cc35c4933f1156": req.body.token;
//         var result = await app.account.getAccount(res.id);
//         let balance = await app.bep20.getBalance(req.body.token,result.address);
//         if(new Big(amount).gt(new Big(balance.amount)))
//         response.end(JSON.stringify({message:"not_enough_budget"}));

//         var ret = await app.bep20.sendBep20(req.body.token,to,amount,cred);
        
//         response.end(JSON.stringify(ret));
//     } catch (err) {
//             response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
//     }
//     finally {
// cred && app.account.lockBSC(cred.address)
// if(ret && ret.transactionHash){
//     await app.account.notificationManager(res.id, "transfer_event",{amount, network :'BEP20', to :req.body.to , transactionHash : ret.transactionHash, currency, decimal})	
//     const wallet = await app.db.wallet().findOne({"keystore.address" : to.substring(2)},{projection: { UserId: true }});
//     if(wallet){
//         await app.account.notificationManager(wallet.UserId, "receive_transfer_event",{amount, network :'BEP20', from :cred.address , transactionHash : ret.transactionHash, currency,decimal} )
//     }

// }
//     }




}
