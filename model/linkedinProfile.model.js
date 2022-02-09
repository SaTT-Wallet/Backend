const mongoose = require('mongoose')

const linkedinProfileSchema = mongoose.Schema({
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
})

const LinkedinProfile = mongoose.model(
    'linkedin_profile',
    linkedinProfileSchema
)
