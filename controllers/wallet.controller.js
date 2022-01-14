var connection;

var express = require('express');
var app = express();
(connection = async function (){
    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
    app = await require("../crm/crm")(app);
    app = await require("../web3/provider")(app);
    app = await require("../manager/account")(app);
    app = await require("../web3/oracle")(app);

    app = await require("../web3/campaign")(app);
    app = await require("../web3/graph")(app);
    app = await require("../web3/satt")(app);
    app = await require("../web3/eth")(app);
    app = await require("../web3/erc20")(app);
    app = await require("../manager/bep20")(app);   

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

