
var requirement= require('../helpers/utils')
var ObjectId = require('mongodb').ObjectId;
var fs = require('fs');
const multer = require('multer');
const Big = require('big.js');
var rp = require('request-promise');
const etherInWei = new Big(1000000000000000000);
const handlebars = require('handlebars');
const Grid = require('gridfs-stream');
const GridFsStorage = require('multer-gridfs-storage');
var mongoose = require('mongoose');

var connection;
let app
(connection = async  ()=> {
    app = await requirement.connection();
   
})();
const storage = new GridFsStorage({
    url: process.env.MONGOURI,
    options: { useNewUrlParser: true,useUnifiedTopology: true },
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const filename = uuidv4();
          const fileInfo = {
            filename: filename,
            bucketName: 'campaign_kit'
          };
          resolve(fileInfo);
      });
    }
  });


  const storageImage = new GridFsStorage({
    url:  process.env.MONGOURI,
    options: { useNewUrlParser: true ,useUnifiedTopology: true},
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const filename = uuidv4();
          const fileInfo = {
            filename: filename,
            bucketName: 'campaign_cover'
          };
          resolve(fileInfo);

      });
    }
  });

  const storageCampaignLogo = new GridFsStorage({
    url:  process.env.MONGOURI,
    options: { useNewUrlParser: true ,useUnifiedTopology: true},
    file: (req, file) => {
      return new Promise((resolve, reject) => {
          const filename = uuidv4();
          const fileInfo = {
            filename: filename,
            bucketName: 'campaign_logo'
          };
          resolve(fileInfo);

      });
    }
  });


