const mongoose = require('mongoose')

const passwalletSchema = mongoose.Schema({
    UserId: { type: Number, required: true, ref: 'sn_users' },
    value: { type: String },
})

const PassWallet = mongoose.model('temp', passwalletSchema)
