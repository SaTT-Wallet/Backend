const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const passwalletSchema = mongoose.Schema(
    {
        UserId: { type: Number, required: true, ref: 'sn_users' },
        value: { type: String },
    },
    {
        collection: 'sn_user',
    }
)

const PassWallet = db.model('temp', passwalletSchema)
module.exports = PassWallet
