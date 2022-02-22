const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const applySchema = mongoose.Schema({
    id: { type: String },
    typeSN: { type: Number },
    idUser: { type: String },
    idPost: { type: String },
    date: { type: Number },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    isAccepted: { type: Boolean },
    idCampaign: { type: String },
    influencer: { type: String },
    totalGains: { type: Number },
    paidGains: { type: Number },
})

const Apply = mongoose.model('apply', applySchema)
