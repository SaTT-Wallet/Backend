const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const fbPageSchema = mongoose.Schema(
    {
        UserId: { type: Number, required: true, ref: 'sn_users' },
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

const FbPage = db.model('fb_page', fbPageSchema)
module.exports = FbPage
