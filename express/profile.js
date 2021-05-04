module.exports = function (app) {
	let ejs = require('ejs');
	var fs = require('fs');
	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )
	const Grid = require('gridfs-stream');
	const GridFsStorage = require('multer-gridfs-storage');
	const multer = require('multer');
    const mongoose = require('mongoose');
	const mongodb = require('mongodb');
	const mongoURI = app.config.mongoURI;
	const nodemailer = require("nodemailer");
	var transporter = nodemailer.createTransport(app.config.mailerOptions);
	const conn=mongoose.createConnection(mongoURI);
	let gfsprofilePic;
	let gfsUserLegal;
	conn.once('open', () => {
	  gfsprofilePic = Grid(conn.db, mongoose.mongo);
	  gfsprofilePic.collection('user_file');
	  gfsUserLegal = Grid(conn.db, mongoose.mongo);
	  gfsUserLegal.collection('user_legal');

	});
	
	const storageUserLegal = new GridFsStorage({
		url: mongoURI,
		options: { useNewUrlParser: true ,useUnifiedTopology: true},
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
              const filename = file.originalname;
			  const fileInfo = {
				filename: filename,
				bucketName: 'user_legal'
			  };
			  resolve(fileInfo);
		  });
		}
	  });
	  



	  const storageProfilePic = new GridFsStorage({
		url: mongoURI,
		options: { useNewUrlParser: true ,useUnifiedTopology: true},
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
			  const filename = file.originalname;
			  const fileInfo = {
				filename: filename,
				bucketName: 'user_file'
			  };    
		  resolve(fileInfo);			  
		  });
		}
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
	 app.get('/profile/pic', async (req, res) => {
         try{ 
			const token = req.headers["authorization"].split(" ")[1];
			const auth= await app.crm.auth(token);     
			const idUser = +auth.id;
			gfsprofilePic.files.findOne({ 'user.$id':idUser} , (err, file) => {
				if (!file || file.length === 0) {
				  return res.status(404).json({
					err: 'No file exists'
				  });
				}
				else {
				  res.writeHead(200, {
										'Content-Type': 'image/png',
										'Content-Length': file.length,
										'Content-Disposition': `attachment; filename=${file.filename}`
									});
				  const readstream = gfsprofilePic.createReadStream(file.filename);
				  readstream.pipe(res);
				} 
			  });
			 
            }catch (err) {
				res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
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
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			if(req.file){
				await gfsprofilePic.files.findOneAndDelete({'user.$id': auth.id});
			    await gfsprofilePic.files.updateOne({ _id: req.file.id },{$set: { user : {
					"$ref": "sn_user",
					"$id": auth.id, 
					"$db": "atayen"
				 }} })			 
     			res.send(JSON.stringify({message :'Saved'})).status(200);
				} 
			res.send(JSON.stringify({message :'Only images allowed'})).status(200);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		}

		})

 	/*
     @link : /profile/userLegal?page='param'&limit='param'
     @description: get user legal
     @Input:headers
     @Output:Array of user legal
     */
	app.get('/profile/userLegal', async(req, res)=>{
		try{
			const token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const limit=parseInt(req.query.limit) || 50;
			const page=parseInt(req.query.page) || 1
			const idNode="0"+auth.id;
			gfsUserLegal.files.find({idNode: idNode}).toArray(function (err, files) {
				const startIndex=(page-1) * limit;
				const endIndex=page * limit;
				const userLegal = {}
				if(endIndex < files.length){
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
			userLegal.legal=files.slice(startIndex, endIndex)

				res.send(userLegal);

			})
			
			

		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		}
		

	})




    /*
     @link : /profile/userLegal/:id
     @description: displaying userlegal images
     @Input : id = file Id
     @Output:image
     */
	app.get('/profile/userLegal/:id', async (req, res) => {
		try{ 
		   const token = req.headers["authorization"].split(" ")[1];
		   await app.crm.auth(token);     
		   const userLegal = req.params.id
		   gfsUserLegal.files.findOne({ _id:app.ObjectId(userLegal)}  , (err, file) => {
			   if (!file || file.length === 0) {
				 return res.status(404).json({
				   err: 'No file exists'
				 });
			   }
			   else {
				   if(file.contentType){
					   contentType = file.contentType
				   }else{
					   contentType=file.mimeType
				   }
					res.writeHead(200, {
						'Content-type': contentType,
						'Content-Length': file.length,
						'Content-Disposition': `attachment; filename=${file.filename}`
					});
					const readstream = gfsUserLegal.createReadStream(file.filename);
				      readstream.pipe(res);			   		 		
			   } 
			 });
			
		   }catch (err) {
			   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		   }

   })

	/*
     @link : /notifications?page=param&limit=param
     @description: get all notifications
     @Input:headers
     @Output:Array of notifications
     */
	  app.get('/notifications',async(req, res)=>{
		  try{
			const token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const idNode= "0" + auth.id;
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
		  }catch (err){
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		  }
		
	
	  })

	/*
     @url : /userlegal
     @description: saving user legal files
     @params:
     @Input type : type of proof id or domicile req.body.type
     */
	 app.post('/profile/userlegal',uploadUserLegal.single('file'), async(req, res)=>{
		try{
		  const date = new Date().toISOString();
		  let token = req.headers["authorization"].split(" ")[1];
		  const auth = await app.crm.auth(token);
		  const idNode = "0" + auth.id;
         if(req.body.type && req.file){
            gfsUserLegal.files.updateMany({ _id: req.file.id },{$set: {idNode: idNode, DataUser : {
				"$ref": "sn_user",
				"$id": app.ObjectId(auth.id), 
				"$db": "atayen"
			 }, validate : false, type : req.body.type} })
			  let notification={
				  idNode:idNode,
				  type:"save_legal_file_event",
				  status:"done",
				  label:JSON.stringify([{'type':req.body.type, 'date': date}]), 
				  isSeen:false,
				  attachedEls:{
					  id:req.file.id
				}
			  }
			  await	app.db.notification().insert(notification)
			  res.end(JSON.stringify({message :'legal processed'})).status(201);
		 }
		}catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
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

	  fs.readFile(__dirname + '/emailtemplate/contact_support.html', 'utf8' ,async(err, data) => { //change File Name
		var data_={
			SaTT:{
				Url:config.walletUrl+'FAQ'
			},
			letter:{
				from:name+" ("+email+")",
				subject,
				message
			}
		}
		let dynamic_html=ejs.render(data, data_);

		var mailOptions = {
			from: email,
			to:"support@satt-token.com",
			subject: 'customer service',
			html: dynamic_html
	   };
   
	await transporter.sendMail(mailOptions, function(error, info){
		   if (error) {
			   res.end(JSON.stringify(error))
		   } else {
			   res.end(JSON.stringify(info.response))
		   }
		 });

	  })
	  }catch (err) {
		response.send(JSON.stringify(err));
	}
   })



