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

	try {

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

exports.gasPrice= async(req,res)=>{

    var gasPrice = await app.web3Bep20.eth.getGasPrice();
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


