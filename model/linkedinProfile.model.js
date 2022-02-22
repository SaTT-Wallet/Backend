const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)

const linkedinProfileSchema = mongoose.Schema(
    {
        accessToken: { type: String },
        userId: { type: Number, required: true, ref: 'sn_user' },
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
