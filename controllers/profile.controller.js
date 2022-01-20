
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



exports.profilePicture=  async(req, response)=>{

    try{

    const conn=mongoose.createConnection(app.mongoURI);

	conn.once('open', () => {
	  gfsprofilePic = Grid(conn.db, mongoose.mongo);
	  gfsprofilePic.collection('user_file');
	  gfsUserLegal = Grid(conn.db, mongoose.mongo);
	  gfsUserLegal.collection('user_legal');

	});
        
    let token=await app.crm.checkToken(req,response);
    var auth =	await app.crm.auth(token);

        const idUser =   req.query.id ? +req.query.id : auth.id;
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
        let token=await app.crm.checkToken(req,res);
        var auth =	await app.crm.auth(token);
        const id = auth.id;
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
        let token=await app.crm.checkToken(req,res);
        const auth = await app.crm.auth(token);
        const idNode="0"+auth.id;
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
        let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);
        await app.db.googleProfile().deleteMany({ UserId: auth.id });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}



exports.deleteFacebookChannels= async(req,res)=>{
    try {
        let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);
        let UserId = auth.id
        await app.db.fbPage().deleteMany({ UserId });
        await app.db.fbProfile().deleteMany({ UserId });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }
}

exports.deleteLinkedinChannels= async(req,res)=>{
    try {
        let token=await app.crm.checkToken(req,res);
        let auth = await app.crm.auth(token);
        let userId = auth.id
        await app.db.linkedinProfile().updateOne({ userId }, { $set: { pages: [] } });
        res.end(JSON.stringify({ message: "deleted successfully" }))
    } catch (err) {
        res.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
    }


}
    

