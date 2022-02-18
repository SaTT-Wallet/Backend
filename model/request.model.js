const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

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
        supressReservedKeysWarning: true,

        // collection: 'request',
    }
)

const Request = db.model('request', requestSchema)
module.exports = Request
