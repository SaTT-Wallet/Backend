var app = {}
var connection;
(connection = async function (){
    app = await require("../conf/config")(app);
    app = await require("../conf/const")(app);
    app = await require("../db/db")(app);
})();


exports.captcha= async(req, res)=>{
  
    try {
        count = await app.db.captcha().count();
        const random = Math.floor(Math.random() * count);
        let captchas = await app.db.captcha().find().limit(1).skip(random).toArray();
        let captcha = captchas[0]
        res.send(JSON.stringify({ captcha })).status(200);
    }   catch (err) {
         res.end(JSON.stringify({ "error": err.message ? err.message : err.error })).status(500);
    }
}
