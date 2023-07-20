const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const cors = require('cors');
const corsSetup = require('./conf/corsSetup');
const setupRoutes = require('./route-setup/routeSetup');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const { connect } = require('./conf/database');
require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`
});

const app = express();

// Middleware
app.use(express.json({ limit: '50mb', extended: true }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
app.use(mongoSanitize({
  allowDots: true,
  replaceWith: '_',
}));

// Security
app.disable('x-powered-by');
app.use(helmet());
app.use(helmet.frameguard({ action: 'deny' }));

// Cross-origin resource sharing
app.use(cors('*'));
app.use(corsSetup);

// Logging
app.use(logger('combined'));

// Cookie parsing
app.use(cookieParser());

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/assets', express.static('public'));

// View engine
app.set('view engine', 'ejs');

// Connect to database
connect();

// Setup routes
setupRoutes(app);

module.exports = app;
