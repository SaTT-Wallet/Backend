const { result } = require('underscore');
const config = require('../conf/config');

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
	const QRCode = require('qrcode')
    var handlebars = require('handlebars');
	const hasha = require('hasha');
    var Long = require('mongodb').Long;
	const crypto = require('crypto');

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

	var synfonyHash = function (pass) {
		var salted = pass+"{"+app.config.symfonySalt+"}";
	
	
		var buff = hasha(salted, {encoding: "buffer"});
		var saltBuff = Buffer.from(salted);
		var arr = [];
	
		for (var i = 1; i < 5000; i++) {
		  arr = [buff, saltBuff];
		  buff = hasha(Buffer.concat(arr), {algorithm: "sha512", encoding: "buffer"});
		}
	
		const base64 = buff.toString('base64');
		return base64;
	  }
     /*
     @link : /profile/pic/:id
     @description: récupère l'image d'un utilisateur
     @params:
	 fedi.sadouki@yopmail.com5A
     id : identifiant de l'utilisateur'
     */
	 app.get('/profile/pic', async (req, res) => {
         try{
			const token = req.headers["authorization"].split(" ")[1];
			const auth= await app.crm.auth(token);
			const idUser = auth.id;
			gfsprofilePic.files.findOne({ 'user.$id':idUser} , (err, file) => {
				if (!file || file.length === 0) {
				  return res.json({
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

    /**
 * @swagger
 * /profile/pic:
 *   post:
 *     summary: Upload user profile picture.
 *     description: parametres acceptées :file , headers{headers}.
 *     parameters:
 *       - name: file
 *         description: user picture.
 *     responses:
 *        "200":
 *          description: data
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
	/**
 * @swagger
 * /validateKYC/{idLegal}:
 *   put:
 *     summary: validate legal kyc .
 *     description: parametres acceptées :params{idLegal} , headers{headers}.
 *     parameters:
 *       - name: idLegal
 *         in: path
 *         description: id legal a valider.
 *     responses:
 *        "200":
 *          description: success message
 *        "500":
 *          description: error message
 */
	 app.put('/validateKYC/:idLegal', async(req, res)=>{
		try {
		 const date = new Date().toISOString();
		 let token = req.headers["authorization"].split(" ")[1];
         const auth = await app.crm.auth(token);
		 if(auth.id === app.config.idNodeAdmin1 || auth.id === app.config.idNodeAdmin2 || auth.id === app.config.idNodeAdmin3){
         const idLegal = req.params.idLegal;
		 const file=await gfsUserLegal.files.findOne({ _id: app.ObjectId(idLegal) });
		 const idNode="0" + file.idNode;
		 await gfsUserLegal.files.updateOne({ _id: app.ObjectId(idLegal) },{$set: { validate : 'validate'}});
		 let notification={
			idNode:idNode,
			type:"validate_kyc",
			status:"done",
			label:{action : "validated kyc"},
			isSeen:false
		}
		await app.db.notification().insertOne(notification)
		

			res.send('success').status(200);
		 }else{
			res.send('access_denied').status(200);

		 }
	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	}
	})
 	   /**
 * @swagger
 * /profile/userLegal:
 *   get:
 *     summary: get userLegal files.
 *     description: parametres acceptées :headers{headers}.
 *     responses:
 *        "200":
 *          description: data
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
			for (var i = 0;i<userLegal.legal.length;i++) {
				if(userLegal.legal[i].validate == "validate") {
					userLegal.legal[i].validate = true;
				}
			}

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
			const arrayNotifications= await app.db.notification().find({idNode:idNode}).sort({created:-1}).toArray()
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
			const isSend= await app.db.notification().find({idNode:idNode,isSend:false}).toArray()
			notifications.isSend=isSend.length;
			notifications.notifications=arrayNotifications.slice(startIndex, endIndex)
			res.send(notifications);
		  }catch (err){
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		  }


	  })

	 	   /**
 * @swagger
 * /profile/userLegal:
 *   post:
 *     summary: upload user userLegal files.
 *     description: parametres acceptées :file, headers{headers}.
 *     responses:
 *        "200":
 *          description: data
 */
	 app.post('/profile/userlegal',uploadUserLegal.single('file'), async(req, res)=>{
		try{
		  const date = new Date().toISOString();
		  let token = req.headers["authorization"].split(" ")[1];
		  const auth = await app.crm.auth(token);
		  const idNode = "0" + auth.id;
		  let type = req.body.type;
         if(type && req.file){
			await gfsUserLegal.files.deleteMany({ $and : [{idNode: idNode}, {type : req.body.type}]});
            await  gfsUserLegal.files.updateMany({ _id: req.file.id },{$set: {idNode: idNode, DataUser : {
				"$ref": "sn_user",
				"$id": Long.fromNumber(auth.id),
				"$db": "atayen"
			 }, validate : false, type : req.body.type} })
			let notification={
				  idNode:idNode,
				  type:"save_legal_file_event",
				  status:"done",
				  label:{type},
				  isSeen:false,
				  isSend : false,
				  attachedEls:{
					  id:req.file.id
				}
			  }
			await	app.db.notification().insertOne(notification)
			res.end(JSON.stringify({message :'legal processed'})).status(201);
		 }
		}catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	  })

   
/**
 * @swagger
 * /SaTT/Support:
 *   post:
 *     summary: sending email to support team.
 *     description: parametres acceptées :body{req.body} , headers{headers}.
 *     parameters:
 *       - name: name
 *         description: user name.
 *       - name: email
 *         description: user email.
 *       - name: subject
 *         description: email subject.
 *       - name: message
 *         description: message from user to support. 
 *     responses:
 *        "200":
 *          description: data
 */
	 app.post('/SaTT/Support', async (req, res) => {
		try{

		let[name,email,subject,message] = [req.body.name,req.body.email,req.body.subject,req.body.message];	

		fs.readFile(__dirname + '/emailtemplate/contact_support.html', 'utf8' ,async(err, data) => { 
		  let mailContent={
			  SaTT:{
				  Url:app.config.baseUrl+'FAQ'
			  },
			  letter:{
				  from:name+" ("+email+")",
				  subject,
				  message
			  }
		  }
		  let dynamic_html=ejs.render(data, mailContent);
		  
  
		  var mailOptions = {
			  from: email,
			  to:app.config.SupportMail,
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
		await app.db.notification().find({ $and: [ { idNode : id }, { isSend : false }]}).forEach((elem)=>{
			elem.isSend = true;
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
	 		body : name,price,cryptoCurrency,from,to,wallet
	 @Output : success message
     */
	 app.post('/recieveMoney', async (req, res) =>{
		try{
			lang=req.query.lang;
			app.i18n.configureTranslation(lang)	
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const id = "0" + auth.id;
			 let code = await QRCode.toDataURL(req.body.wallet);
			let notification={
				idNode:id,
				type:"send_demande_satt_event",
				status:"done",
				label:{name :req.body.name, price :req.body.price, currency :req.body.cryptoCurrency},
				isSeen:false,
				isSend:false,
				attachedEls:{
					id:auth.id
			  },
			  created:new Date()
			}
			 await app.db.notification().insertOne(notification);
			 var result= await app.db.user().findOne({email:req.body.to});
				 if(result){
						 let notification={
						idNode:"0"+result._id,
						type:"demande_satt_event",
						status:"done",
						label:{name :req.body.name, price :req.body.price, currency :req.body.cryptoCurrency},
						isSeen:false,
						isSend:false,
						attachedEls:{
							id:auth.id
					  },
					  created:new Date()
					}
					await app.db.notification().insertOne(notification);


				 }

			fs.readFile(__dirname + '/emailtemplate/notification.html', 'utf8' ,async(err, data) => {
				if (err) {
				  console.error(err)
				  return
				}
				var template = handlebars.compile(data);

				var data_={
					SaTT:{
						Url:app.config.baseUrl+'FAQ'
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
					subject: 'nouvelle notification',
					html: htmlToSend,
					attachments: [
						{
						filename: "codeQr.jpg",
						contentType:  'image/png',
						content: new Buffer.from(code.split("base64,")[1], "base64"),
						}
						]
			   };

		   transporter.sendMail(mailOptions, function(error, info){
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



	})



	/**
 * @swagger
 * /profile/info/update:
 *   put:
 *     summary: update user profile.
 *     description: parametres acceptées :body{profile} , headers{headers}.
 *     parameters:
 *       - name: _id
 *         description: primary key.
 *       - name: email
 *         description: user email.
 *       - name: address
 *         description: user address.
 *       - name: city
 *         description: user city. 
 *       - name: fbLink
 *         description: facebook link. 
 *       - name: twitterLink
 *         description: twitter link.
 *       - name: country
 *         description: user country. 
 *       - name: instagramLink
 *         description: instagram link.
 *       - name: phone
 *         description: user phone number.
 *       - name: gender
 *         description: user gender.
 *       - name: zipCode
 *         description: user zip code.
 *     responses:
 *        "201":
 *          description: data
 */
	app.put('/profile/info/update', async (req, res) => {
		try {
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			const id = +auth.id;
			let profile = req.body;
            
			if(profile.email){
			const users = await app.db.sn_user().find({  $and: [{email: profile.email}, {_id: { $nin: [id] }}]}).toArray();
            if(users.length) {
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
	   })
	   

	   /**
 * @swagger
 * /user/interests:
 *   post:
 *     summary: add users interests.
 *     description: parametres acceptées :body{req.body} , headers{headers}.
 *     parameters:
 *       - name: interests
 *         description: user interests. 
 *     responses:
 *        "200":
 *          description: data
 */
	   app.post('/user/interests',async (req, res)=>{
         try{
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			let userInterests = req.body;
			userInterests._id = Long.fromNumber(auth.id)
			await app.db.interests().insertOne(userInterests);
			res.send(JSON.stringify({message : "interests added"})).status(201);
		 }catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	 }
	   })
     
	   	   /**
 * @swagger
 * /user/interests:
 *   put:
 *     summary: update users interests.
 *     description: parametres acceptées :body{req.body} , headers{headers}.
 *     parameters:
 *       - name: interests
 *         description: array of user interests. 
 *     responses:
 *        "200":
 *          description: data
 */
	app.put('/user/interests', async (req, res)=>{
		try{
			let token = req.headers["authorization"].split(" ")[1];
			const auth = await app.crm.auth(token);
			let userInterests = req.body.interests;
			await app.db.interests().replaceOne({_id:Long.fromNumber(auth.id)},{interests:userInterests});
			res.send(JSON.stringify({message : "interests updated"})).status(201);
		 }catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	 }
	})

		   	   /**
 * @swagger
 * /user/interests:
 *   get:
 *     summary: update users interests.
 *     description: parametres acceptées :headers{headers}.
 *     responses:
 *        "200":
 *          description: data
 */
	app.get('/user/interests', async (req, res)=>{
		try{
		let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
		const interests = await app.db.interests().findOne({_id:Long.fromNumber(auth.id)});
		res.send(JSON.stringify(interests)).status(201);
		 }catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	 }
	})

	/**
 * @swagger
 * /updateLastStep:
 *   put:
 *     summary: update profile last step.
 *     description: parametres acceptées :body{user}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *        "200":
 *          description: message:updated successfully or email exists
 *        "500":
 *          description: error:error messages
 */
	app.put('/updateLastStep',async(req,res)=>{
		try{
		 let token = req.headers["authorization"].split(" ")[1];
		const auth = await app.crm.auth(token);
		const id = +auth.id;

		let profile = req.body;
		let password=Math.random().toString(36).slice(-8);
		const user =await app.db.sn_user().findOne({_id:id});
		const buff = Buffer.alloc(32);
        const code = crypto.randomFillSync(buff).toString('hex');
	  if (profile.email !== user.email || !user.email){
		  const users = await app.db.sn_user().find({email: profile.email}).toArray();
		  if(users.length) {
		  res.end(JSON.stringify({message : "email already exists"}));
		  return;
		  }else{
			const userUpdate=await app.db.sn_user().updateOne({_id:id},{$set: {
				email:profile.email,
				firstName:profile.firstName,
				lastName:profile.lastName,
				isChanged:true,
				enabled:false,
				confirmation_token: code,
				completed:true,
				password:synfonyHash(password)
			  }})
			  res.end(JSON.stringify({message : "updated successfully"}))

		  }
		}else{
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
			res.end(JSON.stringify({message : "updated successfully"}))

			}else{
				const userUpdate=await app.db.sn_user().updateOne({_id:id},{$set: {
					firstName:profile.firstName,
					lastName:profile.lastName,
					enabled:1,
					completed:true,
					password:synfonyHash(password)
				  }})
				  res.end(JSON.stringify({message : "updated successfully with same email"}))
			}
			

		}
		
		} catch (err) {
		  res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
		 }  
	  })
	return app;

}
