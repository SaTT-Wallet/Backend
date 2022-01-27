
var connection;

var requirement= require('../helpers/utils')
const handlebars = require('handlebars');
const QRCode = require('qrcode')
var connection;
let app
(connection = async function (){
    app = await requirement.connection();
  
})();

const mongoose = require('mongoose');
let gfsprofilePic;
let gfsUserLegal;

const Grid = require('gridfs-stream');
const GridFsStorage = require('multer-gridfs-storage');
var Long = require('mongodb').Long;


exports.account= async(req, res)=>{

    try{
        if (req.user) {
            res.end(JSON.stringify(req.user))
        } else {
            res.end(JSON.stringify({ error: "user not found" }))
        }
    }
     catch (err) {
        res.end(JSON.stringify({error:err.message?err.message:err.error}))
    }
   
}



exports.profilePicture=  async(req, response)=>{
    try{
    const conn=mongoose.createConnection(app.mongoURI);

	conn.once('open', () => {
	  gfsprofilePic = Grid(conn.db, mongoose.mongo);
	  gfsprofilePic.collection('user_file');
	  gfsUserLegal = Grid(conn.db, mongoose.mongo);
	  gfsUserLegal.collection('user_legal');

	});
        
        const idUser =   req.query.id ? +req.query.id : req.user._id;
        gfsprofilePic.files.findOne({ 'user.$id':idUser} , (err, file) => {
            if (!file || file.length === 0) {
              return response.json({
                err: 'No file exists'
              });
            }
            else {
              response.writeHead(200, {
                                    'Content-Type': 'image/png',
                                    'Content-Length': file.length,
                                    'Content-Disposition': `attachment; filename=${file.filename}`
                                });
              const readstream = gfsprofilePic.createReadStream(file.filename);
              readstream.pipe(response);
            }
          });

        }catch (err) {
            response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
        }
}


exports.updateProfile = async(req,res)=>{
    try {
        const id = req.user._id;
        let profile = req.body;
        if(profile.email){
        const user = await app.db.sn_user().findOne({  $and: [{email: profile.email}, {_id: { $nin: [id] }}]});
        if(user) {
        res.end(JSON.stringify({message : "email already exists"}));
        return;
        }
        }
       const result = await app.db.sn_user().findOneAndUpdate({_id : id}, {$set: profile},{returnOriginal: false});
       const updatedProfile= result.value;
       res.send(JSON.stringify({updatedProfile, success : "updated"})).status(201);

} catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }
}


exports.UserLegalProfile= async(req , res)=>{
    try{
        const conn=mongoose.createConnection(app.mongoURI);
        conn.once('open', () => {
          gfsprofilePic = Grid(conn.db, mongoose.mongo);
          gfsprofilePic.collection('user_file');
          gfsUserLegal = Grid(conn.db, mongoose.mongo);
          gfsUserLegal.collection('user_legal');
    
        });
        const idNode="0"+req.user._id;
        const files = await gfsUserLegal.files.find({idNode}).toArray()
        userLegal={};
        userLegal.legal=files;
        for (var i = 0;i<userLegal.legal.length;i++) {
            if(userLegal.legal[i].validate == "validate") {
                userLegal.legal[i].validate = true;
            }
        }
            res.send(userLegal);

        

    } catch (err) {
        res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }

}

exports.deleteGoogleChannels= async(req,res)=>{
    try {
        let id = req.user._id;
        await app.db.googleProfile().deleteMany({ UserId: id });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}



exports.deleteFacebookChannels= async(req,res)=>{
    try {
        let UserId = req.user._id
        await app.db.fbPage().deleteMany({ UserId });
        await app.db.fbProfile().deleteMany({ UserId });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}

exports.deleteLinkedinChannels= async(req,res)=>{
    try {
        let userId = req.user._id
        await app.db.linkedinProfile().updateOne({ userId }, { $set: { pages: [] } });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }


}

exports.UserInterstes= async(req, res)=>{
    try{
    let id = req.user._id;
    const interests = await app.db.interests().findOne({_id:id});
    res.send(JSON.stringify(interests)).status(201);
     }catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }

}

exports.AddIntersts= async(req, res)=>{
    try{
        let userInterests = req.body;
        userInterests._id = Long.fromNumber(req.user._id)
        await app.db.interests().insertOne(userInterests);
        res.send(JSON.stringify({message : "interests added"})).status(201);
     }catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }

}

exports.UpdateIntersts= async(req, res)=>{
    try{
        let id = req.user._id;
        let userInterests = req.body.interests;
        await app.db.interests().replaceOne({_id:Long.fromNumber(id)},{interests:userInterests});
        res.send(JSON.stringify({message : "interests updated"})).status(201);
     }catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }

}


exports.socialAccounts= async(req, response)=>{
    try {
        var UserId = req.user._id;
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


module.exports.checkOnBoarding = async(req, response)=>{
    try {
    const _id = +req.user._id;
    await app.db.sn_user().updateOne({ _id }, { $set: { onBoarding: true } });
    response.json({ success: "onBoarding updated" }).status(201);
} catch (err) {
    response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
}
}


module.exports.requestMoney = async(req, res)=>{
	try{
        let lang= /*req.query.lang ??*/ "en";
        app.i18n.configureTranslation(lang);
        const id = req.user._id;
         let code = await QRCode.toDataURL(req.body.wallet);

     await app.account.notificationManager(id, "send_demande_satt_event",{name :req.body.to, price :req.body.price, currency :req.body.cryptoCurrency} )

         var result= await app.db.user().findOne({email:req.body.to});
             if(result){
    await app.account.notificationManager(result._id, "demande_satt_event",{name :req.body.name, price :req.body.price, currency :req.body.cryptoCurrency} )
             }

        app.readHTMLFile(__dirname + '/../express/emailtemplate/notification.html',async(err, data) => {
            if (err) {
              console.error(err)
              return
            }
            let template = handlebars.compile(data);

            var data_={
                SaTT:{
                    faq : app.config.Satt_faq,
                    imageUrl : app.config.baseEmailImgURl,
                    Url:app.config.basedURl
                },
                notification:{
                    name:req.body.name,
                    price:req.body.price,
                    cryptoCurrency:req.body.cryptoCurrency,
                    message:req.body.message,
                    wallet:req.body.wallet
                }
            }

            var htmlToSend = template(data_);

            var mailOptions = {
                from: app.config.mailSender,
                to: req.body.to,
                subject: 'Payment request',
                html: htmlToSend,
                attachments: [
                    {
                    filename: "codeQr.jpg",
                    contentType:  'image/png',
                    content: new Buffer.from(code.split("base64,")[1], "base64"),
                    }
                    ]
           };

       app.transporter.sendMail(mailOptions, (error, info)=>{
            if (error) {
                res.end(JSON.stringify(error))
            } else {
                res.end(JSON.stringify(info.response))
            }
          });
        })

    }catch (err) {
        res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
    }
}