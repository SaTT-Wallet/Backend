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


exports.verifyCaptcha= async(req, res)=>{
  
    try {
        let id = app.ObjectId(req.body._id);
        let position = +req.body.position;
        let captcha = await app.db.captcha().findOne({ $and: [{ _id: id }, { position: { $gte: position - 5, $lte: position + 5 } }] });
        if (captcha) {
            res.send(JSON.stringify({ message: "success" }));
        } else {
            res.send(JSON.stringify({ error: "wrong captcha" }));
        }
    } catch (err) {
        console.log("err")
        res.end(JSON.stringify({ "error": err.message ? err.message : err.error }));
    }
}
