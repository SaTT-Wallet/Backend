const mongoose = require('mongoose')
const { db } = require('../app')

const banSchema = mongoose.Schema(
    {
        id: { type: String },
        idCampaign: { type: String },
        idProm: { type: String },
        date: { type: Number },
        admin: { type: Boolean },
    },
    {
        collection: 'oracleban',
    }
)

const Ban = mongoose.model('oracleban', banSchema)
module.exports = Ban
