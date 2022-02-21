const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const googleProfileSchema = mongoose.Schema(
    {
        refreshToken: { type: String },
        accessToken: { type: String },
        UserId: { type: Number, required: true, ref: 'sn_user' },
        google_id: { type: String },
        channelTitle: { type: String },
        channelImage: {
            default: {
                url: { type: String },
                width: { type: Number },
                height: { type: Number },
            },
            medium: {
                url: { type: String },
                width: { type: Number },
                height: { type: Number },
            },
            high: {
                url: { type: String },
                width: { type: Number },
                height: { type: Number },
            },
        },
        channelStatistics: {
            viewCount: { type: Number },
            subscriberCount: { type: Number },
            hiddenSubscriberCount: { type: Boolean },
            videoCount: { type: Number },
        },
        channelId: { type: String },
    },
    {
        collection: 'google_profile',
    }
)

const GoogleProfile = db.model('google_profile', googleProfileSchema)
module.exports = GoogleProfile
