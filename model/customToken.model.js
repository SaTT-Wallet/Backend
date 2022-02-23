const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)

const customTokenSchema = mongoose.Schema(
    {
        tokenAdress: { type: String },
        decimal: { type: Number },
        symbol: { type: String },
        network: { type: String },
        tokenName: { type: String },
        sn_users: [{ type: Number, required: true, ref: 'sn_user' }],
    },
    {
        collection: 'custom_token',
    }
)

const CustomToken = db.model('custom_token', customTokenSchema)

module.exports = CustomToken
