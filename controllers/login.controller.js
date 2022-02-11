var requirement= require('../helpers/utils')
const crypto = require('crypto');
const qrcode = require('qrcode');
const speakeasy = require('speakeasy');
var Captcha = require('../model/captcha.model');
var User = require('../model/user.model');
var UserArchived = require('../model/UserArchive.model');

const { responseHandler } = require('../helpers/response-handler');
const { 
    createUser
} = require('../middleware/passport.middleware')

var connection;
let app
(connection = async function (){
    app = await requirement.connection();
  
})();
const hasha = require('hasha');

const fs = require('fs');
var handlebars = require('handlebars');

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
            throw err;
            callback(err);
        } else {
            callback(null, html);
        }
    });
};

exports.changePassword= async(req, res)=>{
    try{
        let newpass = req.body.newpass;
        let oldpass = req.body.oldpass;
        let _id = req.user._id;
        let user = await User.findOne({ _id });
        if (user) {
            if (user.password != app.synfonyHash(oldpass)) {
                return responseHandler.makeResponseError(res, 401,"wrong password");
            }else{
                await User.updateOne({ _id}, { $set: { password: app.synfonyHash(newpass) } });
                return responseHandler.makeResponseData(res, 200,"changed",true);
            }
        } else {
            return responseHandler.makeResponseError(res, 404, "no account");
        }
    } 
    catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error);
    }
}
exports.captcha= async(req, res)=>{
    try {
        let count= await Captcha.countDocuments();
        let random = Math.floor(Math.random() * count);
        let captcha = await Captcha.findOne().limit(1).skip(random);
        return responseHandler.makeResponseData(res, 200, "success", captcha);
    }   catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.verifyCaptcha= async(req, res)=>{
    try {
        let id =  app.ObjectId(req.body._id);
        let position = +req.body.position;
        let captcha = await Captcha.findOne({ $and: [{ _id: id }, { position: { $gte: position - 5, $lte: position + 5 } }] });
        if (captcha) {
            return responseHandler.makeResponseData(res, 200, "success", captcha);
        } else {
            return responseHandler.makeResponseError(res, 401, "wrong captcha",false);
        }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.codeRecover= async(req, res)=>{
    try {
        let dateNow = Math.floor(Date.now() / 1000);
        let lang = req.query.lang || "en";
        app.i18n.configureTranslation(lang);
        let email = req.body.mail.toLowerCase();

        let user = await User.findOne({ email });
        if (!user) {
            return responseHandler.makeResponseError(res, 404, "account not exists",false);
        }
        if (user.account_locked && app.account.differenceBetweenDates(user.date_locked, dateNow) < app.config.lockedPeriod) {

            return responseHandler.makeResponseError(res, 401, "account_locked",{blockedDate: user.date_locked});
        }

        let requestDate = app.account.manageTime();
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || "";
        if (ip) ip = ip.split(":")[3];

        let code = await app.account.updateAndGenerateCode(user._id, "reset");
        readHTMLFile(__dirname + '/../public/emails/reset_password_code.html', (err, html) => {
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
                    return responseHandler.makeResponseError(res, 500, error.message ? error.message : error.error,false);
                } else {
                    return responseHandler.makeResponseData(res, 200, 'Email was sent to ' + user.email, user.email);
                }
            });
        });
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.confirmCode= async(req, res)=>{
    try {
        let [email, code, type] = [req.body.email.toLowerCase(), req.body.code, req.body.type];
        let user = await User.findOne({ email },{ secureCode: 1 });
        if(!user){
            return responseHandler.makeResponseError(res, 404, "user not found",false);
        }
        else if (user.secureCode.code != code)
            return responseHandler.makeResponseError(res, 401, "wrong code",false);
        else if (Date.now() >= user.secureCode.expiring)
            return responseHandler.makeResponseError(res, 401, "code expired",false);
        else if (user.secureCode.type == "validation" && type == "validation") {
            let authMethod = { message: "code is matched" }
            let date = Math.floor(Date.now() / 1000) + 86400;
            let userAuth = app.cloneUser(user);
            let token = app.generateAccessToken(userAuth);
            authMethod.token = token, authMethod.expires_in = date, authMethod.idUser = user._id;
            await User.updateOne({ _id: user._id }, { $set: { enabled: 1 } });
            return responseHandler.makeResponseData(res, 200, authMethod.message, true);
        }

    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.passRecover= async(req, res)=>{
    try {
        let [newpass, email,code] = [req.body.newpass, req.body.email,req.body.code];
        let user = await User.findOne({ email },{ secureCode: 1 });
        if(!user){
            return responseHandler.makeResponseError(res, 404, "user not found",false);
        }else if(user.secureCode.code != code)
        return responseHandler.makeResponseError(res, 401, "wrong code",false);
        else if (Date.now() >= user.secureCode.expiring)
            return responseHandler.makeResponseError(res, 401, "code expired",false);
        else{
            await User.updateOne({ _id: user._id }, { $set: { password: app.synfonyHash(newpass), enabled: 1 } });
            return responseHandler.makeResponseData(res, 200, "successfully", true);
        }    
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.resendConfirmationToken= async(req, res)=>{
    try {
        let email = req.body.email;
        let user = await User.findOne({ email: email }, {  email: 1 });
        if(!user){
            return responseHandler.makeResponseError(res, 404, "user not found",false);
        }else{
            let code = await app.account.updateAndGenerateCode(user._id, "validation");
            let lang = req.query.lang || "en";
            app.i18n.configureTranslation(lang);
            readHTMLFile(__dirname + '/../public/emailtemplate/email_validated_code.html', (err, html) => {
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
                        app.account.log('Email sent: ', user.email);
                        return responseHandler.makeResponseData(res, 200, "Email sent", true);
                    }
                });
            });
        }
     
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.saveFirebaseAccessToken= async(req, res)=>{
    try {
		let data = req.body;
		await User().updateOne({_id:req.user._id}, {$set:{fireBaseAccessToken : data.fb_accesstoken}})
        return responseHandler.makeResponseData(res, 200, "success", true);
	} catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
	 }
}

exports.updateLastStep= async(req, res)=>{
    try{
    let id = req.user._id;
    let profile = req.body;
    let password=Math.random().toString(36).slice(-8);
    let user = await User.findOne({email: profile.email});
    if(user && user._id !== id) {
        return responseHandler.makeResponseError(res, 401,"email already exists");
    }else if(user && user._id===id){
       await User.updateOne({_id:id},{$set: {
            email:profile.email,
            firstName:profile.firstName,
            lastName:profile.lastName,
            enabled:1,
            completed:true,
            password:synfonyHash(password)
        }})
        return responseHandler.makeResponseData(res, 200, "updated successfully with same email", true);
    }
    else{
        await User.updateOne({_id:id},{$set: {
            email:profile.email,
            firstName:profile.firstName,
            lastName:profile.lastName,
            isChanged:true,
            enabled:0,
            completed:true,
            password:synfonyHash(password)
        }})
        return responseHandler.makeResponseData(res, 200, "updated successfully", true);
    }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
 }
}

exports.purgeAccount=async(req,res)=>{
    try {
        let pass = req.body.pass;
        let reason = req.body.reason;
        if(req.user.password === app.synfonyHash(pass)){
             if(reason) req.user.reason=reason;
             await UserArchived().insertOne(req.user);
             await User().deleteOne({ _id: Long.fromNumber(req.user._id) });
             return responseHandler.makeResponseData(res, 200, "account deleted", true);
        }else
        return responseHandler.makeResponseError(res, 401, "wrong password",false);
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }

}

exports.authApple= async(req, res)=>{
    try {
        let date = Math.floor(Date.now() / 1000) + 86400;
        let email = req.body.mail;
        let id_apple = req.body.id_apple;
        let idSn = req.body.idSN;
        let name = req.body.name;
        let user = await User.findOne({$or:[{ email },{id_apple}]});
        if (user) {
            let userAuth = app.cloneUser(user);
            let token = app.generateAccessToken(userAuth);
            if (user.idSn === idSn) {              
                let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
                return responseHandler.makeResponseData(res, 200, "success", param);
            } else {
                return responseHandler.makeResponseError(res, 401, "account_exists_with_another_courrier",false);
            }
        } else {
            let createdUser = createUser(0,idSn,true,false,name,email,"","","","")
            createdUser.id_apple=id_apple;
            let user = await new User(createdUser).save();
            createdUser._id=user._id;
            let token = app.generateAccessToken(createdUser);
            let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
            return responseHandler.makeResponseData(res, 200, "success", param);
        }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }


}

exports.socialSignUp= async(req,res)=>{
    try {
       let snUser= createUser (0,req.body.idSn,true,req.body.photo,req.body.name,req.body.email,null,null,req.body.givenName,req.body.familyName)
        let socialField = req.body.idSn === "1" ? "idOnSn" : "idOnSn2"
        snUser[socialField] = req.body.id
        let user = await User.findOne({ [socialField]: req.body.id });
        if (user) {
            return responseHandler.makeResponseError(res, 401, "account_exists",false);
        } else {
            let date = Math.floor(Date.now() / 1000) + 86400;
            let user = await new User(snUser).save();
            snUser._id=user._id;
            let token = app.generateAccessToken(snUser);
            let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
            return responseHandler.makeResponseData(res, 200, "success", param);    
            }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.socialSignin = async(req, res)=>{
    try {
        if(req.body.idSn !== "1" && req.body.idSn !== "2")
        return responseHandler.makeResponseError(res, 401, "invalid idSn",false);
        let socialField = req.body.idSn === "1" ? "idOnSn" : "idOnSn2"
        let user = await User.findOne({ [socialField]: req.body.id });     
        if (user) {                
            let date = Math.floor(Date.now() / 1000) + 86400;
            let userAuth = app.cloneUser(user);
            let token = app.generateAccessToken(userAuth);
            let param = { "access_token": token, "expires_in": date, "token_type": "bearer", "scope": "user" };
            return responseHandler.makeResponseData(res, 200, "success", param);
        } else {
            return responseHandler.makeResponseError(res, 401, "account_doesnt_exist",false);
        }
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }

}

module.exports.getQrCode = async (req,res)=> {
    try {
        let id = req.user._id
        let secret = speakeasy.generateSecret({
            name: "SaTT_Token " + id
        });
        await User.updateOne({ _id: id }, { $set: { secret: secret.ascii } });
        qrcode.toDataURL(secret.otpauth_url, (err, data) => {
           return responseHandler.makeResponseData(res, 200, "success", data);
        })
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

module.exports.verifyQrCode = async (req, res) => {
    try {
        let _id = req.user._id
        let user = await User.findOne({ _id })
        let secret = user.secret;
        let code = req.body.code;
        let verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'ascii',
            token: code
        })
        let data={ verifiedCode: verified }
        return responseHandler.makeResponseData(res, 200, "success", data);
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }
}

exports.socialdisconnect = async(req, res)=>{
    try {
        let _id = req.user._id
        let social = req.params.social;
        let socialField = {
            telegram:"idOnSn3",
            facebook :"idOnSn",
            google:'idOnSn2'
        }
        let queryField = socialField[social]
         await User.updateOne({ _id }, { $set: { [queryField]: null } });
         return responseHandler.makeResponseData(res, 200, `deconnect successfully from ${social}`, false);
    } catch (err) {
        return responseHandler.makeResponseError(res, 500, err.message ? err.message : err.error,false);
    }

}







