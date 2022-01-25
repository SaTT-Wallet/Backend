
var connection;

var requirement= require('../helpers/utils')

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
        /*let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);
        var user = auth.user;*/
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

        console.log("profile", profile);

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
        // let token=await app.crm.checkToken(req,res);
        // const auth = await app.crm.auth(token);
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
        // let token=await app.crm.checkToken(req,res);
        // let auth = await app.crm.auth(token);
        await app.db.googleProfile().deleteMany({ UserId: req.user._id });
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
    const interests = await app.db.interests().findOne({_id:req.user._id});
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
        let userInterests = req.body.interests;
        await app.db.interests().replaceOne({_id:Long.fromNumber(req.user._id)},{interests:userInterests});
        res.send(JSON.stringify({message : "interests updated"})).status(201);
     }catch (err) {
    res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }

}



