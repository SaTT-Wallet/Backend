var connection;

var express = require('express');

const Big = require('big.js');
var rp = require('request-promise');
const {randomUUID}= require('crypto');
const { v5 : uuidv5 } = require('uuid')




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

exports.account= async(req, res)=>{
    try{
        let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);
        var user = auth.user;
        if (user) {
            res.end(JSON.stringify(user))
        } else {
            res.end(JSON.stringify({ error: "user not found" }))
        }
    }
     catch (err) {
        res.end(JSON.stringify({error:err.message?err.message:err.error}))
    }
   

}
