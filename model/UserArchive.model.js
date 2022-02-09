const mongoose = require('mongoose')

const userArchivedSchema = mongoose.Schema(
    {
        first_name: { type: String },
        name: { type: String },
        idOnSn2: { type: String },
        email: { type: String },
        username: { type: String },
        firstName: { type: String },
        lastName: { type: String },

        idSn: { type: Number },
        newsLetter: { type: Boolean },
        onBoarding: { type: Boolean },
        account_locked: { type: Boolean },
        failed_count: { type: Number },
        enabled: { type: Number },
        locale: { type: String },
        confirmation_token: { type: String },
        userSatt: { type: Boolean },
        picLink: { type: String },
        completed: { type: Boolean },
        password: { type: String },
        secureCode: {
            code: { type: Number },
            expiring: { type: Number },
            type: { type: String },
        },
        new: { type: Boolean },
        passphrase: { type: Boolean },
        photoUpdated: { type: Boolean },
        birthday: { type: String },
        gender: { type: String },

        daily: [
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
        visitPassphrase: { type: Boolean },

        fireBaseAccessToken: { type: String },

        phone: {
            number: { type: String },
            internationalNumber: { type: String },
            nationalNumber: { type: String },
            e164Number: { type: String },
            countryCode: { type: String },
            dialCode: { type: String },
        },

        daily: [
            {
                Date: { type: Number },
                Balance: { type: String },
                convertDate: { type: String },
            },
        ],

        idOnSn3: { type: String },
        isChanged: { type: Boolean },
    },
    { timestamps: true, strict: false }
)

const UserArchived = mongoose.model('sn_user_archived', userArchivedSchema)
