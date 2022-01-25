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


exports.socialAccounts= async(req, response)=>{
    try {
        let token=await app.crm.checkToken(req,response);
        let auth = await app.crm.auth(token);
        var UserId = +auth.id;
        let networks = {};
        var channelsGoogle = await app.db.googleProfile().find({ UserId }).toArray();
        var channelsTwitter = await app.db.twitterProfile().find({ UserId }).toArray();
        let channelsFacebook = await app.db.fbPage().find({ UserId }).toArray();
        let channelsLinkedin = await app.db.linkedinProfile().findOne({ userId: UserId });
        networks.google = channelsGoogle;
        networks.twitter = channelsTwitter;
        networks.facebook = channelsFacebook;
        networks.linkedin = channelsLinkedin ?.pages || [];
        response.send(JSON.stringify(networks))
    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }

}
