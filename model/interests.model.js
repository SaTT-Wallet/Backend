const mongoose = require('mongoose')
const db = mongoose.createConnection(process.env.MONGOURI)

const interestsSchema = mongoose.Schema(
    {
        interests: [{ type: String }],
        userId: { type: Number },
    },
    { collection: 'interests' }
)

const Interests = db.model('interests', interestsSchema)
module.exports = Interests
