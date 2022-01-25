var requirement= require('../helpers/utils')

var connection;
let app
(connection = async function (){
    app = await requirement.connection();
  
})();
const hasha = require('hasha');

const fs = require('fs');
var handlebars = require('handlebars');
const crypto = require('crypto');

var synfonyHash = function(pass) {
    var salted = pass + "{" + app.config.symfonySalt + "}";

    var buff = hasha(salted, { encoding: "buffer" });
    var saltBuff = Buffer.from(salted);
    var arr = [];

    for (var i = 1; i < 5000; i++) {
        arr = [buff, saltBuff];
        buff = hasha(Buffer.concat(arr), { algorithm: "sha512", encoding: "buffer" });
    }

    const base64 = buff.toString('base64');
    return base64;
}
var Long = require('mongodb').Long;
var readHTMLFile = function(path, callback) {
    fs.readFile(path, { encoding: 'utf-8' }, function(err, html) {
        if (err) {
            console.log('error ==',err)
            throw err;
            callback(err);
        } else {
            callback(null, html);
        }
    });
};


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
            app.transporter.sendMail(mailOptions, (error, info) => {
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
        var buff = Buffer.alloc(32);
        let [email, code, type] = [req.body.email.toLowerCase(), req.body.code, req.body.type];
        var user = await app.db.sn_user().findOne({ email }, { projection: { secureCode: true } });
        if (user.secureCode.code != code) authMethod.message = "wrong code";
        else if (Date.now() >= user.secureCode.expiring) authMethod.message = "code expired";
        else if (user.secureCode.type == "validation" && type == "validation") {
            let date = Math.floor(Date.now() / 1000) + 86400;
            let token = crypto.randomFillSync(buff).toString('hex');
            authMethod.token = token, authMethod.expires_in = date, authMethod.idUser = user._id
            await app.db.accessToken().insertOne({ client_id: 1, user_id: user._id, token: token, expires_at: date, scope: "user" });
            await app.db.sn_user().updateOne({ _id: user._id }, { $set: { enabled: 1 } });
        }
        response.end(JSON.stringify(authMethod));

    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}


exports.passRecover= async(req, response)=>{
    try {
        let token=await app.crm.checkToken(req,res);
        const auth = await app.crm.auth(token);
        const id = +auth.id
        let [newpass, email] = [req.body.newpass, req.body.email];
        let user = await app.db.sn_user().findOne({ email }, { projection: { _id: true } });
        if(user && user._id === id){
        await app.db.sn_user().updateOne({ _id: Long.fromNumber(user._id) }, { $set: { password: synfonyHash(newpass), enabled: 1 } });
        response.end(JSON.stringify('successfully'));
        }else{
        response.end(JSON.stringify('unauthorized'));
        }
      
    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}

exports.resendConfirmationToken= async(req, response)=>{
    try {
        const email = req.body.email;
        const user = await app.db.sn_user().findOne({ email: email }, { projection: { email: true } });
        const code = await app.account.updateAndGenerateCode(user._id, "validation");
        const lang = req.query.lang || "en";
        app.i18n.configureTranslation(lang);
        readHTMLFile(__dirname + '/../express/emailtemplate/email_validated_code.html', (err, html) => {
            var template = handlebars.compile(html);
            var replacements = {
                satt_faq: app.config.Satt_faq,
                satt_url: app.config.basedURl,
                code,
                imgUrl: app.config.baseEmailImgURl,
            };
            var htmlToSend = template(replacements);
            var mailOptions = {
                from: app.config.mailSender,
                to: user.email.toLowerCase(),
                subject: 'Satt wallet activation',
                html: htmlToSend
            };
            app.transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    app.account.sysLogError(error);
                } else {
                    response.send(JSON.stringify({ message: "Email sent" }))
                    app.account.log('Email sent: ', user.email);
                }
            });
        });
    } catch (err) {
        response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}

exports.saveFirebaseAccessToken= async(req, response)=>{
    try {
        let token= await app.crm.checkToken(req,response);
		const auth = await app.crm.auth(token);
		const data = req.body;
		await app.db.sn_user().updateOne({_id:+auth.id}, {$set:{fireBaseAccessToken : data.fb_accesstoken}})
		response.end(JSON.stringify({message : "success"}));
	} catch (err) {
		response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	 }
}

exports.updateLastStep= async(req, response)=>{
    try{
    let token= await app.crm.checkToken(req,response);
    var auth =	await app.crm.auth(token);
    const id = auth.id;
    let profile = req.body;
    let password=Math.random().toString(36).slice(-8);
    const user =await app.db.sn_user().findOne({_id:id});
    const buff = Buffer.alloc(32);
    const code = crypto.randomFillSync(buff).toString('hex');
    const users = await app.db.sn_user().find({email: profile.email}).toArray();
    if(users.length && users[0]._id !== id) {
        response.end(JSON.stringify({message : "email already exists"}));
    return;
    }else{
        await app.db.sn_user().updateOne({_id:id},{$set: {
            email:profile.email,
            firstName:profile.firstName,
            lastName:profile.lastName,
            isChanged:true,
            enabled:false,
            confirmation_token: code,
            completed:true,
            password:synfonyHash(password)
        }})
        response.end(JSON.stringify({message : "updated successfully"}))
    }
        if(user.isChanged===true){
            const userUpdate=await app.db.sn_user().updateOne({_id:id},{$set: {
                email:profile.email,
                firstName:profile.firstName,
                lastName:profile.lastName,
                confirmation_token: code,
                enabled:false,
                completed:true,
                password:synfonyHash(password)
            }})
            response.end(JSON.stringify({message : "updated successfully"}))

        }else{
            const userUpdate=await app.db.sn_user().updateOne({_id:id},{$set: {
                firstName:profile.firstName,
                lastName:profile.lastName,
                enabled:1,
                completed:true,
                password:synfonyHash(password)
            }})
            response.end(JSON.stringify({message : "updated successfully with same email"}))
        }
    } catch (err) {
        response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }
}


