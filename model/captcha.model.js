const mongoose = require('mongoose')

const captchaSchema = mongoose.Schema(
    {
        originalImage: { type: String },
        puzzle: { type: String },
        position: { type: Number },
    },
    { collection: 'captcha' }
)
const Captcha = mongoose.model('captcha', captchaSchema)
module.exports = Captcha
