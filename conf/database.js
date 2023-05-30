const mongoose = require('mongoose');
const { mongoConnection } = require('./config')
require('dotenv').config()
exports.connect = () => {
    mongoose.connect(
        mongoConnection(),
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        }
    ).then(() => {
        if(process.env.NODE_ENV != "mainnet") console.log('******connection establed to MongoServer*******')
    }).catch((err) => {
        if(process.env.NODE_ENV != "mainnet") console.log('Failed to connect to MongoDB', err)
    })
}