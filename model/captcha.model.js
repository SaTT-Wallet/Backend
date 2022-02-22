const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const captchaSchema = mongoose.Schema(
    {
        originalImage: { type: String },
        puzzle: { type: String },
        position: { type: Number },
    },
    { collection: 'captcha' }
)
const Captcha = db.model('captcha', captchaSchema)
module.exports = Captcha
