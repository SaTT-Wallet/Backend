const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

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
    {
        collection: 'event',
    }
)

const Event = db.model('event', eventSchema)
module.exports = Event
