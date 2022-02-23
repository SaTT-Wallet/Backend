const mongoose = require('mongoose')
const { mongoConnection } = require('../conf/config1')

const db = mongoose.createConnection(mongoConnection().mongoURI)
const igMediaSchema = mongoose.Schema({
    shortcode: { type: String },
    like_count: { type: Number },
    owner: {
        id: { type: String },
    },
    id: { type: String },
})

const IgMedia = mongoose.model('ig_media', igMediaSchema)
