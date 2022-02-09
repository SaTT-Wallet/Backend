const mongoose = require('mongoose')

const googleProfileSchema = mongoose.Schema({
    refreshToken: { type: String },
    accessToken: { type: String },
    UserId: { type: Number, required: true, ref: 'sn_users' },
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
})

const GoogleProfile = mongoose.model('google_profile', googleProfileSchema)
