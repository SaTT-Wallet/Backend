var app = {}
var connection;
(connection = async function (){
    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
})();




exports.mywallet= async(req, res)=>{

	try {

        const token = req.params.token;
        var res =	await app.crm.auth(token);

        req.session.user = res.id;
        
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


