const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const requestSchema = mongoose.Schema(
    {
        id: { type: String },
        typeSN: { type: Number },
        idUser: { type: String },
        idPost: { type: String },
        new: { type: Boolean, default: false },
        date: { type: Number },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
    },
    {
        collection: 'request',
    }
)

const Request = db.model('request', requestSchema)
module.exports = Request
