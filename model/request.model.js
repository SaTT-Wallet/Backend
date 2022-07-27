const mongoose = require('mongoose')

const requestSchema = mongoose.Schema(
    {
        id: { type: String },
        typeSN: { type: Number },
        idUser: { type: String },
        idPost: { type: String },
        new: { type: Boolean, default: true },
        date: { type: Number },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        views: { type: Number, default: 0 },
    },
    {
        collection: 'request',
    }
)

const Request = mongoose.model('request', requestSchema)
module.exports = Request
