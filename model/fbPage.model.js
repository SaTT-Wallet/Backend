const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)

const fbPageSchema = mongoose.Schema(
    {
        UserId: { type: Number, required: true, ref: 'sn_user' },
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
