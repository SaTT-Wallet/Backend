const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)

const interestsSchema = mongoose.Schema(
    {
        interests: [{ type: String }],
        userId: { type: Number },
    },
    { collection: 'interests' }
)

const Interests = db.model('interests', interestsSchema)
module.exports = Interests
