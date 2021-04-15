module.exports = function (app) {
	let ejs = require('ejs');
	var fs = require('fs');
	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )
	const crypto = require('crypto');
	const Grid = require('gridfs-stream');
	const GridFsStorage = require('multer-gridfs-storage');
	const path = require('path');
	const multer = require('multer');
    const mongoose = require('mongoose');
	const mongoURI = app.url;

	//const mongoURI = 'mongodb://127.0.0.1:27017/atayen';
	const storageUserLegal = new GridFsStorage({
		url: mongoURI,
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
			crypto.randomBytes(16, (err, buf) => {
			  if (err) {
				return reject(err);
			  }
			  const filename = buf.toString('hex') + path.extname(file.originalname);
			  const fileInfo = {
				filename: filename,
				bucketName: 'user_legal'
			  };
			  resolve(fileInfo);
			});
		  });
		}
	  });
	  



	  const storageProfilePic = new GridFsStorage({
		url: mongoURI,
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
			crypto.randomBytes(16, (err, buf) => {
			  if (err) {
				return reject(err);
			  }
			  const filename = buf.toString('hex') + path.extname(file.originalname);
			  const fileInfo = {
				filename: filename,
				bucketName: 'user_files'
			  };
			  resolve(fileInfo);
			});
		  });
		}
	  });

      const conn=mongoose.createConnection(mongoURI);
	  let gfsprofilePic;
	  conn.once('open', () => {
		gfsprofilePic = Grid(conn.db, mongoose.mongo);
		gfsprofilePic.collection('user_files');

	  });
	   const uploadUserLegal =  multer({storage : storageUserLegal})
       const uploadImageProfile =  multer({storage : storageProfilePic})


    app.set("view engine", "ejs");

	var BN = require("bn.js");

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);


     /*
     @link : /profile/pic/:id
     @description: récupère l'image d'un utilisateur
     @params:
     id : identifiant de l'utilisateur'
     */
	 app.get('/profile/pic/:id', async (req, res) => {
         try{
		const idUser = +req.params.id;
		const profileImage=await app.db.userFiles().find({idUser:idUser}).toArray();

			gfsprofilePic.files.findOne({ filename: profileImage[0].file.filename }, (err, file) => {
				if (!file || file.length === 0) {
				  return res.status(404).json({
					err: 'No file exists'
				  });
				}
				if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
				  res.writeHead(200, {
										'Content-Type': 'image/png',
										'Content-Length': file.length,
										'Content-Disposition': `attachment; filename=${file.filename}`
									});
				  const readstream = gfsprofilePic.createReadStream(file.filename);
				  readstream.pipe(res);

				} else {
				  res.status(404).json({
					err: 'Not an image'
				  });
				}
			  });
            }catch (err) {
                response.send(err);
            }

	})



     /*
     @link : /profile/pic
     @description: saving user profile image
     @params:
     req.file : image files
     */
    app.post('/profile/pic',uploadImageProfile.single('file'), async(req, res)=>{
		try{
			let pic = {};
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			pic.idUser = auth.id
			pic.file = req.file;
			await app.db.userFiles().insertOne(pic)
			res.send('saved').status(200);
		} catch (err) {
			res.send(err);
		}

		})

 	/*
     @link : /profile/userLegal?page='param'&limit='param'
     @description: get user legal
     @Input:headers
     @Output:Object
     */
	app.get('/profile/userLegal', async(req, res)=>{
		const limit=parseInt(req.query.limit) || 50;
		const page=parseInt(req.query.page) || 1
		const token = req.headers["authorization"].split(" ")[1];
        const auth = await app.crm.auth(token);
		const idNode=auth.id;
		const legal=await app.db.UserLegal().find({idNode:idNode}).toArray();

		const startIndex=(page-1) * limit;
		const endIndex=page * limit;

		const userLegal = {}
		if(endIndex < legal.length){
			userLegal.next ={
				page:page+1,
				limit:limit
			}
		}
		if(startIndex > 0){
			userLegal.previous ={
			page:page-1,
			limit:limit
		}
		}
		userLegal.legal=legal.slice(startIndex, endIndex)
		res.send(userLegal);

	})

	/*
     @link : /notifications?page=param&limit=param
     @description: get all notifications
     @Input:headers
     @Output:Object
     */
	  app.get('/notifications',async(req, res)=>{
		const token = req.headers["authorization"].split(" ")[1];
        const auth = await app.crm.auth(token);
		const idNode=auth.id;
		const arrayNotifications= await app.db.notification().find({idNode:idNode}).toArray()
		const limit=parseInt(req.query.limit) || 50;
		const page=parseInt(req.query.page) || 1;
		const startIndex=(page-1) * limit;
		const endIndex=page * limit;

		const notifications = {}
		if(endIndex < arrayNotifications.length){
			notifications.next ={
				page:page+1,
				limit:limit
			}
		}
		if(startIndex > 0){
			notifications.previous ={
			page:page-1,
			limit:limit
			}
		}
		const isSend= await app.db.notification().find({idNode:idNode,isSend:true}).toArray()
		notifications.isSend=isSend.length;
		notifications.notifications=arrayNotifications.slice(startIndex, endIndex)
		res.send(notifications);

	  })

	/*
     @url : /userlegal
     @description: saving user legal files
     @params:
     @Input type : type of proof id or domicile
     */
	app.post('/profile/userlegal',uploadUserLegal.single('file'), async(req, res)=>{
      try{
		  const date = new Date().toISOString();
		let legal={};
		let token = req.headers["authorization"].split(" ")[1];
        const auth = await app.crm.auth(token);
		if(req.body.type == 'proofId'){
          legal.type = "proofId";
		}
        if(req.body.type == "proofDomicile"){legal.type = "proofDomicile";}
		legal.idNode = auth.id;
        legal.file = req.file;
		legal.filename = req.file.originalname
		legal.validate = false;
		const userLegal = await app.db.UserLegal().insertOne(legal);
		let notification={
			idNode:auth.id,
			type:"save_legal_file_event",
			status:"done",
			label:JSON.stringify([{'type':legal.type, 'date': date}]),
			isSeen:false,
			attachedEls:{
				id:userLegal.insertedId
		  }
		}
	  await	app.db.notification().insert(notification)
		res.end('legal processed').status(201);
	  }catch (err) {
		  res.send(err);
	  }
	})
    /*
     @Url : /SaTT/Support'
     @description: Send Email to SaTT customer service
     @parameters => req.body:
     name = name of the user
	 email= user email
	 subject= subject of the letter
	 message= the content of the letter
     */

	app.get('/SaTT/Support', async (req, res) => {
	  try{
	  let name =req.body.name
	  let email=req.body.email
	  let subject=req.body.subject
	  let message=req.body.message

	  fs.readFile(__dirname + '/emailtemplate/email.html', 'utf8' ,async(err, data) => { //change File Name

		var data_={
			cmp:{
				name:campaign.title,
				link:link
			}
		}
		let dynamic_html=ejs.render(data, data_);

	  })
	  }catch (err) {
		response.send(JSON.stringify(err));
	}
   })
	return app;

}
