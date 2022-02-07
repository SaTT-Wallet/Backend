const mongoose = require('mongoose');

const campaignsSchema = mongoose.Schema({
    title: { type: String},
    description:{ type: String},
    resume: { type: String},
    brand:{ type: String},
    countries: [ {
      item_id: { type: Number},
       item_text: { type: String} 
      }
   ],
    token: {
      name: { type: String},
      type: { type: String},
      addr: { type: String}
   },
    tags: [
      {  type:  String}
   ],
    endDate:{ type: Number},
    startDate: { type: Number},
    remuneration:{ type: String},
    ratios: [
      {
        like: { type: String},
        view: { type: String},
        share:{ type: String},
        reachLimit: { type: String},
        oracle: { type: String},
     }
   ],
    bounties: [

      {
        oracle: { type: String},
        categorie: [
          {
            minFollowers: { type: Number},
            maxFollowers: { type: Number},
            reward:{ type: String},
         }
       ]
     }
     
   ],
    cost: { type: String},
    cost_usd: { type: String},
    idNode: { type: String},
    type:{ type: String},
    cover:{ type: String},
    logo: { type: String},
    contract:{ type: String},
    coverSrc:{ type: String},
    dataUrl: { type: String},
    funds: [
      { type: String},
      { type: String},
   ],
    hash:{ type: String},
    transactionHash: { type: String},
    walletId: { type: String},
 },{timestamps:true}
 )

const Campaigns = mongoose.model("campaigns", campaignsSchema);