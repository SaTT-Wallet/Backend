const mongoose = require('mongoose')

const tikTokProfileSchema = mongoose.Schema(
    {
        accessToken: { type: String },
        userId: { type: Number, required: true, ref: 'user' },
        username: { type: String },
        displayName: { type: String },
        profileImage: { type: String },
    },

    {
        collection: 'tikTok_profile',
    }
)
const TikTokProfile = mongoose.model('tikTok_profile', tikTokProfileSchema)
module.exports = TikTokProfile
