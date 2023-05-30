const mongoose = require('mongoose');
const { mongoConnection } = require('./config')
exports.connect = () => {
    mongoose.connect(
        mongoConnection().mongoURI,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        }
    ).then(() => {
        console.log(mongoConnection().mongoURI)

        console.log(mongoConnection().mongoBase)
        console.log('******connection establed to MongoServer*******')
    }).catch((err) => {
        console.log('Failed to connect to MongoDB', err)
    })
}