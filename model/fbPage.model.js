const mongoose = require('mongoose')

const fbPageSchema = mongoose.Schema(
    {
        UserId: { type: Number, required: true, ref: 'user' },
        id: { type: String },
        instagram_id: { type: String },
        instagram_username: { type: String },
        name: { type: String },
        picture: { type: String },
        subscribers: { type: Number },
        token: { type: String },
        username: { type: String },
    },
    { collection: 'fb_page' }
)

const FbPage = mongoose.model('fb_page', fbPageSchema)
module.exports = FbPage
