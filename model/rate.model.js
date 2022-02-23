const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const rateSchema = mongoose.Schema({
    price: { type: Number },
    symbol: { type: String },
    date: { type: Number },
})

const Rate = mongoose.model('rate', rateSchema)
