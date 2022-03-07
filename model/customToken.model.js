const mongoose = require('mongoose')

const customTokenSchema = mongoose.Schema(
    {
        tokenAdress: { type: String },
        decimal: { type: Number },
        symbol: { type: String },
        network: { type: String },
        picUrl: { type: String },
        tokenName: { type: String },
        sn_users: [{ type: Number, required: true, ref: 'sn_user' }],
    },
    {
        collection: 'custom_token',
    }
)

const CustomToken = mongoose.model('custom_token', customTokenSchema)

module.exports = CustomToken
