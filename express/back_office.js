module.exports = function (app) {
	const Grid = require('gridfs-stream');

	const GridFsStorage = require('multer-gridfs-storage');
	const mongoose = require('mongoose');
	const mongoURI = app.config.mongoURI;

	const conn=mongoose.createConnection(mongoURI);

   	let gfsUserLegal;
	conn.once('open', () => {
		gfsUserLegal = Grid(conn.db, mongoose.mongo);
		gfsUserLegal.collection('user_legal');
  
	  });

	
	app.get('/auth/admin/getAllUser/:key', async (req, res) => {
        try{   
			let token = req.headers["authorization"].split(" ")[1];
			if(app.config.auth_tokens.includes(token)){
          listOfUser=[];
          const key=req.params.key;
           users =await app.db.sn_user().find().toArray();
     
           for(const user in users){
            userToSend={};
            let userWallet= await app.db.wallet().findOne({UserId:users[user]._id});
            userToSend._id=users[user]._id;
            userToSend.firstName=users[user].firstName;
            userToSend.lastName=users[user].lastName;
            userToSend.email=users[user].email;
            if(userWallet){
                      userToSend.wallet="0x"+userWallet.keystore.address;
    
            }
            if(key !== 'all'){
                if(userToSend.firstName && userToSend.firstName.toUpperCase().indexOf(key.toUpperCase())!==-1 ||
                userToSend.lastName && userToSend.lastName.toUpperCase().indexOf(key.toUpperCase())!==-1 ||
                userToSend.email && userToSend.email.toUpperCase().indexOf(key.toUpperCase())!==-1 ||
                userToSend.wallet && userToSend.wallet.toUpperCase().indexOf(key.toUpperCase())!==-1 ||
                userToSend.wallet && userToSend.wallet.toUpperCase().indexOf(key.toUpperCase())!==-1 
                ){
                  listOfUser.push(userToSend);
                }
              
            }else{
              listOfUser.push(userToSend);
            }
           }
          
          res.send(listOfUser)
		}
		  else{
			res.send('access_denied').status(401);

		  }
        }catch (err) {
          res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
         }
        
      })


      app.get('/auth/admin/userLegal/:id', async (req, res) => {
		try{
			
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

	   /**
 * @swagger
 * /getAlluserLegal:
 *   get:
 *     summary: get all userLegal files.
 *     description: parametres acceptées :headers{headers}.
 *     responses:
 *        "200":
 *          description: data
 */
		app.get('/auth/admin/getAlluserLegal', async(req, res)=>{
			try{
				let token = req.headers["authorization"].split(" ")[1];
				if(app.config.auth_tokens.includes(token)){
				files =await gfsUserLegal.files.find().toArray(); 
					listOfFiles=[];
					for(const file in files){
						
							fileToSend={};
							if(files[file].idNode){
							let idNode=files[file].idNode;
							let id =idNode.substr(1);
							user= await app.db.sn_user().findOne({_id:Number(id)});
							if(user){
								fileToSend.idNode=files[file].idNode;
							if(user.email){
									fileToSend.email=user.email;

							}
							fileToSend._id=files[file]._id;
							fileToSend.filename=files[file].filename;
							fileToSend.type=files[file].type;
							fileToSend.validate=files[file].validate;
							listOfFiles.push(fileToSend)	
							}
							
						}
							
					}
					res.send(listOfFiles)}
					else{
						res.send('access_denied').status(401);
					}
				
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
	 app.put('/auth/admin/validateKYC/:idLegal', async(req, res)=>{
		try {
		 const date = new Date().toISOString();
		 let token = req.headers["authorization"].split(" ")[1];
		 if(app.config.auth_tokens.includes(token)){
         const idLegal = req.params.idLegal;
		 const file=await gfsUserLegal.files.findOne({ _id: app.ObjectId(idLegal) });
		 const idNode="0" + file.idNode;
		 await gfsUserLegal.files.updateOne({ _id: app.ObjectId(idLegal) },{$set: { validate : 'validate'}});
		 let notification={
			idNode:idNode,
			type:"validate_kyc",
			status:"done",
			label:{action : "validated kyc"},
			isSeen:false,
			created:new Date()
		}
		await app.db.notification().insertOne(notification)
		

			res.send('success').status(200);
		 }else{
			res.send('access_denied').status(401);

		 }
	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	}
	})


	  /**
 * @swagger
 * /rejectKYC/{idLegal}:
 *   put:
 *     summary: reject legal kyc .
 *     description: parametres acceptées :params{idLegal} , headers{headers}.
 *     parameters:
 *       - name: idLegal
 *         in: path
 *         description: id legal a rejeter.
 *     responses:
 *        "200":
 *          description: success message
 *        "500":
 *          description: error message
 */
	   app.put('/auth/admin/rejectKYC/:idLegal', async(req, res)=>{
		try {
		 const date = new Date().toISOString();
		 let token = req.headers["authorization"].split(" ")[1];
		 if(app.config.auth_tokens.includes(token)){
         const idLegal = req.params.idLegal;
		 const file=await gfsUserLegal.files.findOne({ _id: app.ObjectId(idLegal) });
		 const idNode="0" + file.idNode;
		 await gfsUserLegal.files.updateOne({ _id: app.ObjectId(idLegal) },{$set: { validate : 'reject'}});
		 let notification={
			idNode:idNode,
			type:"reject_kyc",
			status:"done",
			label:{action : "reject kyc"},
			isSeen:false,
			created:new Date()
		}
		await app.db.notification().insertOne(notification)
		

			res.send('success').status(200);
		 }else{
			res.send('access_denied').status(401);

		 }
	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	
	}
	})


    app.get('/auth/admin/:userId', async (req, res)=>{
        try {
          const userId = +req.params.userId;
        
          const token = await app.db.accessToken().findOne({user_id: userId});
          var param = {"access_token": token.token, "expires_in": token.expires_at, "token_type": "bearer", "scope": "user"};
            res.redirect(app.config.basedURl +"/login?token=" + JSON.stringify(param))
          
      } catch (err) {
          res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
       }
      })

	return app;

}
