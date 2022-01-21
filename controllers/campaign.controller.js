
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
const mongoURI = process.env.MONGOURI;

var connection;
let app
(connection = async  ()=> {
    app = await requirement.connection();
   
})();




const storage = new GridFsStorage({
    url: mongoURI,
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
    url: mongoURI,
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
    url: mongoURI,
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


//     // here I used multer to upload files
//       // you can add your validation here, such as file size, file extension and etc.
module.exports.uploadImage = multer({ storage : storageImage,inMemory: true}).single('file');
module.exports.upload = multer({ storage }).array('file');
module.exports.uploadCampaignLogo = multer({ storage : storageCampaignLogo,inMemory: true}).single('file');


      var BN = require("bn.js");

	/*var campaignKeystore = fs.readFileSync(app.config.campaignWalletPath,'utf8');
	app.campaignWallet = JSON.parse(campaignKeystore);*/
	  const conn=mongoose.createConnection(mongoURI);
	  let gfs;
	  let gfsKit;
	  let gfsLogo;


      module.exports.launchCampaign = async(req,res)=>{
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
            let access_T=await app.crm.checkToken(req,res);
			var auth =	await app.crm.auth(access_T);
			var cred = await app.account.unlock(auth.id,pass);

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

      module.exports.launchBounty  = async(req,res)=> {
        var pass = req.body.pass;
        var dataUrl = req.body.dataUrl;
        var startDate = req.body.startDate;
        var endDate = req.body.endDate;
        var ERC20token = req.body.ERC20token;
        var amount = req.body.amount;
        let [id,contract] = [req.body.idCampaign,req.body.contract.toLowerCase()];
        var bounties = req.body.bounties;
        let access_T=await app.crm.checkToken(req,res);
        var auth =	await app.crm.auth(access_T);
        try {

            var cred = await app.account.unlock(auth.id,pass);

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