const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)
const walletSchema = mongoose.Schema(
    {
        UserId: { type: Number },
        keystore: {
            version: { type: Number },
            id: { type: String },
            address: { type: String },
            crypto: {
                ciphertext: { type: String },
                cipherparams: {
                    iv: { type: String },
                },
                cipher: { type: String },
                kdf: { type: String },
                kdfparams: {
                    dklen: { type: Number },
                    salt: { type: String },
                    n: { type: Number },
                    r: { type: Number },
                    p: { type: Number },
                },
                mac: { type: String },
            },
        },
        num: { type: Number },
        btc: {
            publicKey: { type: String },
            addressSegWitCompat: { type: String },
            addressSegWit: { type: String },
            publicKeySegWit: { type: String },
            ek: { type: String },
        },
        mnemo: { type: String },
    },
    {
        collection: 'wallet',
    }
)

const Wallet = db.model('wallet', walletSchema)

module.exports = Wallet
