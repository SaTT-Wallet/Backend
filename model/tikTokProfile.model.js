const mongoose = require('mongoose')

const tikTokProfileSchema = mongoose.Schema(
    {
        accessToken: { type: String },
        refreshToken: { type: String },
        userId: { type: Number, required: true, ref: 'user' },
        userTiktokId: { type: String },
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
