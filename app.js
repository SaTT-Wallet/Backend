var fs = require('fs')
const mongoose = require('mongoose')
let createError = require('http-errors')

var express = require('express')
let app = express()

var cors = require('cors')
require('dotenv').config()
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let path = require('path')

const package = require('./package.json')
var bodyParser = require('body-parser')
app.use(express.json({ limit: '50mb' }))
app.use(
    express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
)
const { mongoConnection } = require('./conf/config')

const loginroutes = require('./routes/login.routes')
const walletroutes = require('./routes/wallet.routes')
const profileroutes = require('./routes/profile.routes')
const campaignroutes = require('./routes/campaign.routes')

/// db.url is different depending on NODE_ENV
let connect
try {
    connect = mongoose.connect(mongoConnection().mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
    })
    console.log(mongoConnection().mongoURI)

    console.log(mongoConnection().mongoBase)
    console.log('******connection establed to MongoServer*******')
} catch (error) {
    console.log('there is no connection')
}
module.exports.connect = connect

app.disable('x-powered-by')
app.use(
    cors({
        methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'],
    })
)
app.use(logger('dev'))
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
let host
if (process.env.NODE_ENV == 'testnet') {
    host = process.env.BASEURL
} else if (process.env.NODE_ENV == 'local') {
    host = process.env.BASEURLLOCAL
} else {
    host = process.env.BASEURL_MAINNET
}

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUi = require('swagger-ui-express')
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'API for node-satt',
        version: package.version,
        description:
            'Welcome to SaTT Webservice endpoint, this backend provides webservice to SaTT WebWallet and advertising campaign manager',
        customCss: '.swagger-ui .topbar { display: none }',
    },
    host: host,
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [
        {
            bearerAuth: [],
        },
    ],
}
var cssOptions = {
    customCss: `
    .topbar-wrapper img {content:url(/assets/SaTT.png); width:50px; height:auto;}`,
    customSiteTitle: 'SaTT',
    customfavIcon: '/assets/SaTT-noire.png',
}
const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'],
}
const swaggerSpec = swaggerJSDoc(options)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, cssOptions))

// catch 204 and forward to error handler
app.use(function (req, res, next) {
    res.status(404)
    // respond with json
    if (req.accepts('json')) {
        res.json({ error: 'Not found' })
        return
    }

    // default to plain-text. send()
    res.type('txt').send('Not found')
})

// error handler

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message
    res.locals.error = req.app.get('env') === 'testnet' ? err : {}

    // render the error page
    res.status(err.status || 500)
    console.log('err', err)
})

module.exports = app
