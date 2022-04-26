const mongoose = require('mongoose')

const tikTokProfileSchema = mongoose.Schema(
    {
        accessToken: { type: String },
        userId: { type: Number, required: true, ref: 'user' },
        linkedinId: { type: String },
        pages: [
            {
                'organization~': {
                    localizedName: { type: String },
                },
                role: { type: String },
                organization: { type: String },
                roleAssignee: { type: String },
                state: { type: String },
                subscribers: { type: Number },
                photo: { type: String },
            },
        ],
    },

    {
        collection: 'tikTok_profile',
    }
)
const TikTokProfile = mongoose.model('tikTok_profile', tikTokProfileSchema)
module.exports = TikTokProfile
