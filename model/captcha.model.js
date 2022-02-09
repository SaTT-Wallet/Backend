const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)
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
