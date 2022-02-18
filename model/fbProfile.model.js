const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const fbProfileSchema = mongoose.Schema(
    {
        id: { type: String },
        username: { type: String },
        displayName: { type: String },
        name: {
            familyName: { type: String },
            givenName: { type: String },
            middleName: { type: String },
        },
        gender: { type: String },
        profileUrl: { type: String },
        photos: [
            {
                value: { type: String },
            },
        ],
        provider: { type: String },
        _raw: { type: String },
        _json: {
            id: { type: String },
            name: { type: String },
            picture: {
                data: {
                    height: { type: Number },
                    is_silhouette: { type: Boolean },
                    url: { type: String },
                    width: { type: Number },
                },
            },
            token_for_business: { type: String },
        },
        accessToken: { type: String },
        UserId: { type: Number, required: true, ref: 'sn_users' },
    },
    {
        collection: 'fb_profile',
    }
)

const FbProfile = db.model('fb_profile', fbProfileSchema)
module.exports = FbProfile
