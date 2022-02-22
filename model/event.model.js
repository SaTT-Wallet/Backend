const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)

const eventSchema = mongoose.Schema(
    {
        id: { type: String },
        prom: { type: String },
        type: { type: String },
        date: { type: Number },
        txhash: { type: String },
        contract: { type: String },
        owner: { type: String },
    },
    { timestamps: true, strict: false, collection: 'event' }
)

const Event = db.model('event', eventSchema)
module.exports = Event
