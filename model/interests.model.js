const mongoose = require('mongoose')

const interestsSchema = mongoose.Schema({
    interests: [{ type: String }],
})

const Interests = mongoose.model('interests', interestsSchema)
