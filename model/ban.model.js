const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

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

const Ban = db.model('oracleban', banSchema)
module.exports = Ban
