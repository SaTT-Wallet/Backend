const mongoose = require('mongoose')

const campaignLinkSchema = mongoose.Schema(
    {
        id_prom: { type: String },
        typeSN: { type: Number },
        idUser: { type: String },
        status: { type: mongoose.Schema.Types.Mixed },
        type: { type: String },
        id_wallet: { type: String },
        idPost: { type: String },
        id_campaign: { type: String },
        isPayed: { type: Boolean },
        typeURL: { type: String },
        appliedDate: { type: Number },
        oracle: { type: String },
        abosNumber: { type: Number, default: 0 },
        instagramUserName: { type: String },
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

const CampaignLink = mongoose.model('campaign_link', campaignLinkSchema)
module.exports = CampaignLink
