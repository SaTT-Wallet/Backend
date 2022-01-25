var requirement= require('../helpers/utils')
const crypto = require('crypto');

var connection;
let app
(connection = async function (){
    app = await requirement.connection();
  
})();

const fs = require('fs');
var handlebars = require('handlebars');
var Long = require('mongodb').Long;
var readHTMLFile = function(path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function(err, html) {
        if (err) {
            throw err;
            callback(err);
        } else {
            callback(null, html);
        }
    });
};



exports.changePassword= async(req, response)=>{

    var newpass = req.body.newpass;
    var oldpass = req.body.oldpass;
    var id = req.body.id;
    var user = await app.db.sn_user().findOne({ _id: Long.fromNumber(id) });
    if (user) {
        if (user.password != app.synfonyHash(oldpass)) {
            response.end('{error:"wrong password"}');
            return;
        }
        await app.db.sn_user().updateOne({ _id: id }, { $set: { password: app.synfonyHash(newpass) } });
        response.end('{message:"changed"}');
    } else {
        response.end('{error:"no account"}');
    }

}
exports.captcha= async(req, res)=>{
  
    try {
        count = await app.db.captcha().count();
        const random = Math.floor(Math.random() * count);
        let captchas = await app.db.captcha().find().limit(1).skip(random).toArray();
        let captcha = captchas[0];
        res.send(JSON.stringify({  captcha }));
    }   catch (err) {
         res.end(JSON.stringify({ "error": err.message ? err.message : err.error })).status(500);
    }
}

exports.verifyCaptcha= async(req, res)=>{
  
    try {
        let id =  app.ObjectId(req.body._id);
        let position = +req.body.position;
        let captcha = await app.db.captcha().findOne({ $and: [{ _id: id }, { position: { $gte: position - 5, $lte: position + 5 } }] });
        if (captcha) {
            res.send(JSON.stringify({ message: "success" }));
        } else {
            res.send(JSON.stringify({ error: "wrong captcha" }));
        }
    } catch (err) {
        res.end(JSON.stringify({ "error": err.message ? err.message : err.error }));
    }
}

exports.codeRecover= async(req, response)=>{
    try {
        let dateNow = Math.floor(Date.now() / 1000);
        const lang = req.query.lang || "en";
        app.i18n.configureTranslation(lang);
        let email = req.body.mail.toLowerCase();

        let user = await app.db.sn_user().findOne({ email });
        if (!user) {
            response.end('{error:"account not exists"}');
            return;
        }
        if (user.account_locked && app.account.differenceBetweenDates(user.date_locked, dateNow) < app.config.lockedPeriod) {
            response.end(JSON.stringify({ error: true, message: 'account_locked', blockedDate: user.date_locked }));
            return;
        }

        let requestDate = app.account.manageTime();
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "";
        if (ip) ip = ip.split(":")[3];

        const code = await app.account.updateAndGenerateCode(user._id, "reset");
        readHTMLFile(__dirname + '/../emails/reset_password_code.html', (err, html) => {
            let template = handlebars.compile(html);
            let replacements = {
                ip,
                code,
                requestDate,
                satt_url: app.config.basedURl,
                imgUrl: app.config.baseEmailImgURl,
                satt_faq: app.config.Satt_faq,
            };

            let htmlToSend = template(replacements);
            let mailOptions = {
                from: app.config.resetpassword_Email,
                to: user.email,
                subject: 'Satt wallet password recover',
                html: htmlToSend
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    response.end(JSON.stringify({ error: error.message ? error.message : error.error }));
                } else {
                    response.end(JSON.stringify({ 'message': 'Email was sent to ' + user.email }));
                }
            });
        });
    } catch (err) {
        response.end(JSON.stringify({ error: err.message ? err.message : err.error }));
    }
}

