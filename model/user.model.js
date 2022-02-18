const mongoose = require('mongoose')
autoIncrement = require('mongoose-auto-increment')
const db = mongoose.createConnection(process.env.MONGOURI)
autoIncrement.initialize(db)
const userSchema = mongoose.Schema(
    {
        first_name: { type: String },
        name: { type: String },
        idSn: { type: Number },
        idOnSn: { type: String },
        idOnSn2: { type: String },
        idOnSn3: { type: String },
        created: { type: Date, default: Date.now },
        email: { type: String },
        username: { type: String, required: true },
        firstName: { type: String },
        lastName: { type: String },
        lastLogin: { type: Date, default: Date.now },
        newsLetter: { type: Boolean },
        onBoarding: { type: Boolean },
        account_locked: { type: Boolean },
        failed_count: { type: Number },
        date_locked: { type: Number },
        enabled: { type: Number },
        locale: { type: String },
        userSatt: { type: Boolean },
        picLink: { type: String },
        dateFirstAttempt: { type: Number },
        completed: { type: Boolean },
        password: { type: String, required: true },
        secureCode: {
            code: { type: Number },
            expiring: { type: Number },
            type: { type: String },
        },
        hasWallet: { type: Boolean },
        passphrase: { type: Boolean, default: false },
        is2FA: { type: Boolean, default: false },
        secret: { type: String },
        photoUpdated: { type: Boolean, default: false },
        isChanged: { type: Boolean, default: false },
        birthday: { type: String },
        gender: { type: String },
        daily: [
            {
                Date: { type: Number },
                Balance: { type: String },
                convertDate: { type: String },
            },
        ],
        weekly: [
            {
                Date: { type: Number },
                Balance: { type: String },
                convertDate: { type: String },
            },
        ],
        monthly: [
            {
                Date: { type: Number },
                Balance: { type: String },
                convertDate: { type: String },
            },
        ],
        address: { type: String },
        city: { type: String },
        country: { type: String },
        zipCode: { type: String },
        visitPassphrase: { type: Boolean, default: false },
        fireBaseAccessToken: { type: String },
        phone: {
            number: { type: String },
            internationalNumber: { type: String },
            nationalNumber: { type: String },
            e164Number: { type: String },
            countryCode: { type: String },
            dialCode: { type: String },
        },
    },
    { timestamps: true, strict: false, collection: 'sn_user' }
)
userSchema.plugin(autoIncrement.plugin, {
    model: 'sn_user',
    field: '_id',
    startAt: 100,
    incrementBy: 1,
})
const User = db.model('sn_user', userSchema)
module.exports = User
