var fs = require('fs')
const mongoose = require('mongoose')
const mongoSanitize = require('express-mongo-sanitize');
var express = require('express')
let app = express()
const helmet = require('helmet')
app.use(helmet())
var cors = require('cors')
// var csrf = require('csurf')
require('dotenv').config({
    path: `.env.${process.env.NODE_ENV}`
  })

let logger = require('morgan')
let cookieParser = require('cookie-parser')
let path = require('path')
const {swaggerUi, swaggerSpec, cssOptions} = require('./conf/swaggerSetup');
const {errorHandler, handleEndpointNotFound} = require('./middleware/errorHandler.middleware');
// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit')
const package = require('./package.json')
app.use(
    require('body-parser').json({
        limit: '50mb',
    })
)
app.use(require('body-parser').urlencoded({ extended: true }))

app.use(express.json({ limit: '50mb', extended: true }))
app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)

app.use(
    mongoSanitize({
      allowDots: true,
      replaceWith: '_',
    }),
  );
const { mongoConnection } = require('./conf/config')

const loginroutes = require('./routes/login.routes')
const walletroutes = require('./routes/wallet.routes')
const profileroutes = require('./routes/profile.routes')
const campaignroutes = require('./routes/campaign.routes')

/// db.url is different depending on NODE_ENV

const connectDB = async () => {
    try {
        await mongoose.connect(mongoConnection(), {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        console.log(mongoConnection())

        console.log('******connection establed to MongoServer*******')
    } catch (err) {
        console.log('Failed to connect to MongoDB', err)
    }
}

connectDB()

app.disable('x-powered-by')

app.use(helmet.frameguard({ action: 'deny' }));

app.use(cors('*'))
app.use((req, res, next) => {
    if (process.env.NODE_ENV == "mainnet") {
        if (req.headers.origin) {
            if (
                req.headers.origin === 'https://dapp.satt.com' ||
                req.headers.origin === 'https://satt-token.com' ||
                req.headers.origin === 'https://app.ihave.io' ||
                req.headers.origin === 'http://backoffice.atayen.us'
            ) {
                return next()
            } else return res.redirect("https://satt-token.com");
            
                
        } else {
            if (
                req.url.includes('google') ||
                req.url.includes('facebook') ||
                req.url.includes('tiktok') ||
                req.url.includes('linkedin') ||
                req.url.includes('twitter') ||
                req.url.includes('telegram')
            ) {
                return next()
            } else return res.redirect("https://satt-token.com");
            
                
                
        }
    } else return next()
    
})

app.use(logger('combined'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
app.use('/assets', express.static('public'))
app.set('view engine', 'ejs')
app.use('/auth', loginroutes)
app.use('/wallet', walletroutes)
app.use('/profile', profileroutes)
app.use('/campaign', campaignroutes)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, cssOptions));


// catch not found endpoints
app.use(handleEndpointNotFound)

// error handler
app.use(errorHandler)


module.exports = app
