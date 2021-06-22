const { async } = require('hasha');

module.exports = function (app) {


	let ejs = require('ejs');
	var ObjectId = require('mongodb').ObjectId;
	var fs = require('fs');
	var mongoose = require('mongoose');
	var request = require('request');
	const cron =require('node-cron');
	var bodyParser = require('body-parser');
	app.use( bodyParser.json() )

	const Grid = require('gridfs-stream');
	const GridFsStorage = require('multer-gridfs-storage');

	const path = require('path');
	const multer = require('multer');
    const Big = require('big.js');
	const mongoURI = app.config.mongoURI;

	var rp = require('request-promise');
    const etherInWei = new Big(1000000000000000000);
    const handlebars = require('handlebars');

	const nodemailer = require("nodemailer");

	var transporter = nodemailer.createTransport(app.config.mailerOptions);


	const storage = new GridFsStorage({
		url: mongoURI,
		options: { useNewUrlParser: true,useUnifiedTopology: true },
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
			  const filename = file.originalname;
			  const fileInfo = {
				filename: filename,
				bucketName: 'campaign_kit'
			  };
			  resolve(fileInfo);
		  });
		}
	  });


	  const storageImage = new GridFsStorage({
		url: mongoURI,
		options: { useNewUrlParser: true ,useUnifiedTopology: true},
		file: (req, file) => {
		  return new Promise((resolve, reject) => {
			  const filename = file.originalname;
			  const fileInfo = {
				filename: filename,
				bucketName: 'campaign_cover'
			  };
			  resolve(fileInfo);

		  });
		}
	  });



	  // here I used multer to upload files
      // you can add your validation here, such as file size, file extension and etc.
	  const uploadImage = multer({ storage : storageImage,inMemory: true}).single('file');
	  const upload = multer({ storage });




	  let readHTMLFile = function(path, callback) {
		fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
		  if (err) {
			throw err;
			callback(err);
		  }
		  else {
			callback(null, html);
		  }
		});
	  };


    app.set("view engine", "ejs");




	var BN = require("bn.js");

	var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);
	  const conn=mongoose.createConnection(mongoURI);
	  let gfs;
	  let gfsKit;




	  conn.once('open', () => {
		gfs = Grid(conn.db, mongoose.mongo);
		gfsKit = Grid(conn.db, mongoose.mongo);
		gfs.collection('campaign_cover');
		gfsKit.collection('campaign_kit');
	  });




	  cron.schedule('*/30 * * * *',()=>{
		updateStat();
		 })

		

	  let updateStat= async ()=>{
		 console.log("debut de traitement")
		promDetail=[];
		let prom;
		var Events = await app.db.event().find({ prom: { $exists: true} }).toArray();
		Events.forEach(async (event)=>{
			var idProm = event.prom;
			prom = await app.oracle.getPromDetails(idProm)
			console.log(prom)
				var stat={};
			
				stat.status = prom.isAccepted
				stat.id_wallet = prom.influencer
				stat.id_campaign = prom.idCampaign
				stat.id_prom=idProm;
				stat.fund = prom.funds.amount;
				stat.idPost = prom.idPost
				stat.idUser = prom.idUser
				stat.isPayed = prom.isPayed;
				stat.typeSN=prom.typeSN.toString();
				stat.date=Date('Y-m-d H:i:s');
				if(stat.typeSN=="1"){
				//tester si le lien facebook on recupere les stats de facebook;
					oraclesFacebook = await app.oracle.facebook(prom.idUser,prom.idPost);
					stat.shares=oraclesFacebook.shares;
					stat.likes=oraclesFacebook.likes;
					stat.views=oraclesFacebook.views;
					stat.oracle = 'facebook'
								}
				//youtube
				else if(stat.typeSN=="2"){
				//tester si le lien youtube on recupere les stats de youtube;
					oraclesYoutube = await app.oracle.youtube(prom.idPost);
					stat.shares=oraclesYoutube.shares;
					stat.likes=oraclesYoutube.likes;
					stat.views=oraclesYoutube.views;
					stat.oracle = 'youtube'
								}
				//instagram
				else if(stat.typeSN=="3"){
				//tester si le lien instagram on recupere les stats de instagram;
					oraclesInstagram = await app.oracle.instagram(prom.idPost);
					stat.shares=oraclesInstagram.shares;
					stat.likes=oraclesInstagram.likes;
					stat.views=oraclesInstagram.views;
					stat.oracle = 'instagram'
								}
				//twitter
				else{
				//tester si le lien twitter on recupere les stats de twitter;
					oraclesTwitter= await app.oracle.twitter(prom.idUser,prom.idPost);
					stat.shares=oraclesTwitter.shares;
					stat.likes=oraclesTwitter.likes;
					stat.views=oraclesTwitter.views;
					stat.oracle = 'twitter'
								}

                  let campaign_link = stat
				let result = await app.db.campaign_link().find({id_prom:stat.id_prom}).toArray()
                        if(result[0]){
							await app.db.campaign_link().updateOne({id_prom:stat.id_prom},{$set: campaign_link},{returnOriginal: false})
						} else{
							console.log(stat, "stat script")
							await app.db.campaign_link().insertOne(stat);
						}
                         
						if(prom.isAccepted){
					let	element = await app.db.CampaignLinkStatistic().find({id_prom:stat.id_prom}).sort({date:-1}).toArray();
						if(element[0]){
							if(stat.shares!=element[0].shares || stat.likes!=element[0].likes || stat.views!=element[0].views){
								stat.sharesperDay=Number(stat.shares)-Number(element[0].shares);
								stat.likesperDay=Number(stat.likes)-Number(element[0].likes);
								stat.viewsperDay=Number(stat.views)-Number(element[0].views);
								try{
								//tester si il y 'a un changement sur un lien exist on ajoute le lien avec les changements;
									await app.db.CampaignLinkStatistic().insertOne(stat);
									stat=null;
								}catch(err){
									console.log('{"error":"'+(err.message?err.message:err.error)+'"}');
								}
							}
						}else{
								stat.sharesperDay=stat.shares;
								stat.likesperDay=stat.likes;
								stat.viewsperDay=stat.views;
								try{
								//tester si le lien n'existe pas on ajoute un nouveau ligne;
									await app.db.CampaignLinkStatistic().insertOne(stat);
									stat=null;
								}catch(err){
									console.log('{"error":"'+(err.message?err.message:err.error)+'"}');
											}
								}
						}
					

	})

	 }


	app.post('/updateStat', updateStat)


	/*
	@url : /stat/:idProm
	@description: récupère les stats d'un proms par jour(si un jours n'existe pas alors likes,shares,view=0)
	@params:
    idProm : id prom
	{headers}
	@Output array of proms
	*/
	app.get('/stat/:idProm',async (req, response) => {
		try {
			const prom = req.params.idProm;
			const token = req.headers["authorization"].split(" ")[1];
			await app.crm.auth(token);
			arrayOfProms=[];
			const stat= await app.db.CampaignLinkStatistic().find({id_prom:prom}).toArray();
			stat.forEach((statistic)=>{
				let prom={};
				prom.date=statistic.date;
				prom.sharesperDay=statistic.sharesperDay;
				prom.likesperDay=statistic.likesperDay;
				prom.viewsperDay=statistic.viewsperDay;
				arrayOfProms.push(prom);
			})
			response.send(arrayOfProms);

		} catch (err) {
			response.send('{"error":"'+(err.message?err.message:err.error)+'"}');

		}
	})
