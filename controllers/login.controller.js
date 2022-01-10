const console = require('console');
const { auth } = require('google-auth-library');
const { async } = require('hasha');
var app = {};

app =  require("../conf/config")(app);
  app =  require("../conf/const")(app);



app =  require("../db/db")(app);







exports.captcha= async(req, res)=>{

    try {
        count = await app.db.captcha().count();
        const random = Math.floor(Math.random() * count);
        let captchas = await app.db.captcha().find().limit(1).skip(random).toArray();
        let captcha = captchas[0]
        res.status(200).send(JSON.stringify({ captcha }));
    } catch (err) {
        res.status(500).end(JSON.stringify({ "error": err.message ? err.message : err.error }));
    }
}
