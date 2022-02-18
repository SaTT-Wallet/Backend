const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)
const campaignLinkSchema = mongoose.Schema(
    {
        id_prom: { type: String },
        typeSN: { type: Number },
        idUser: { type: String },
        status: { type: Boolean },
        type: { type: String },
        id_wallet: { type: String },
        idPost: { type: String },
        id_campaign: { type: String },
        isPayed: { type: Boolean },
        appliedDate: { type: Number },
        oracle: { type: String },
        abosNumber: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        totalToEarn: { type: String },
        payedAmount: { type: String },
    },
    {
        collection: 'campaign_link',
    }
)

const CampaignLink = db.model('campaign_link', campaignLinkSchema)
module.exports = CampaignLink