/**
 * @swagger
 * /campaign/create:
 *   post:
 *     summary: create campaign {deprecated}.
 *     description: parametres acceptées :body{campaign}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: dataUrl
 *         description: data url.
 *       - name: startDate
 *         description: start date.
 *       - name: endDate
 *         description: end date
 *       - name: token
 *         description: access token
 *     responses:
 *        "200":
 *          description: data
 *        "500":
 *          description: error:error message
 */
	app.post('/campaign/create', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var reward = req.body.rewardType || 1;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.createCampaign(dataUrl,startDate,endDate,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {

			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});
/**
 * @swagger
 * /v2/campaign/create:
 *   post:
 *     summary: create campaign.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: dataUrl
 *         description: data url.
 *       - name: startDate
 *         description: start date.
 *       - name: endDate
 *         description: end date
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/v2/campaign/create', async function(req, response) {
		let token = req.headers["authorization"].split(" ")[1];

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var reward = req.body.rewardType || 1;

		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.createCampaign(dataUrl,startDate,endDate,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {

			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

	});

	app.post('/campaign/create/all', async function(req, response) {
	console.log(req.body);
		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var ratios = req.body.ratios;
		let id =req.body.idCampaign

		try {

			var res = await app.crm.auth(req.body.token);

			var cred = await app.account.unlock(res.id,pass);
			



			if(app.config.testnet && token == app.config.ctrs.token.address.mainnet) {
				token = app.config.ctrs.token.address.testnet;
			}



			/*var balance = await app.erc20.getBalance(token,cred.address);

			if( (new BN(balance.amount)).lt(new BN(amount)) )
			{
				response.end('{"error":"Insufficient token amount expected '+amount+' got '+balance.amount+'"}');
			}*/

			var ret = await app.campaign.createCampaignAll(dataUrl,startDate,endDate,ratios,token,amount,cred);
			if(ret){
				await app.db.campaignCrm().updateOne({_id : app.ObjectId(id)},{$set:{hash : ret}});
			}

			response.end(JSON.stringify({transactionHash : ret}));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});
/**
 * @swagger
 * /v2/campaign/create/all:
 *   post:
 *     summary: create campaign.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: dataUrl
 *         description: data url.
 *       - name: startDate
 *         required: true
 *         description: start date.
 *       - name: endDate
 *         description: end date.
 *       - name: ERC20token
 *         required: true
 *         description: ERC20 token.
 *       - name: amount
 *         description: amount de la campaign.
 *       - name: ratios
 *         description: campaign ratios array, (likeRatio,shareRatio,viewRatio,reachLimit) x4 (facebook,youtube,insta,twitter)
 *     responses:
 *        "200":
 *          description: campaign hash
 */
	app.post('/v2/campaign/create/all', async (req, res)=> {

		let token = req.headers["authorization"].split(" ")[1];
		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var ERC20token = req.body.ERC20token;
		var amount = req.body.amount;
		var ratios = req.body.ratios;
        let id =req.body.idCampaign
		try {

			var auth = await app.crm.auth(token);
			var cred = await app.account.unlock(auth.id,pass);


			if(app.config.testnet && ERC20token == app.config.ctrs.token.address.mainnet) {
				ERC20token = app.config.ctrs.token.address.testnet;
			}


			/*var balance = await app.erc20.getBalance(token,cred.address);

			if( (new BN(balance.amount)).lt(new BN(amount)) )
			{
				res.end('{"error":"Insufficient token amount expected '+amount+' got '+balance.amount+'"}');
			}*/

			var ret = await app.campaign.createCampaignAll(dataUrl,startDate,endDate,ratios,ERC20token,amount,cred);
			if(ret){
				await app.db.campaignCrm().updateOne({_id : app.ObjectId(id)},{$set:{hash : ret}});
			}

			res.end(JSON.stringify({transactionHash : ret}));

		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});


	/**
	 * @swagger
	 * /v2/campaign/create/bounties:
	 *   post:
	 *     summary: create campaign with bounties.
	 *     description: parametres acceptées :body{campaign} , headers{headers}.
	 *     parameters:
	 *       - name: pass
	 *         description: password of user.
	 *       - name: dataUrl
	 *         description: data url.
	 *       - name: startDate
	 *         required: true
	 *         description: start date.
	 *       - name: endDate
	 *         description: end date.
	 *       - name: ERC20token
	 *         required: true
	 *         description: ERC20 token.
	 *       - name: amount
	 *         description: amount credited to campaign.
	 *       - name: ratios
	 *         description: bounty array. (min,max,typeSN,amount)
	 *     responses:
	 *        "200":
	 *          description: data
	 */
		app.post('/v2/campaign/create/bounties', async function(req, response) {
			let token = req.headers["authorization"].split(" ")[1];
			var pass = req.body.pass;
			var dataUrl = req.body.dataUrl;
			var startDate = req.body.startDate;
			var endDate = req.body.endDate;
			var ERC20token = req.body.ERC20token;
			var amount = req.body.amount;
			var bounties = req.body.bounties;

			try {

				var res = await app.crm.auth(token);
				var cred = await app.account.unlock(res.id,pass);

				if(app.config.testnet && ERC20token == app.config.ctrs.token.address.mainnet) {
					ERC20token = app.config.ctrs.token.address.testnet;
				}

				/*var balance = await app.erc20.getBalance(token,cred.address);

				if( (new BN(balance.amount)).lt(new BN(amount)) )
				{
					response.end('{"error":"Insufficient token amount expected '+amount+' got '+balance.amount+'"}');
				}*/

				var ret = await app.campaign.createCampaignBounties(dataUrl,startDate,endDate,bounties,ERC20token,amount,cred);
				response.end(JSON.stringify(ret));

			} catch (err) {
				response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
			}
			finally {
				app.account.lock(cred.address);
			}

		});


	/*
     @Url :/campaign/insert_link_notification'
     @description: notify campaign owner
     @parameters => request_body :
     campaign_id : id of the campaign
     link : link
     */

	 app.post('/campaign/insert_link_notification', async function(req, res) {
        try {
		   let campaign_id=req.body.idCampaign
		   let link=req.body.link
		   let campaign={}
		 await  app.db.campaignCrm().findOne({hash:campaign_id},async function (err, result) {
			   campaign.owner= Number(result.idNode.substring(1))
               campaign.title=result.title
			   campaign.hash=result.hash
			   manageTime()
			   let notification={
				idNode:campaign.owner,//owner id
				type:"cmp_candidate_insert_link",//done
				status:"done",//done
				label:{cmp_name :campaign.title,date :campaign.created, cmp_hash:campaign.hash},
				isSeen:false,//done
				isSend:false,
				attachedEls:{
					id:campaign_id
			  },
			  created:new Date()
			}
		  await	app.db.notification().insertOne(notification)

		  await	app.db.sn_user().findOne({_id:campaign.owner}, function (err, result) {
		fs.readFile(__dirname + '/emailtemplate/Email_Template_link_added.html', 'utf8' ,async(err, data) => {
				if (err) {
				  console.error(err)
				  return
				}
				var data_={
					cmp:{
						name:campaign.title,
						link:link
					}
				}
				let dynamic_html=ejs.render(data, data_);
				console.log(dynamic_html)
				var mailOptions = {
			     from: app.config.mailSender,
			     to: result.email,
			     subject: 'New link was added To your campaign',
			     html: dynamic_html
			};

		 await transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					res.end(JSON.stringify(error))
				} else {
					console.log("email was sent")
					res.end(JSON.stringify(info.response))
				}
			  });
			})
		  });
			})


		   function manageTime (){
			var d = new Date();
			var date = d.getDate();
			var month = d.getMonth() + 1;
			var year = d.getFullYear();
			var seconds = d.getSeconds();
			var minutes = d.getMinutes();
			var hour = d.getHours();
			campaign.date=year+ "-" + month + "-" + date+" "+hour+":"+minutes+":"+seconds
		   }

        } catch (err) {
			res.end('{"error"console.log(link,campaign_id):"'+(err.message?err.message:err.error)+'"}');
        }
	});

	app.post('/campaign/create/youtube', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var likeRatio = req.body.likeRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.createCampaignYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});



	app.post('/campaign/modify', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var idCampaign = req.body.idCampaign;


		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.modCampaign(idCampaign,dataUrl,startDate,endDate,reward,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});
