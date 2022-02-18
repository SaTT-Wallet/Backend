const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const linkedinProfileSchema = mongoose.Schema(
    {
        accessToken: { type: String },
        UserId: { type: Number, required: true, ref: 'sn_users' },
        linkedinId: { type: String },
        pages: [
            {
                organization: {
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
        collection: 'linkedin_profile',
    }
)

const LinkedinProfile = db.model('linkedin_profile', linkedinProfileSchema)
module.exports = LinkedinProfile
