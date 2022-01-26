const mongoose = require('mongoose');

const captchaSchema = mongoose.Schema({
    originalImage: {type:String},
    puzzle: {type:String},
   position: {type:Number},
})

const Captcha = mongoose.model("captcha", captchaSchema);