const mongoose = require('mongoose')
const interestsSchema = mongoose.Schema(
    {
        interests: [{ type: String }],
        userId: { type: Number },
    },
    { collection: 'interests' }
)

const Interests = mongoose.model('interests', interestsSchema)
module.exports = Interests