/*
     @url : /profile/notification/issend/clicked
     @description: notifications were seen
     @params:
     @Input headers : access token
	 @Output : updated notification
     */
app.put('/profile/notification/issend/clicked', async (req, res) =>{
	try{
		let token = req.headers["authorization"].split(" ")[1];
        const auth = await app.crm.auth(token);
		const id = "0" + auth.id 
		await app.db.notification().find({ $and: [ { idNode : id }, { isSend : true }]}).forEach((elem)=>{
			elem.isSend = false;
			app.db.notification().save(elem)
		})
		res.send(JSON.stringify({message :'Notification clicked'})).status(200);
	}catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	}
   
		

})

/*
     @url : /recieveMoney
     @description: envoyer une notification et un mail
     @params:
     @Input headers : access token
	 		body : name,price,cryptoCurrency,to
	 @Output : updated notification
     */
	 app.post('/recieveMoney', async (req, res) =>{
		try{
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const id = "0" + auth.id;
			
			let notification={
				idNode:id,
				type:"demande_satt_event",
				status:"done",
				label:JSON.stringify([req.body.name,req.body.price,req.body.cryptoCurrency,Date('Y-m-d H:i:s')]), 
				isSeen:false,
				isSend:false,
				attachedEls:{
					id:auth.id
			  }
			}
			await app.db.notification().insertOne(notification)
			fs.readFile(__dirname + '/emailtemplate/notification.html', 'utf8' ,async(err, data) => {
				if (err) {
				  console.error(err)
				  return
				}
				var data_={
					SaTT:{
						Url:app.config.walletUrl+'FAQ'
					},
					notification:{
						name:req.body.name,
						price:req.body.price,
						cryptoCurrency:req.body.cryptoCurrency,
						message:req.body.message
					}
				}
				let dynamic_html=ejs.render(data, data_);
				var mailOptions = {
					from: app.config.mailSender,
					to: req.body.to,
					subject: 'nouvelle notification',
					html: dynamic_html
			   };
			
		  transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					res.end(JSON.stringify(error))
				} else {
					res.end(JSON.stringify(info.response))
				}
			  });
			})
			
			res.send(JSON.stringify({message :'Notification created'})).status(200);
		}catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		}
	   
			
	
	})
	return app;

}