/**
 * @swagger
 * /v2/campaign/modify:
 *   post:
 *     summary: update campaign.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         required: true
 *         description: password of user.
 *       - name: dataUrl
 *         description: data url.
 *       - name: startDate
 *         description: start date.
 *       - name: endDate
 *         description: end date.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: data
 *        "500":
 *          description: error:error message
 */
	app.post('/v2/campaign/modify', async function(req, response) {

		var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var idCampaign = req.body.idCampaign;
		let token = req.headers["authorization"].split(" ")[1];


		try {
			var res = await app.crm.auth( token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.modCampaign(idCampaign,dataUrl,startDate,endDate,reward,cred);
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	/**
 * @swagger
 * /campaign/fund:
 *   post:
 *     summary: Increase budget.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: amount
 *         description: amount of campaign.
 *       - name: ERC20token
 *         description: ERC20token.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/campaign/fund', async (req, response) =>{

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		let access_token = req.headers["authorization"].split(" ")[1];

		try {
			var auth = await app.crm.auth(access_token);
			var cred = await app.account.unlock(auth.id,pass);
			var ret = await app.campaign.fundCampaign(idCampaign,token,amount,cred);
			if(ret.transactionHash){
			const ctr = await app.campaign.getCampaignContract(idCampaign);
			let fundsInfo = await ctr.methods.campaigns(idCampaign).call();
			ret.remaining = fundsInfo.funds[1]

			 await app.db.campaignCrm().findOne({hash : idCampaign},async (err, result)=>{
				 let budget = new Big(result.cost).plus(new Big(amount)).toFixed();
                 await app.db.campaignCrm().updateOne({hash:idCampaign}, {$set: {cost: budget}});
			 })
			}
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/price/ratio', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var likeRatio = req.body.likeRatio;
		var shareRatio = req.body.shareRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.priceRatioCampaign(idCampaign,typeSN,likeRatio,shareRatio,viewRatio,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	/*app.post('/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			var ret = await app.campaign.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
			response.end(JSON.stringify(ret));


		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});*/

	/**
	 * Check if the link already exists
	 */
	app.get('/campaign/checklink/:typeSN/:idPost/:idUser', async function(req, response) {

		let typeSN = req.params.typeSN;
		let idPost = req.params.idPost;
		let idUser = req.params.idUser ? req.params.idUser:"";

		try {
			let links = await app.db.apply().find({typeSN:typeSN, idPost:idPost, idUser:idUser}).toArray();
			if (!links.length) {
				response.end('{"exist":false}');
			} else {
				response.end('{"exist":true}');
			}
		} catch (err) {
			response.end('{"error":"' + (err.message ? err.message : err.error) + '"}');
		}
	});

	app.post('/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		var ctr = await app.campaign.getCampaignContract(idCampaign);

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);

			/*if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				var applyLink = {idCampaign:idCampaign,influencer:cred.address,typeSN:typeSN,idPost:idPost,idUser:idUser,date:Date.now(),isAccepted:false};
				var ret = await app.db.apply().insertOne(applyLink);
				response.end(JSON.stringify(ret.insertedId));
			}*/
		//	else {
				var ret = await app.campaign.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
				response.end(JSON.stringify(ret));
		//	}



		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			if(cred)
			app.account.lock(cred.address);
		}
	});
/**
 * @swagger
 * /v2/campaign/apply:
 *   post:
 *     summary: Increase budget.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         required: true
 *         description: password of user.
 *       - name: amount
 *         description: amount of campaign.
 *       - name: ERC20token
 *         description: ERC20token.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/v2/campaign/apply', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;
        let token = req.headers["authorization"].split(" ")[1]
		let res = await app.crm.auth(token)
		let id = res.id

		var ctr = await app.campaign.getCampaignContract(idCampaign);

		try {
			var cred = await app.account.unlock(id,pass);

			/*if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet)
			{
				var applyLink = {idCampaign:idCampaign,influencer:cred.address,typeSN:typeSN,idPost:idPost,idUser:idUser,date:Date.now(),isAccepted:false};
				var ret = await app.db.apply().insertOne(applyLink);
				response.end(JSON.stringify(ret.insertedId));
			}*/
		//	else {

				var ret = await app.campaign.applyCampaign(idCampaign,typeSN,idPost,idUser,cred)
                let campaign = await app.db.campaignCrm().findOne({hash:idCampaign});
				if(ret.transactionHash){
					let notification={
						idNode:"0"+id,
						type:"apply_campaign",
						status:"done",
						label:{cmp_name :campaign.title},
						isSeen:false,
						isSend:false,
						attachedEls:{
							id:id
					  },
					  created:new Date()
					}
					await app.db.notification().insertOne(notification);
				}
				response.end(JSON.stringify(ret));
		//	}



		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/validate', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idApply = req.body.idProm;
        let token = req.headers["authorization"].split(" ")[1];
		var ctr = await app.campaign.getCampaignContract(idCampaign);


		try {
			var res = await app.crm.auth(token);
			var cred = await app.account.unlock(res.id,pass);
			/*if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet) {

				var prom = await app.db.apply().findOne({_id:app.ObjectId(idApply)});

				var ret = await app.campaign.applyAndValidateCampaign(prom.idCampaign,prom.influencer,prom.typeSN,prom.idPost,prom.idUser,cred);

				var prom = await app.db.apply().deleteOne({_id:app.ObjectId(idApply)});

			}
			else {*/
				var ret = await app.campaign.validateProm(idApply,cred)

		//	}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

/**
 * @swagger
 * /v2/campaign/validate:
 *   post:
 *     summary: Increase budget.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: idProm
 *         description: id of campaign.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/v2/campaign/validate', async function(req, res) {

		let pass = req.body.pass;
		let idCampaign = req.body.idCampaign;
		let idApply = req.body.idProm;
		let token = req.headers["authorization"].split(" ")[1];
        let link = req.body.link
		var ctr = await app.campaign.getCampaignContract(idCampaign);


		try {

			const lang = req.query.lang || "en";
			app.i18n.configureTranslation(lang);

			var auth = await app.crm.auth(token);
			var cred = await app.account.unlock(auth.id,pass);
			/*if(ctr == app.config.ctrs.campaignAdvFee.address.mainnet) {

				var prom = await app.db.apply().findOne({_id:app.ObjectId(idApply)});

				var ret = await app.campaign.applyAndValidateCampaign(prom.idCampaign,prom.influencer,prom.typeSN,prom.idPost,prom.idUser,cred);

				var prom = await app.db.apply().deleteOne({_id:app.ObjectId(idApply)});

			}
			else {*/
				let ret = await app.campaign.validateProm(idApply,cred);

                 if(ret.transactionHash){

					const campaign = await app.db.campaignCrm().findOne({hash:idCampaign});
					const id = req.body.idUser;
                    const email = req.body.email;

                    const notification={
						idNode:"0"+id,
						type:"cmp_candidate_accept_link",
						status:"done",
						label:{cmp_name:campaign.title, action : "link_accepted", cmp_link : link, cmp_hash : campaign.hash},
						isSeen:false,
						isSend:false,
						attachedEls:{
							id:id
					  },
					  created:new Date()
					}
					await app.db.notification().insertOne(notification);

					readHTMLFile(__dirname + '/emailtemplate/email_validated_link.html' ,(err, html) => {
						if (err) {
							console.error(err)
							return
						  }
						  let template = handlebars.compile(html);

						    let emailContent = {
							cmp_link : app.config.basedURl + '/campaign/id/' + idCampaign,
							satt_faq : app.config.Satt_faq,
							satt_url: app.config.basedURl,
							cmp_title: campaign.title,
							imgUrl: app.config.baseEmailImgURl
						    };
								let htmlToSend = template(emailContent);

								let mailOptions = {
								 from: app.config.mailSender,
								 to: email,
								 subject: 'Your link has been accepted in a campaign',
								 html: htmlToSend
							};

						  transporter.sendMail(mailOptions, function(error, info){
								if (error) {
									res.end(JSON.stringify(error))
								} else {
									console.log("email was sent")
								return	res.end(JSON.stringify(ret))
								}
							  });
							})
				 }

			res.end(JSON.stringify(ret));

		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});
	app.post('/campaign/start', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.startCampaign(idCampaign,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});
	/*app.post('/campaign/validate', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;
		var accepted = req.body.accepted;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.validateProm(idProm,cred)
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	});*/


	app.post('/campaign/end', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.endCampaign(idCampaign,cred)
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/gains', async function(req, response) {

		var pass = req.body.pass;
		var idProm = req.body.idProm;

		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth( req.body.token);
			var cred2 = await app.account.unlock(res.id,pass);

			var gasPrice = await app.web3.eth.getGasPrice();
			app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			var prom = await app.campaign.methods.proms(idProm).call();
			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			//console.log(prevstat);

			requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
			var cred = {address: app.config.campaignOwner};
			if(!requests.length)
			{




				if(prevstat.length &&( stats.likes < prevstat[0].likes || stats.shares < prevstat[0].shares || stats.views < prevstat[0].views))
				{

				 // pas d'oracle BUG
				}
				else if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{

					var evts = await app.campaign.updateCampaignStats(prom.idCampaign,cred);
					for(var i=0;evts.events[i];i++)
					{

						var evt = evts.events[i];
						if(evt.raw.topics[0] == "0xb67322f1a9b0ad182e2b242673f8283103dcd6d1c8a19b47ff5524f89d9758ed")
						{
							var idRequest = evt.raw.topics[1];
							var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
							if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
								requests = [{id:idRequest}];
						}
					}

					//requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:app.campaign.contract.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

/**
 * @swagger
 * /v2/campaign/gains:
 *   post:
 *     summary: Increase budget.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: idProm
 *         description: id of prom.
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/v2/campaign/gains', async function(req, response) {

		var pass = req.body.pass;
		var idProm = req.body.idProm;
		let token = req.headers["authorization"].split(" ")[1];

		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth(token);
			var cred2 = await app.account.unlock(res.id,pass);

			var gasPrice = await app.web3.eth.getGasPrice();
			app.web3.eth.accounts.wallet.decrypt([app.campaignWallet], app.config.campaignOwnerPass);
			var prom = await app.campaign.methods.proms(idProm).call();
			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			//console.log(prevstat);

			requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
			var cred = {address: app.config.campaignOwner};
			if(!requests.length)
			{




				if(prevstat.length &&( stats.likes < prevstat[0].likes || stats.shares < prevstat[0].shares || stats.views < prevstat[0].views))
				{

				 // pas d'oracle BUG
				}
				else if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{

					var evts = await app.campaign.updateCampaignStats(prom.idCampaign,cred);
					for(var i=0;evts.events[i];i++)
					{

						var evt = evts.events[i];
						if(evt.raw.topics[0] == "0xb67322f1a9b0ad182e2b242673f8283103dcd6d1c8a19b47ff5524f89d9758ed")
						{
							var idRequest = evt.raw.topics[1];
							var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
							if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
								requests = [{id:idRequest}];
						}
					}

					//requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:app.campaign.contract.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/gains2', async function(req, response) {

		var pass = req.body.pass;
		var idProm = req.body.idProm;

		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth( req.body.token);
			var cred2 = await app.account.unlock(res.id,pass);
			var ctr = await app.campaign.getPromContract(idProm);

				/*if(ctr.isCentral) {
					var ret = await  app.campaignCentral.getGains(idProm,cred2);
					response.end(JSON.stringify(ret));
					return;
				}*/

		  var gasPrice = await ctr.getGasPrice();
			var prom = await ctr.methods.proms(idProm).call();

			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			//console.log(prevstat);

			requests = await app.db.request().find({isNew:true,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();
			var cred = {address: app.config.campaignOwner};
			if(!requests.length)
			{

				if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{
					  var evts = await app.campaign.updatePromStats(idProm,cred2);
							console.log("oracle log",evts);
						var evt = evts.events[0];
						var idRequest = evt.raw.topics[1];
						var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
						if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
							requests = [{id:idRequest}];
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:ctr.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {

			response.end(JSON.stringify({ error: err.message?err.message:err.error }));
		}
		finally {
			app.account.lock(cred.address);
		}
	});


/**
 * @swagger
 * /v2/campaign/gains2:
 *   post:
 *     summary: Increase budget.
 *     description: parametres acceptées :body , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: idProm
 *         description: id of prom.
 *     responses:
 *        "200":
 *          description: data
 */
	app.post('/v2/campaign/gains2', async (req, response) =>  {
		let token = req.headers["authorization"].split(" ")[1];

		var pass = req.body.pass;
		var idProm = req.body.idProm;



		var stats;
		var requests = false;
		var abi = [{"indexed":true,"name":"idRequest","type":"bytes32"},{"indexed":false,"name":"typeSN","type":"uint8"},{"indexed":false,"name":"idPost","type":"string"},{"indexed":false,"name":"idUser","type":"string"}];
		try {

			var count = await app.db.ban().find({idProm:idProm}).count();
			if(count) {
				response.end('{"error":"oracle not available"}');
				return;
			}

			var res = await app.crm.auth(token);
			var cred2 = await app.account.unlock(res.id,pass);
			var ctr = await app.campaign.getPromContract(idProm);



		  var gasPrice = await ctr.getGasPrice();
			let prom = await ctr.methods.proms(idProm).call();
             if(prom.funds.amount === "0"){
				response.end(JSON.stringify({message : "No funds to claim"}));
				return;
			 }
			var cmp  = await ctr.methods.campaigns(prom.idCampaign).call();

			if(cmp.bounties && cmp.bounties.length) {

				var evts = await app.campaign.updateBounty(idProm,cred2);
				stats = await app.oracleManager.answerAbos(prom.typeSN,prom.idPost,prom.idUser);
				await app.db.request().updateOne({id:idProm},{$set:{nbAbos:stats,isBounty:true,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerBounty({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:ctr.options.address,idProm:idProm,nbAbos:stats});
				var ret = await app.campaign.getGains(idProm,cred2);
				response.end(JSON.stringify(ret));
				return;

			}

			var prevstat = await app.db.request().find({isNew:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).sort({date: -1}).toArray();
			stats = await app.oracleManager.answerOne(prom.typeSN,prom.idPost,prom.idUser);
			//console.log(prevstat);

			requests = await app.db.request().find({isNew:true,isBounty:false,typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}).toArray();

			if(!requests.length)
			{

				if(!prevstat.length || stats.likes != prevstat[0].likes || stats.shares != prevstat[0].shares || stats.views != prevstat[0].views)
				{
					  var evts = await app.campaign.updatePromStats(idProm,cred2);
						console.log("oracle log",evts);
						var evt = evts.events[0];
						var idRequest = evt.raw.topics[1];
						var log = app.web3.eth.abi.decodeLog(abi,evt.raw.data,evt.raw.topics.shift());
						if(log.typeSN == prom.typeSN && log.idPost == prom.idPost && log.idUser == prom.idUser)
							requests = [{id:idRequest}];
				}
			}
			if(requests.length)
			{
				console.log("updateOracle",requests);
				await app.db.request().updateOne({id:requests[0].id},{$set:{id:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views,isNew:false,date :Date.now(),typeSN:prom.typeSN,idPost:prom.idPost,idUser:prom.idUser}},{ upsert: true });
				await app.oracleManager.answerCall({gasPrice:gasPrice,from:app.config.campaignOwner,campaignContract:ctr.options.address,idRequest:requests[0].id,likes:stats.likes,shares:stats.shares,views:stats.views});
			}


			//console.log("getGains",idProm);
			var ret = await app.campaign.getGains(idProm,cred2);
			//var ret = {}
			response.end(JSON.stringify(ret));

		} catch (err) {

			// response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
			response.end(JSON.stringify({error:err.message?err.message:err.error}));
		}
		finally {
			app.account.lock(cred2.address);
		}
	});

	app.post('/campaign/remaining', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.campaign.getRemainingFunds(idCampaign,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/tag', async function(req, response) {

		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var campaign = await app.campaign.contract.methods.campaigns(idCampaign).call();
			var proms = await app.campaign.contract.methods.getProms(idCampaign).call();
			var isAdmin = false;
			var found = false;
			if(res.id == 1023)
			{
				isAdmin = true;
			}
			if(!isAdmin && campaign.advertiser != cred.address)
			{
				response.end('{error:"Unauthorized"}');
				return;
			}
			for(var i=0;i<proms.length;i++)
			{
				if(proms[i] == idProm)
					found = true;
			}
			if(!found)
			{
				response.end('{error:"Unknown prom"}');
				return;
			}
			await app.db.ban().insertOne({idCampaign:idCampaign,idProm:idProm,date:Date.now(),admin:isAdmin});
			response.end('{"idProm":"'+idProm+'"}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/untag', async function(req, response) {
		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var campaign = await app.campaign.contract.methods.campaigns(idCampaign).call();
			var proms = await app.campaign.contract.methods.getProms(idCampaign).call();
			var isAdmin = false;
			var found = false;
			if(res.id == 1023)
			{
				isAdmin = true;
			}
			if(!isAdmin && campaign.advertiser != cred.address)
			{
				response.end('{error:"Unauthorized"}');
				return;
			}
			for(var i=0;i<proms.length;i++)
			{
				if(proms[i] == idProm)
					found = true;
			}
			if(!found)
			{
				response.end('{error:"Unknown prom"}');
				return;
			}
			await app.db.ban().deleteOne({idProm:idProm});
			response.end('{idProm:"'+idProm+'"}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/token/approve', async function(req, response) {

		var pass = req.body.pass;
		var spender = req.body.spender;
		var allowance = new BN("100000000000000000000000000000");

		try {
			var res = await app.crm.auth( req.body.token);
			var cred = await app.account.unlock(res.id,pass);
			var ret = await app.token.approve(cred.address,spender,app.web3.utils.toHex(allowance));
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.get('/token/allowance/:addr/:spender', async function(req, response) {

		var addr = req.params.addr;
		var spender = req.params.spender;
		var ret = await app.token.getApproval(addr,spender)
		response.end(JSON.stringify(ret));
	});

	app.post('/campaign/estimate/create/youtube', async function(req, response) {


		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		var likeRatio = req.body.likeRatio;
		var viewRatio = req.body.viewRatio;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateCreateCampaignYt(dataUrl,startDate,endDate,likeRatio,viewRatio,token,amount,cred);
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}

	});

	app.post('/campaign/estimate/fund', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var token = req.body.ERC20token;
		var amount = req.body.amount;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateFundCampaign(idCampaign,token,amount,cred);
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/apply', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateApplyCampaign(idCampaign,typeSN,idPost,idUser,cred)
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/validate', async function(req, response) {


		var idCampaign = req.body.idCampaign;
		var idProm = req.body.idProm;
		var accepted = req.body.accepted;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateValidateProm(idProm,cred)
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/gains', async function(req, response) {


		var idProm = req.body.idProm;
		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateGetGains(idProm,cred2);
			response.end('{"gas":'+gas+'}');

		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/campaign/estimate/remaining', async function(req, response) {


		var idCampaign = req.body.idCampaign;

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.campaign.estimateGetRemainingFunds(idCampaign,cred);
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});

	app.post('/token/estimate/approve', async function(req, response) {


		var spender = req.body.spender;
		var allowance = new BN("100000000000000000000000000000");

		try {
			var res = await app.crm.auth( req.body.token);
			var account = await app.db.wallet().findOne({UserId: parseInt(res.id)});
			var cred =  {address:"0x"+account.keystore.address};
			var gas = await app.token.estimateApprove(cred.address,spender,app.web3.utils.toHex(allowance));
			response.end('{"gas":'+gas+'}');
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
			app.account.lock(cred.address);
		}
	});


	/*
     @url : /kit/:idKit
     @description: deleting campaign chosen kit
     @params:
     @Input idKit : id of the kid
	 @Output delete message
     */

	app.delete('/kit/:idKit', async (req, res) => {
		try {
			let token = req.headers["authorization"].split(" ")[1];
            await app.crm.auth(token);
			const idKit = req.params.idKit
			gfsKit.files.findOneAndDelete({ _id: app.ObjectId(idKit) },(err, data)=>{
				res.send(JSON.stringify({message :'deleted'}))
			})

	  } catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');	  }

	  })

/*
     @link : /campaign/deleteDraft/:id
     @description: supprimer un campaign brouillon
     @params:
     @Input id : identifiant de la campaign {headers}
	 @Output delete message

     */
	app.delete('/campaign/deleteDraft/:id', async (req, res) => {
		try {
			const id= req.params.id;
			const token = req.headers["authorization"].split(" ")[1];
			await app.crm.auth( token);
			await app.db.campaignCrm().deleteOne({_id:app.ObjectId(id)});
			res.end(JSON.stringify({message :'Draft deleted'})).status(200);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');}
	});



	 /*
     @link : /addKit
     @description: saving user kits & links
     @params:
     idCampaign : identifiant de la campaign req.body.campaign
     */
	app.post('/addKit', upload.single('file'), async(req, res) => {
		try {
		let token = req.headers["authorization"].split(" ")[1];
        await app.crm.auth(token);
		const idCampaign = req.body.campaign
		const link = req.body.link
		if(req.file){
			 gfsKit.files.updateOne({ _id: req.file.id },{$set: { campaign : {
			"$ref": "campaign",
			"$id": app.ObjectId(idCampaign),
			"$db": "atayen"
		 }}, mimeType : req.file.contentType })
		 res.send(JSON.stringify({message :'Kit uploaded'})).status(200);
		} if(req.body.link){
		   gfsKit.files.insert({ campaign : {
				"$ref": "campaign",
				"$id": app.ObjectId(idCampaign),
				"$db": "atayen"
			 }, link : link })
			 res.send(JSON.stringify({message :'Kit uploaded'})).status(200);
		}
		res.send({message :'No matching data'}).status(404);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');		}
	  });



	/*
     @link : /addKits
     @description: saving user kits & links
     @params:
     idCampaign : identifiant de la campaign req.body.campaign
     */
	 app.post('/addKits', upload.array('file'), async(req, res) => {
		try {
		let token = req.headers["authorization"].split(" ")[1];
        await app.crm.auth(token);
		files=req.files;
		if(typeof req.body.link === "string"){
			links=Array(req.body.link);
		}else{
		     links=req.body.link;
		}

		const idCampaign = req.body.campaign
		if(files){
				files.forEach((file)=>{
					gfsKit.files.updateOne({ _id: file.id },{$set: { campaign : {
						"$ref": "campaign",
						"$id": app.ObjectId(idCampaign),
						"$db": "atayen"
					 }} })
				})
		 res.send(JSON.stringify({success: 'Kit uploaded'})).status(200);
		} if(links){
				links.forEach((link)=>{
					 gfsKit.files.insertOne({ campaign : {
					"$ref": "campaign",
					"$id": app.ObjectId(idCampaign),
					"$db": "atayen"
			 		}, link : link })
				})

			 res.send('Kit uploaded').status(200);
		}
		res.send('No matching data').status(401);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');		}
	  });


	     /*
     @link : /kit/:id
     @description: displaying kit image
     @Input : id = file Id
     @Output:image
     */
	app.get('/kit/:id', async (req, res) => {
		try{
		   const token = req.headers["authorization"].split(" ")[1];
		   await app.crm.auth(token);
		   const kit = req.params.id
		   gfsKit.files.findOne({ _id:app.ObjectId(kit)}  , (err, file) => {
			   if (!file.filename || file.length === 0) {
				 return res.json({
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
						'Content-Type': contentType ,
						'Content-Length': file.length,
						'Content-Disposition': `attachment; filename=${file.filename}`
					});
				 const readstream = gfsKit.createReadStream(file.filename);
				 readstream.pipe(res);
			   }
			 });

		   }catch (err) {
			   res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		   }

   })


	/*
     @link : /campaign/:idCampaign/kits
     @description: récupere les kits d'un campaign
     @params:
     idCampaign : identifiant de la campaign
	 {headers}
     */
	app.get('/campaign/:idCampaign/kits',async (req, response) => {
		try {
		const idCampaign= req.params.idCampaign;
		const token = req.headers["authorization"].split(" ")[1];
		await app.crm.auth(token);
		gfsKit.files.find({ 'campaign.$id':app.ObjectId(idCampaign)}).toArray(function (err, files) {
		response.end(JSON.stringify(files));
		})
		}catch (err) {
		response.end(JSON.stringify(err));
		}

	})

	/*
     @url : /campaign/save
     @description: saving campaign informations into db
     @params:
     @Input Campaign : campaign informations
	 @Output succeed message
     */
	/**
 * @swagger
 * /campaign/save:
 *   post:
 *     summary: save campaign.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: dataUrl
 *         required: true
 *         description: data url.
 *       - name: startDate
 *         description: start date.
 *       - name: endDate
 *         description: end date.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: succeed message
 *        "500":
 *          description: error:error message
 */
	app.post('/campaign/save', async (req, res) => {
		try {
			let token = req.headers["authorization"].split(" ")[1];
            const auth = await app.crm.auth(token);
		    const campaign = req.body
		    campaign.idNode = "0" + auth.id
		const draft = await app.db.campaignCrm().insertOne(campaign);
			res.end(JSON.stringify(draft.ops[0])).status(200);

		} catch (err) {
			res.end(JSON.stringify(err));
		}

	});

	/*
     @url : /campaign/:idCampaign/cover
     @description: get cover
     @params:
     @Input idCampaign : id of a campaign
	 @Output delete campaign cover
     */
	app.delete('/campaign/:idCampaign/cover', async (req, res) => {
		try {
			const token = req.headers["authorization"].split(" ")[1];
			await app.crm.auth(token);
			const campain = req.params.idCampaign
			gfs.files.findOneAndDelete({ 'campaign.$id': app.ObjectId(campain) },(err, data)=>{
				res.send(JSON.stringify({message :'delete'}))
			})
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');

		}

	})


	/*
     @link : /campaign/:idCampaign/cover
     @description: récupère l'image d'un campaign s'il existe sinon il retourne une image par defaut
     @params:
     @Input idCampaign : identifiant de la campaign
     */
	app.get('/campaign/:idCampaign/cover', async (req, res) => {
		try {
		// const token = req.headers["authorization"].split(" ")[1];
		// await app.crm.auth(token);
		const idCampaign = req.params.idCampaign;


				gfs.files.findOne({ 'campaign.$id': app.ObjectId(idCampaign) }, (err, file) => {
					if (!file || file.length === 0) {
						const imageName = "default_cover.png"
						const imagePath = path.join(__dirname,"../public/", imageName);

						const { size } = fs.statSync(imagePath);

						res.writeHead(200, {
							'Content-Type': 'image/png',
							'Content-Length': size,
							'Content-Disposition': `attachment; filename='${imageName}`
						});

						fs.createReadStream(imagePath).pipe(res);
					}
					else {
					  res.writeHead(200, {
											'Content-Type': 'image/png',
											// 'Content-Length': file.length,
											'Content-Disposition': `attachment; filename='${file.filename}`
										});
					  const readstream = gfs.createReadStream(file.filename);
					  readstream.pipe(res);
					}
				  });

		}catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}

		})


	/*
     @url : /campaign/:idCampaign/cover
     @description: Save campaign covers in db
     @params:
     @Input idCampaign : campaign id
    */

	app.post('/campaign/:idCampaign/cover',uploadImage, async(req, res)=>{
		try{
			const idCampaign = req.params.idCampaign;
			const token = req.headers["authorization"].split(" ")[1];
			await app.crm.auth(token);
			if(req.file){
			await gfs.files.findOneAndDelete({'campaign.$id': app.ObjectId(idCampaign)});
			await gfs.files.updateOne({ _id: app.ObjectId(req.file.id) },{$set: { campaign : {
				"$ref": "campaign",
				"$id": app.ObjectId(idCampaign),
				"$db": "atayen"
			 }} })
			res.json(JSON.stringify({message :'Cover added'}));
			}
			res.send(JSON.stringify({message :'No matching file found'}));
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
			}
	})

	/*
     @link : /campaign/owner_accepted_proms/:idWallet/:idCampaign
     @description: get accepted proms by owner
     @params:
	 @Input idCampaign : identifiant de la campaign
			idWallet:identifiant de la wallet
	 @Output array of accepted links
     */
	app.get('/campaign/owner_accepted_proms/:idCampaign',async(req, res)=>{
		try {
		const idCampaign = req.params.idCampaign;
		const token = req.headers["authorization"].split(" ")[1];
		await app.crm.auth( token);
		const allProms=await app.db.campaign_link().find({ $and: [ { id_campaign : idCampaign },{status : "accepted"}]}).toArray();

		res.send(allProms);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})



	/*
     @url : /campaign/stats_live
     @description: get live stats of campaign proms
     @params:
     @Input idProm : prom_id
	 @Output Object with stats
     */
	app.post('/campaign/stats_live', async(req, res)=>{
        try {
	    let token = req.headers["authorization"].split(" ")[1];
        await app.crm.auth(token);
		const idProm = req.body.prom_id
		const prom = await app.db.campaign_link().findOne({id_prom: idProm})
        let stats = {};
		stats.fund = prom.fund
		stats.likes = prom.likes;
		stats.shares = prom.shares;
		stats.views = prom.views;
		res.send(stats).status(200);
		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})




/**
 * @swagger
 * /campaign/links/{idCampaign}:
 *   get:
 *     summary: get rejected links of a campaign.
 *     description: parametres acceptées :params{idCampaign} , headers{headers}.
 *     parameters:
 *       - name: idCampaign
 *         in: path
 *         description: id de la campaign.
 *     responses:
 *        "200":
 *          description: array of links
 */
	app.get('/campaign/links/:idCampaign', async(req, res)=>{
		try {
		 let token = req.headers["authorization"].split(" ")[1];
         await app.crm.auth(token);
         const campaign = req.params.idCampaign
	     const links =  await app.db.campaign_link().find({ $and: [ { id_campaign : campaign }, { status : "rejected"}]}).toArray();
		res.send(JSON.stringify(links)).status(200);
	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');

	}
	})




	/**
 * @swagger
 * /rejectlink/{idLink}:
 *   get:
 *     summary: reject link .
 *     description: parametres acceptées :params{idLink} , headers{headers}.
 *     parameters:
 *       - name: idLink
 *         in: path
 *         description: id de ien a rejeter.
 *     responses:
 *        "200":
 *          description: success message
 *        "500":
 *          description: error message
 */
	 app.put('/rejectlink/:idLink', async(req, res)=>{

		const lang = req.query.lang || "en";
        app.i18n.configureTranslation(lang);

		try {
		 let token = req.headers["authorization"].split(" ")[1];
         await app.crm.auth(token)
         const reason =req.body.reason || "";
		 const idCampaign = req.body.idCampaign
         const idLink = req.params.idLink;
		 const email = req.body.email
		 let link = req.body.link
	     await app.db.campaign_link().updateOne({ id_prom : idLink }, {$set: { status : "rejected"}});
		 let campaign = await app.db.campaignCrm().findOne({hash : idCampaign});
		 let id = +req.body.idUser


		 const notification={
			idNode:"0"+id,
			type:"cmp_candidate_reject_link",
			status:"done",
			label:{cmp_name:campaign.title, action : "link_rejected", cmp_link : link, cmp_hash: campaign.hash},
			isSeen:false,
			isSend:false,
			attachedEls:{
				id:id
		  },
		  created:new Date()
		}
		await app.db.notification().insertOne(notification);

		readHTMLFile(__dirname + '/emailtemplate/rejected_link.html' ,(err, html) => {
			if (err) {
				console.error(err)
				return
			  }
			  let template = handlebars.compile(html);

				let emailContent = {
				reject_reason : reason,
				cmp_link : app.config.basedURl + '/campaign/id/' + idCampaign,
				satt_faq : app.config.Satt_faq,
				satt_url: app.config.basedURl,
				cmp_title: campaign.title,
				imgUrl: app.config.baseEmailImgURl
				};
					let htmlToSend = template(emailContent);

					let mailOptions = {
					 from: app.config.mailSender,
					 to: email,
					 subject: 'Your link has been rejected in a campaign',
					 html: htmlToSend
				};

			  transporter.sendMail(mailOptions, function(error, info){
					if (error) {
						res.end(JSON.stringify(error))
					} else {
						console.log("email was sent")
						res.end(JSON.stringify(info))
					}
				  });
				})

	} catch (err) {
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');

	}
	})





/**
 * @swagger
 * /campaign/{id}/update:
 *   put:
 *     summary: modifier campaign par id.
 *     description: parametres acceptées :body{campaign},headers{headers},params{id}.
 *     parameters:
 *       - name: title
 *         description: titre de la campaign.
 *       - name: tags
 *         description: tags de la campaign.
 *       - name: countries
 *         description: les pays de la campaign.
 *       - name: resume
 *         description: resume de la campaign.
 *       - name: description
 *         description: description de la campaign.
 *       - name: cost
 *         description: cost de la campaign.
 *       - name: time
 *         description: time de la campaign.
 *       - name: ratios
 *         description: les oracles de la campaign.
 *       - name: url
 *         description: liste des urls de la campaign.
 *       - name: file
 *         description: liste des files de la campaign.
 *     responses:
 *        "200":
 *          description: success:updated
 */
   app.put('/campaign/:idCampaign/update', async (req, res) => {
	try {
		// let token = req.headers["authorization"].split(" ")[1];
        //  await app.crm.auth(token);
		 let campaign = req.body;
		 console.log(campaign);
	const result = await app.db.campaignCrm().findOneAndUpdate({_id : app.ObjectId(req.params.idCampaign)}, {$set: campaign},{returnOriginal: false})
	const updatedCampaign = result.value
	res.send(JSON.stringify({updatedCampaign, success : "updated"})).status(201);
} catch (err) {

	console.error(err)
	res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
 }
   })


        /*
     @Url :API (link) /campaign/link/list/:addess?[option]'
     @description: fetch drafts and created campaign
	 @parameters : ID wallet
	 @option:
	 *Empty option Return Rejected and Accepted links
	 *Can be accepted OR REjected (rejected = true || accepted = true)
     addr : wallet address of user
     token : access token
     @response : object of arrays => draft and created campaigns
     */




	app.get('/campaign/link/list/:addess', async function(req, res) {

		try{
			let address=req.params.addess.toLowerCase()
			let Options =req.query
            var Links ={rejected:[],accepted:[]}

			var LinksCollection = await app.db.campaign_link().find({'influencer':address}).toArray();

            for(var i=0;i<LinksCollection.length;i++){

              let URl=LinksCollection[i]

				switch (URl['typeSN'])
				  {
					case 1:
						HandelUrl("https://www.facebook.com/" + URl.idUser + "/posts/" + URl.idPost,URl.isAccepted)
					  break;
					case 2:
					    HandelUrl("https://www.youtube.com/watch?v=" + URl.idPost,URl.isAccepted)
					  break;
					case 3:
					    HandelUrl("https://www.instagram.com/p/" + URl.idPost + "/",URl.isAccepted)
					  break;
					case 4:
						HandelUrl("https://twitter.com/" + URl.idUser + "/status/" + URl.idPost,URl.isAccepted)
					  break;
					default:
				  }
			}

		  function HandelUrl (url,IsAccepted)
			{
				if(!IsAccepted){

				  Links.rejected.push(url)

				}else{

				  Links.accepted.push(url)

				}
			}
console.log(Links)
        if(Options.rejected){
			res.end(JSON.stringify(Links.rejected))

		}else if(Options.accepted){
			res.end(JSON.stringify(Links.accepted))

		}else{
			res.end(JSON.stringify(Links))
		}

		}catch(err){
			res.end(JSON.stringify(err))
		}
	})





    /*
	@url : /campaign/totalEarned/:addr
	@description: fetching total earnings of the user in satt & USD
	@params:
    addr : wallet address of user
	{headers}
	@Output JSON object
	*/
	app.get('/campaign/totalEarned/:addr', async (req, res)=>{
		try{
			let token = req.headers["authorization"].split(" ")[1];
            await app.crm.auth(token);
			let address=req.params.addr
			let prices;
			let sattPrice$;
			let total= 0;


			const sattPrice ={
						url: app.config.xChangePricesUrl,
						method: 'GET',
						json: true
					  };

			prices = await rp(sattPrice);
	        sattPrice$ = prices.SATT.price;
           const subscriptions = await app.db.apply().find({ $and: [ { influencer : address }, { isAccepted : true}]}).toArray()
           subscriptions.forEach(elem=>{
				total = total + parseFloat(new Big(elem.totalGains).div(etherInWei).toFixed(4));
			})
			let totalEarned = Number((total * sattPrice$).toFixed(2));
			const result = {SattEarned : total, USDEarned : totalEarned, subscriptions : subscriptions.length};
			res.send(JSON.stringify(result)).status(200);
		}catch(err){
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})


	 /*
	@url : /campaign/totalSpent/:owner
	@description: fetching total spending of the user in USD
	@params:
    owner : wallet address of user
	{headers}
	@Output JSON object
	*/


	app.get('/campaign/totalSpent/:owner', async (req, res) => {
       try{
		let prices;
		const sattPrice ={
			url: app.config.xChangePricesUrl,
			method: 'GET',
			json: true
		  };

		  prices = await rp(sattPrice);
		 let sattPrice$ = prices.SATT.price;

	const address = req.params.owner;

	let[total,totalSpent, totalSpentInUSD,campaigns, rescampaigns,campaignsCrm,campaignsCrmbyId] = [0,0,0,[],[],[],[]];

	campaigns = await app.db.campaign().find({contract:{$ne : "central"},owner:address}).toArray();

	campaignsCrm = await app.db.campaignCrm().find().toArray();
	for (var i = 0;i<campaignsCrm.length;i++)
	{
		if(campaignsCrm[i].hash)
			campaignsCrmbyId[campaignsCrm[i].hash] = campaignsCrm[i];
	}
	for (var i = 0;i<campaigns.length;i++)
	{
		var ctr = await app.campaign.getCampaignContract(campaigns[i].id);
		if(!ctr.methods)
		{
			continue;
		}

		if(campaignsCrmbyId[campaigns[i].id])
		{
			campaigns[i].meta = campaignsCrmbyId[campaigns[i].id];
			if(campaigns[i].meta.token.name == "SATTBEP20") {
				campaigns[i].meta.token.name ="SATT";
			}
		}

		rescampaigns.push(campaigns[i]);
	}
	            var campaignscentral = await app.campaign.campaignsByOwner(address);

	            rescampaigns = rescampaigns.concat(campaignscentral);

	            rescampaigns.forEach(elem =>{
               if(elem.meta && elem.amount){
				total = total + (elem.meta.cost - parseFloat(new Big(elem.amount).div(etherInWei).toFixed(0)));
			   }


	})
	          totalSpentInUSD = Number((total * sattPrice$).toFixed(2));

	          totalSpent = Number((total).toFixed(2));

	           res.end(JSON.stringify({totalSpent,totalSpentInUSD })).status(200);

	   }catch(err){
		res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
	}

	})


  //extract campaign/id/:id
	app.get('/campaign/topInfluencers/:idCampaign', async(req, res)=>{
		try{
		let idCampaign = req.params.idCampaign;
		let result = {}
		let ctr = await app.campaign.getCampaignContract(idCampaign);
		if(!ctr.methods) {
			res.end("{}");
			return;
		}else{
        result = await app.campaign.campaignProms(idCampaign,result,ctr)
		res.send(JSON.stringify({result}));
		}
		}catch(err){
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
	})
	return app;
}