exports.confirmCode= async(req, response)=>{
    try {
        var authMethod = { message: "code is matched" } 
        let [email, code, type] = [req.body.email.toLowerCase(), req.body.code, req.body.type];
        var user = await app.db.sn_user().findOne({ email }, { projection: { secureCode: true } });
        if (user.secureCode.code != code) authMethod.message = "wrong code";
        else if (Date.now() >= user.secureCode.expiring) authMethod.message = "code expired";
        else if (user.secureCode.type == "validation" && type == "validation") {
            let date = Math.floor(Date.now() / 1000) + 86400;
            let userAuth = app.cloneUser(user);
            let token = app.generateAccessToken(userAuth);
            authMethod.token = token, authMethod.expires_in = date, authMethod.idUser = user._id;
            await app.db.sn_user().updateOne({ _id: user._id }, { $set: { enabled: 1 } });
        }
        response.end(JSON.stringify(authMethod));

    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}


exports.passRecover= async(req, response)=>{
    try {
        const id = +req.user._id;
        let [newpass, email] = [req.body.newpass, req.body.email];
        let user = await app.db.sn_user().findOne({ email }, { projection: { _id: true } });
        if(user && user._id === id){
        await app.db.sn_user().updateOne({ _id: Long.fromNumber(user._id) }, { $set: { password: app.synfonyHash(newpass), enabled: 1 } });
        response.end(JSON.stringify('successfully'));
        }else{
        response.end(JSON.stringify('unauthorized'));
        }
      
    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}


exports.purgeAccount=async(req,res)=>{

    try {
        let pass = req.body.pass;
        let reason = req.body.reason;
        if(req.user.password === app.synfonyHash(pass)){
            if(reason) user.reason=reason;
             await app.db.sn_user_archived().insertOne(req.user);
             await app.db.sn_user().deleteOne({ _id: Long.fromNumber(req.user._id) });
             res.send(JSON.stringify({ message: "account deleted" })).status(202);
        }else
        res.send(JSON.stringify({ error: "wrong password" }));
    } catch (err) {
        res.end(JSON.stringify({ "error": err.message ? err.message : err.error }));
    }

}


exports.authApple= async(req, res)=>{

    try {
        let date = Math.floor(Date.now() / 1000) + 86400;
        let buff = Buffer.alloc(32);
        let token = crypto.randomFillSync(buff).toString('hex');
        let email = req.body.mail;
        let id_apple = req.body.id_apple;
        let idSn = req.body.idSN;
        let name = req.body.name;
        let user = await app.db.sn_user().findOne({ email: email });

        if (user) {
            if (user.idSn === idSn) {
                await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
                let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
                res.send(JSON.stringify(param));
            } else {
                res.send(JSON.stringify({ messgae: "account_exists_with_another_courrier" }))
            }
        } else {
            let snUser = { _id: Long.fromNumber(await app.account.handleId()), id_apple: id_apple, email: email, idSn: idSn, name: name }
            let user = await app.db.sn_user().insertOne(snUser);
            await app.db.accessToken().insertOne({ client_id: 1, user_id: user.ops[0]._id, token: token, expires_at: date, scope: "user" });
            let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
            res.send(JSON.stringify(param));
        }
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }


}

exports.socialSignUp= async(req,res)=>{
    try {
        var mongodate = new Date().toISOString();
        snUser = {
            _id: Long.fromNumber(await app.account.handleId()),
            email: req.body.email,
            idSn: req.body.idSn,
            picLink: req.body.photo,
            username: req.body.name,
            first_name: req.body.givenName,
            name: req.body.familyName,
            enabled: 0,
            created: mongodate,
            updated: mongodate,
            locale: "en",
        }
        var user ={};
        if (req.body.idSn === "1") {
            snUser.idOnSn = req.body.id;
            user = await app.db.sn_user().findOne({ idOnSn: req.body.id });

        } else if (req.body.idSn === "2") {
            snUser.idOnSn2 = req.body.id;
            user = await app.db.sn_user().findOne({ idOnSn2: req.body.id });
        }
        if (user) {
       
                res.send(JSON.stringify({ message: "account_exists" }))
         
        } else {
            var buff = Buffer.alloc(32);
            var token = crypto.randomFillSync(buff).toString('hex');
            var date = Math.floor(Date.now() / 1000) + 86400;
            var user = await app.db.sn_user().insertOne(snUser);
            await app.db.accessToken().insertOne({ client_id: 1, user_id: user.ops[0]._id, token: token, expires_at: date, scope: "user" });
            var param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
            res.send(JSON.stringify(param))
        }

    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}


exports.socialSignin = async(req, res)=>{

    try {
        var user =null;
        if (req.body.idSn === "1") {
            user = await app.db.sn_user().findOne({ idOnSn: req.body.id });
        } else if (req.body.idSn === "2") {
            user = await app.db.sn_user().findOne({ idOnSn2: req.body.id });
        }else{
            res.end("{'error': 'invalid idSn'}");
        }            
        if (user) {                
            var date = Math.floor(Date.now() / 1000) + 86400;
            var buff = Buffer.alloc(32);
            var token = crypto.randomFillSync(buff).toString('hex');
            var update = await app.db.accessToken().updateOne({ user_id: user._id }, { $set: { token: token, expires_at: date } });
            var token = await app.db.accessToken().findOne({ user_id: user._id });
            var param = { "access_token": token.token, "expires_in": token.expires_at, "token_type": "bearer", "scope": "user" };
            res.send(JSON.stringify(param))

        } else {
            res.send(JSON.stringify({ messgae: "account_doesnt_exist" }))
        }
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }

}






