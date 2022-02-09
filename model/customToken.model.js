const mongoose = require('mongoose')

const customTokenSchema = mongoose.Schema({
    tokenAdress: { type: String },
    decimal: { type: Number },
    symbol: { type: String },
    network: { type: String },
    tokenName: { type: String },
    sn_users: [{ type: Number, required: true, ref: 'sn_users' }],
})

const CustomToken = mongoose.model('custom_token', customTokenSchema)
