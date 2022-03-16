const mongoose = require('mongoose')

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

const Event = mongoose.model('event', eventSchema)
module.exports = Event
