const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const txSchema = mongoose.Schema({
    type: { type: String },
    from: { type: String },
    to: { type: String },
    value: { type: String },
    ethTxHash: { type: String },
    mintTxHash: { type: String },
    bscTxHash: { type: String },
    date: { type: Number },
})

const Tx = mongoose.model('txs', txSchema)
