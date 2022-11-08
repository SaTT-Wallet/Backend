const mongoose = require('mongoose')

const campaignLinkSchema = mongoose.Schema(
    {
        id_prom: { type: String },
        typeSN: { type: Number },
        idUser: { type: String },
        status: { type: mongoose.Schema.Types.Mixed, default :false },
        type: { type: String,default :'waiting_for_validation' },
        id_wallet: { type: String },
        idPost: { type: String },
        id_campaign: { type: String },
        isPayed: { type: Boolean,default: false },
        typeURL: { type: String },
        appliedDate: { type: Number },
        acceptedDate: { type: Number },
        oracle: { type: String },
        abosNumber: { type: Number, default: 0 },
        instagramUserName: { type: String },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
        totalToEarn: { type: String },
        payedAmount: { type: String },
        media_url: { type: String },
        reason: { type: [] },
    },
    {
        collection: 'campaign_link',
    }
)

const CampaignLink = mongoose.model('campaign_link', campaignLinkSchema)
module.exports = CampaignLink