module.exports.uploadImage = multer({ storage : storageImage,inMemory: true}).single('file');
module.exports.upload = multer({ storage }).array('file');
module.exports.uploadCampaignLogo = multer({ storage : storageCampaignLogo,inMemory: true}).single('file');


      var BN = require("bn.js");
	  const conn=mongoose.createConnection( process.env.MONGOURI);
	  let gfs;
	  let gfsKit;
	  let gfsLogo;



      conn.once('open', () => {
        gfs = Grid(conn.db, mongoose.mongo);
        gfsLogo = Grid(conn.db, mongoose.mongo);
        gfsKit = Grid(conn.db, mongoose.mongo);
        gfs.collection('campaign_cover');
        gfsLogo.collection('campaign_logo');
        gfsKit.collection('campaign_kit');
      });
    
    

      module.exports.launchCampaign = async(req,response)=>{
        var pass = req.body.pass;
		var dataUrl = req.body.dataUrl;
		var startDate = req.body.startDate;
		var endDate = req.body.endDate;
		var ERC20token = req.body.ERC20token;
		var amount = req.body.amount;
		var ratios = req.body.ratios;
		var contract=req.body.contract;
		let id =req.body.idCampaign

		try {
			var cred = await app.account.unlock(req.user._id,pass);

			if(app.config.testnet && token == app.config.ctrs.token.address.mainnet) {
				ERC20token = app.config.ctrs.token.address.testnet;
			}
			var ret = await app.campaign.createCampaignAll(dataUrl,startDate,endDate,ratios,ERC20token,amount,cred);

			response.end(JSON.stringify(ret));

		} catch (err) {
			app.account.sysLogError(err)
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
		cred && app.account.lock(cred.address);
		if(ret && ret.hash){
			var campaign = {
				hash : ret.hash,
				transactionHash:ret.transactionHash,
				startDate,
				endDate,
				coverSrc:null,
				dataUrl,
				funds :[contract,amount],
				contract:contract.toLowerCase(),
				walletId:cred.address,
				type:'inProgress'
			};
			await app.db.campaigns().updateOne({_id : app.ObjectId(id)},{$set:campaign},{$unset:{bounties:"",coverSrc: ""}});
		}
		}
      }

      module.exports.launchBounty  = async(req,response)=> {
        var pass = req.body.pass;
        var dataUrl = req.body.dataUrl;
        var startDate = req.body.startDate;
        var endDate = req.body.endDate;
        var ERC20token = req.body.ERC20token;
        var amount = req.body.amount;
        let [id,contract] = [req.body.idCampaign,req.body.contract.toLowerCase()];
        var bounties = req.body.bounties;
        try {

            var cred = await app.account.unlock(req.user._id,pass);

            if(app.config.testnet && ERC20token == app.config.ctrs.token.address.mainnet) {
                ERC20token = app.config.ctrs.token.address.testnet;
            }

            var ret = await app.campaign.createCampaignBounties(dataUrl,startDate,endDate,bounties,ERC20token,amount,cred);
            response.end(JSON.stringify(ret));

        } catch (err) {
            app.account.sysLogError(err);
            response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
        }
        finally {
            cred && app.account.lock(cred.address);
            if(ret && ret.hash){
                let campaign = {
                    hash : ret.hash,
                    transactionHash:ret.transactionHash,
                    startDate,
                    endDate,						
                    dataUrl,
                    coverSrc:null,
                    funds :[contract,amount],
                    contract:contract,
                    type:'inProgress',
                    walletId:cred.address
                };
                await app.db.campaigns().updateOne({_id : app.ObjectId(id)},{$set:campaign}, {$unset: {coverSrc: "",ratios:""}});
            }
            
        }
      }


      exports.totalEarned=async(req, res)=>{
        try{
			let address=req.params.addr
			let prices;
			let sattPrice$;
			let total= 0;

			prices =  app.account.getPrices();
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

      }

      exports.campaigns= async(req, response)=>{
        try{

			var strangerDraft=[];
             if(req.query.idWallet){

               
			var idNode="0"+req.user._id;		
			strangerDraft= await app.db.campaigns().distinct("_id", { idNode:{ $ne:"0"+req.user._id} , hash:{ $exists: false}});
			 }
			const limit=+req.query.limit || 10;
			const page=+req.query.page || 1;
			const skip=limit*(page-1);
			const id_wallet = req.query.idWallet;
			let query = app.campaign.sortOutPublic(req,idNode,strangerDraft);
			
			let tri= [['draft','apply','inProgress','finished'],"$type"];
	
			let campaigns=await app.db.campaigns().aggregate([{
				$match: 
					query
			},
			 {
				$addFields: {
					sortPriority: { $eq: [ "$idNode", idNode ]  } ,
					sort: {
						$indexOfArray: tri
					}
				}
			},{
				$sort: {
					sort: 1,
					sortPriority: -1,
					_id: 1
				}
			}	
		,{ $project: { countries: 0, description:0,resume:0, coverSrc:0 }}]).skip(skip).limit(limit).toArray();


		if(req.query.idWallet){
			for (var i = 0;i<campaigns.length;i++)
			{
				proms = await app.db.campaign_link().find({id_campaign:campaigns[i].hash,id_wallet}).toArray();
				if(proms.length) campaigns[i].proms =proms;
			}
		}

        
			response.send(JSON.stringify(campaigns[0]));
		}catch(err){
			response.send('{"error":"'+(err.message?err.message:err.error)+'"}');

		}
      }

      exports.campaign= async(req, response)=>{


        var idCampaign = req.params.id;


        
		
		var campaign = await app.db.campaigns().findOne({_id:app.ObjectId(idCampaign)});
		if(campaign && campaign.hash){
		
			campaign.remaining=campaign.funds[1];
		}	
		file =await gfs.files.findOne({'campaign.$id':campaign._id});
		if(file){
		const readstream = gfs.createReadStream(file);
		CampaignCover="";
		for await (const chunk of readstream) {
			CampaignCover=chunk.toString('base64');
		}
		campaign.CampaignCover=CampaignCover;
		}else{
			campaign.CampaignCover='';
		}

	let	logo =await gfsLogo.files.findOne({'campaign.$id':campaign._id});
		if(logo){
		const readstream = gfsLogo.createReadStream(logo);
		CampaignLogo="";
		for await (const chunk of readstream) {
			CampaignLogo=chunk.toString('base64');
		}
		campaign.CampaignLogo=CampaignLogo;
		}else{
			campaign.CampaignLogo='';
		}	
		response.end(JSON.stringify(campaign));


      }

      exports.campaignPromp= async(req, res)=>{
        try{	
	const campaign = await app.db.campaigns().findOne({_id : app.ObjectId(req.params.idCampaign)},{ 'fields': { 'logo': 0,resume:0,description:0,tags:0,cover:0}});
			let ctr = await app.campaign.getCampaignContract(campaign.hash)
	 if(!ctr) {
			 res.end("{}");
		 return;
	 }else{   
	  const funds = campaign.funds ? campaign.funds[1] : campaign.cost;	 
	 
	  const ratio = campaign.ratios;
	  const bounties = campaign.bounties;
	 let allLinks;
	 if(req.query.influencer)  allLinks =await app.db.campaign_link().find({ $and:[{id_campaign : campaign.hash, id_wallet: req.query.influencer}] }).toArray();
	 if(!req.query.influencer)  allLinks =await app.db.campaign_link().find({ id_campaign : campaign.hash }).toArray();
      const allProms = await app.campaign.influencersLinks(allLinks)
 
		 for(let i = 0; i < allProms.length; i++){ 	
			allProms[i].isAccepted = allProms[i].status	
			allProms[i].influencer = allProms[i].id_wallet             
		    if(allProms[i].status == "rejected") continue;
		
		   allProms[i].id = allProms[i].id_prom;		   
		   allProms[i].numberOfLikes = allProms[i].likes || "0"
		   allProms[i].numberOfViews = allProms[i].views || '0'
		   allProms[i].numberOfShares = !allProms[i].shares ? '0' : String(allProms[i].shares);
		   allProms[i].payedAmount = allProms[i].payedAmount || "0";
           allProms[i].abosNumber =  allProms[i].abosNumber || 0;	   
		   let result = allProms[i]
			
		   let promDone = funds == "0" && result.fund =="0" ? true : false;
		   if(ratio.length && allProms[i].isAccepted && !promDone){
			    delete allProms[i].isPayed;
                let reachLimit =  app.campaign.getReachLimit(ratio,result.oracle); 
				if(reachLimit) result=  app.oracleManager.limitStats("",result,"",result.abosNumber,reachLimit);           
				ratio.forEach( num =>{
					
							if((num.oracle === result.oracle) || (num.typeSN === result.typeSN)){
						    let	view =result.views ?new Big(num["view"]).times(result.views):"0";	
							let	like = result.likes ? new Big(num["like"]).times(result.likes) : "0";
					    	let	share = result.shares ? new Big(num["share"]).times(result.shares.toString()) : "0";	 
							let totalToEarn = new Big(view).plus(new Big(like)).plus(new Big(share)).toFixed();
							allProms[i].totalToEarn = new Big(totalToEarn).gt(new Big(result.payedAmount)) ? totalToEarn : result.payedAmount;


							}
						})	
	
		   }

		   if(bounties.length && allProms[i].isAccepted && !promDone){		  
			  
		       bounties.forEach( bounty=>{
               if((bounty.oracle === allProms[i].oracle) || (bounty.oracle == app.oracle.findBountyOracle(result.typeSN))){
				bounty.categories.forEach( category=>{
				 if( (+category.minFollowers <= +result.abosNumber)  && (+result.abosNumber <= +category.maxFollowers) ){
					let totalToEarn =  category.reward
					allProms[i].totalToEarn = new Big(totalToEarn).gt(new Big(result.payedAmount)) ? totalToEarn : result.payedAmount;
				}else if(+result.abosNumber > +category.maxFollowers){
					let totalToEarn =  category.reward
					allProms[i].totalToEarn = new Big(totalToEarn).gt(new Big(result.payedAmount)) ? totalToEarn : result.payedAmount;	
		  }



				})	
			     }	
		   
		         })

			 }

	}	
	 res.send(JSON.stringify({allProms}))
 } 
 }catch (err) {
	app.account.sysLogError(err)
	 res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
  }


      }



      exports.pendingLink= async(req, res)=>{
        let links=[];
        let pendingLinks=[];
        let campaigns=await app.db.campaigns().find({ hash: { $exists: true}, type:"apply" },{projection: { hash: true,_id:false }}).toArray();
        for(let i=0;i<campaigns.length;i++){
            links.push(...await app.db.campaign_link().find({id_campaign:campaigns[i].hash,type:"harvest"},{projection: { id_wallet: true,_id:false }}).toArray());		
        }

        for(let i=0;i<links.length;i++){
         let userId = await app.db.wallet().findOne({"keystore.address" : links[i].id_wallet.substring(2)},{projection: { UserId: true,_id:false }});
          let userEmail = await app.db.sn_user().findOne({_id:userId.UserId},{projection: { email: true,_id:false }});
          links[i].email = userEmail.email
          pendingLinks.push(links[i])
        }
      res.status(202).json(pendingLinks)
      }


      exports.totalSpent= async(req, res)=>{


        try{

            const sattPrice ={
                url: app.config.xChangePricesUrl,
                method: 'GET',
                json: true
              };
   
             let total = "0";
             let prices = await rp(sattPrice);
             let sattPrice$ = prices.SATT.price;
   
             let userCampaigns = await app.db.campaignCrm().find({idNode:"0"+req.user._id,hash:{ $exists: true}}).toArray();
              userCampaigns.forEach(async campaign =>{
                let result = await app.campaign.campaignStats(campaign.hash);
                total = new Big(total).plus(new Big(result.spent));
              })
   
                let  totalSpentInUSD = sattPrice$ *parseFloat(new Big(total).div(etherInWei).toFixed(0))
                let  totalSpent = new Big(total).toFixed();
   
                   res.end(JSON.stringify({totalSpent,totalSpentInUSD })).status(200);
   
           }catch(err){
            res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
        }


      }
    
      exports.apply= async(req,response)=>{
   	
		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var typeSN = req.body.typeSN;
		var idPost = req.body.idPost;
		var idUser = req.body.idUser;
		let title = req.body.title;
		let [prom, date,hash] = [{},Math.floor(Date.now()/1000),req.body.hash];
	
	
		let contract =await app.campaign.getCampaignContract(hash);


		var id = req.user._id
		try {		
			    let promExist = await app.db.campaign_link().findOne({id_campaign:hash, idPost});
				if(promExist) response.end(JSON.stringify({message:"Link already sent"}))				
			    var cred = await app.account.unlock(id,pass);
				if(typeSN == 5){
					var linkedinProfile = await app.db.linkedinProfile().findOne({userId:req.user._id},{projection: { accessToken: true,_id:false }});
					var linkedinInfo = await app.oracle.getLinkedinLinkInfo(linkedinProfile.accessToken,idPost.toString())
					var media_url=linkedinInfo.mediaUrl
					idUser = linkedinInfo.idUser;
                    idPost = linkedinInfo.idPost.replace(/\D/g,''); 
				}
				var ret = await app.campaign.applyCampaign(hash,typeSN,idPost,idUser,cred)

				response.end(JSON.stringify(ret));

		} catch (err) {
			response.end(JSON.stringify({"error":err.message?err.message:err.error}));
		}
		finally {		
			cred && app.account.lock(cred.address);
			if(ret && ret.transactionHash){	
				if(typeSN == 3)  prom.instagramUserName = await app.oracle.getInstagramUserName(idPost);
				await app.account.notificationManager(id, "apply_campaign",{cmp_name :title, cmp_hash : idCampaign,hash})
				prom.id_prom = ret.idProm;
				prom.typeSN = typeSN.toString();
				prom.idUser  = idUser 
				prom.status = false;
				if(media_url) prom.media_url=media_url
				if(prom.typeSN == 5){prom.typeURL = linkedinInfo.idPost.split(":")[2]};
				prom.type = 'waiting_for_validation';
				prom.id_wallet = cred.address.toLowerCase();
				prom.idPost = idPost;
				prom.id_campaign  = hash
				prom.isPayed=false;
				prom.appliedDate = date		
				prom.oracle = app.oracle.findBountyOracle(prom.typeSN);
				var insert = await app.db.campaign_link().insertOne(prom);
				prom.abosNumber = await app.oracleManager.answerAbos(prom.typeSN,prom.idPost,prom.idUser,linkedinProfile);
				let userWallet =  await app.db.wallet().findOne({"keystore.address":prom.id_wallet.toLowerCase().substring(2)},{projection: { UserId: true, _id:false }});
				let userId= prom.oracle === 'instagram' ? userWallet.UserId : null;
				let socialOracle =  await app.campaign.getPromApplyStats(prom.oracle,prom,userId,linkedinProfile);
				if(socialOracle.views ==='old') socialOracle.views ='0'
				prom.views= socialOracle.views
				prom.likes= socialOracle.likes,prom.shares= socialOracle.shares || '0';
			    await app.db.campaign_link().updateOne({_id : app.ObjectId(insert.ops[0]._id)},{$set:prom})
				let event={id:hash,prom:ret.idProm,type:"applied",date:date,txhash:ret.transactionHash,contract:contract._address.toLowerCase(),owner:contract._address.toLowerCase()};
				
				await app.db.event().insertOne(event);
			}
		}

      }


      exports.linkNotifications= async(req,res)=>{


		const lang = req.query.lang || "en";
		app.i18n.configureTranslation(lang);

        try {
		   let campaign_id=req.body.idCampaign
		   let link=req.body.link
		   let idProm = req.body.idProm
		 await  app.db.campaigns().findOne({_id:app.ObjectId(campaign_id)},{ 'fields': { 'logo': 0,resume:0,description:0,tags:0,cover:0}},async  (err, element)=> {
		  let owner= Number(element.idNode.substring(1))               
		  await app.account.notificationManager(owner, "cmp_candidate_insert_link",{cmp_name :element.title, cmp_hash:campaign_id, linkHash : idProm});


		  await	app.db.sn_user().findOne({_id:owner},  (err, result) =>{
			app.readHTMLFile(__dirname + '/../express/emailtemplate/Email_Template_link_added.html' ,async(err, html) => {
				if (err) {
				  console.error(err)
				  return
				}
				
			let template = handlebars.compile(html);

			let emailContent = {
			cmp_name : element.title,
			cmp_link : link,
		    cmp_imgUrl: app.config.baseEmailImgURl,
			cmp_satt_faq: app.config.Satt_faq
			};
				let htmlToSend = template(emailContent);

				var mailOptions = {
					from: app.config.mailSender,
					to: result.email,
					subject: 'New link was added To your campaign',
					html: htmlToSend
			   };
	

		 await app.transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					res.end(JSON.stringify(error))
				} else {
					res.end(JSON.stringify({message : "succes"}))
				}
			  });
			})
		  });
			})

        } catch (err) {
			res.end('{"error"console.log(link,campaign_id):"'+(err.message?err.message:err.error)+'"}');
        }


      }


	  exports.validateCampaign= async( req, res)=>{


		let idCampaign = req.body.idCampaign;
        let linkProm = req.body.link	 
		try {


		let pass = req.body.pass;
		let idApply = req.body.idProm;
			const lang = /*req.query.lang ||*/ "en";
			app.i18n.configureTranslation(lang);

			var cred = await app.account.unlock(req.user._id,pass);
			var ret = await app.campaign.validateProm(idApply,cred);
               

			res.end(JSON.stringify(ret));

		} catch (err) {
			res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
		if(cred) {		
			app.account.lock(cred.address);}
				if(ret && ret.transactionHash){

						const campaign = await app.db.campaigns().findOne({_id: app.ObjectId(idCampaign)},{ 'fields': { 'logo': 0,resume:0,description:0,tags:0,cover:0}});
						const id = req.body.idUser;
						const email = req.body.email;			
						let link = await app.db.campaign_link().findOne({id_prom:idApply});
						let userWallet =  await app.db.wallet().findOne({"keystore.address":link.id_wallet.toLowerCase().substring(2)},{projection: { UserId: true, _id:false }});
						let linkedinProfile = link.oracle == "linkedin" && await app.db.linkedinProfile().findOne({userId:userWallet.UserId});
						let userId= link.oracle === 'instagram' ? userWallet.UserId : null;
						let socialOracle = await app.campaign.getPromApplyStats(link.oracle,link,userId,linkedinProfile);
						socialOracle.abosNumber =  campaign.bounties.length || (campaign.ratios && app.campaign.getReachLimit(campaign.ratios,link.oracle))?await app.oracleManager.answerAbos(link.typeSN,link.idPost,link.idUser,linkedinProfile):0;
						socialOracle.status = true,link.status= true;
						if(socialOracle.views ==='old') socialOracle.views = link.views ||'0';
						link.likes = socialOracle.likes;
						link.views=socialOracle.views;
						link.shares = socialOracle.shares;	
						link.campaign=campaign;
						link.totalToEarn = campaign.ratios.length ?  app.campaign.getTotalToEarn(link,campaign.ratios): app.campaign.getReward(link,campaign.bounties);
						socialOracle.totalToEarn = link.totalToEarn;
						socialOracle.type= app.campaign.getButtonStatus(link);
						await app.db.campaign_link().updateOne({id_prom:idApply},{$set:socialOracle});
					
	
					await app.account.notificationManager(id, "cmp_candidate_accept_link",{cmp_name:campaign.title, action : "link_accepted", cmp_link : linkProm, cmp_hash : idCampaign, hash:ret.transactionHash,promHash:idApply})
					
					readHTMLFile(__dirname + '/../express/emailtemplate/email_validated_link.html' ,(err, html) => {
						if (err) {
							console.error(err)
							return
						  }
						  let template = handlebars.compile(html);
	
							let emailContent = {
							cmp_link : app.config.basedURl + '/myWallet/campaign/' + idCampaign,
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
	
						  transporter.sendMail(mailOptions);
							})
				 }
			
			
		}

	  }

	  module.exports.linkStats = async (req,res)=>{
		try{
			let totalToEarn;
			const idProm = req.params.idProm;
			const info =  await app.db.campaign_link().findOne({ id_prom : idProm });
			const payedAmount = info.payedAmount || "0";
			const campaign = await app.db.campaigns().findOne({hash : info.id_campaign},{ 'fields': { 'logo': 0,resume:0,description:0,tags:0,cover:0}});
			const ratio = campaign.ratios;
			const bounties =campaign.bounties
			let abosNumber =  info.abosNumber || 0;
			info.currency = campaign.token.name
			if(ratio.length){
			 let socialStats = {likes: info.likes, shares:info.shares,views:info.views}
			 let reachLimit =  app.campaign.getReachLimit(ratio,info.oracle); 
			 if(reachLimit) socialStats=  app.oracleManager.limitStats("",socialStats,"",abosNumber,reachLimit); 
			ratio.forEach(elem =>{
				if(elem.oracle === info.oracle){
				let view =new Big(elem["view"]).times(socialStats.views || "0")
				let like =  new Big(elem["like"]).times(socialStats.likes || '0')
				let share = new Big(elem["share"]).times(socialStats.shares || '0')
				totalToEarn = view.plus(like).plus(share).toFixed()
				}
			})
			info.totalToEarn = new Big(totalToEarn).gte(new Big(payedAmount)) ?new Big(totalToEarn).minus(new Big(payedAmount)) : totalToEarn ;   
		 }
		   if(bounties.length){
			 bounties.forEach( bounty=>{
				 if(bounty.oracle === info.oracle){
				   bounty.categories.forEach( category=>{
					if( (+category.minFollowers <= +abosNumber)  && (+abosNumber <= +category.maxFollowers) ){
					   info.totalToEarn = category.reward;					
					 }else if(+abosNumber > +category.maxFollowers){
					 info.totalToEarn = category.reward;	
				  }
				   })	
					}			   
					})
		   }
		   if(new Big(info.totalToEarn).gt(new Big(campaign.funds[1]))) info.totalToEarn = campaign.funds[1];
			res.json({prom : info})
		 }catch (err) {
			 res.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		  }
	  }


	  module.exports.increaseBudget= async(req, response) => {
		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		var token = req.body.ERC20token;
		var amount = req.body.amount;
		try {
			var cred = await app.account.unlock(req.user._id,pass);
			var ret = await app.campaign.fundCampaign(idCampaign,token,amount,cred);
		
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
		cred && app.account.lock(cred.address);
		if(ret.transactionHash){
			const ctr = await app.campaign.getCampaignContract(idCampaign);
			let fundsInfo = await ctr.methods.campaigns(idCampaign).call();

			 await app.db.campaigns().findOne({hash : idCampaign},async (err, result)=>{
				 let budget = new Big(result.cost).plus(new Big(amount)).toFixed();
                 await app.db.campaigns().updateOne({hash:idCampaign}, {$set: {cost: budget, funds : fundsInfo.funds}});
			 })
			}
		}
	  }

      module.exports.getLinks = async (req, res) => {
		   const {id_wallet}=req.params;
		   const limit=+req.query.limit || 50;
		   const page=+req.query.page || 1;
		   const skip=limit*(page-1);
		   let arrayOfLinks=[];
		   let allProms=[];
		   let query= app.campaign.filterLinks(req,id_wallet);
		var count=await app.db.campaign_link().find({id_wallet},{type : { $exists: true }}).count();
		
		let tri= (req.query.state==='owner') ? [['waiting_for_validation','harvest','already_recovered','not_enough_budget','no_gains','indisponible','rejected','none'], "$type"] :
		 [['harvest','already_recovered','waiting_for_validation','not_enough_budget','no_gains','indisponible','rejected','none'],"$type"]
		let userLinks=await app.db.campaign_link().aggregate([{
			$match: 
				query
		}, {
			$addFields: {
				sort: {
					$indexOfArray: tri
				}
			}
		},{
			$sort: {
				sort: 1,
				appliedDate: -1,
				_id: 1
			}
		}]).skip(skip).limit(limit).toArray();
		for (var i = 0;i<userLinks.length;i++){
			var result=userLinks[i];
			let campaign=await app.db.campaigns().findOne({hash:result.id_campaign},{ 'fields': { 'logo': 0,resume:0,description:0,tags:0,cover:0}});
		
			if(campaign){		
				let cmp={};
				const funds = campaign.funds ? campaign.funds[1] : campaign.cost;
				cmp._id = campaign._id, cmp.currency= campaign.token.name, cmp.title=campaign.title,cmp.remaining=funds,cmp.ratio=campaign.ratios,cmp.bounties=campaign.bounties;		
				result.campaign=cmp;
				arrayOfLinks.push(result)
			}
		}
			 allProms = req.query.campaign && req.query.state ? await app.campaign.influencersLinks(arrayOfLinks) : arrayOfLinks;

		var Links ={Links:allProms,count}
		res.json(Links);
	  }

      module.exports.getFunds = async (req, res)=>{
		var pass = req.body.pass;
		var idCampaign = req.body.idCampaign;
		try {
			var cred = await app.account.unlock(req.user._id,pass);
			var ret = await app.campaign.getRemainingFunds(idCampaign,cred);
			response.end(JSON.stringify(ret));
		} catch (err) {
			response.end('{"error":"'+(err.message?err.message:err.error)+'"}');
		}
		finally {
		    cred && app.account.lock(cred.address);
			if(ret && ret.transactionHash){
				await app.db.campaigns().updateOne({hash:idCampaign},{$set:{
					funds:["","0"]}});
			}
		}
	  }