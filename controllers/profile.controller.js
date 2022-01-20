var connection;




var requirement= require('../helpers/utils')

var connection;
let app
(connection = async function (){
    app = await requirement.connection();
  
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
