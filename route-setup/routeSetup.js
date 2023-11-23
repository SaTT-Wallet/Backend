const loginRoutes = require('../routes/login.routes')
const walletRoutes = require('../routes/wallet.routes')
const profileRoutes = require('../routes/profile.routes')
const campaignRoutes = require('../routes/campaign.routes')
const externalRoutes = require('../routes/external.routes')
const {swaggerUi, swaggerSpec, cssOptions} = require('../conf/swaggerSetup');
const {errorHandler, handleEndpointNotFound} = require('../middleware/errorHandler.middleware');

const setupRoutes = (app) => {

    // AUTH ROUTES
    app.use('/auth', loginRoutes);

    // WALLET ROUTES
    app.use('/wallet', walletRoutes);

    // PROFILE ROUTES
    app.use('/profile', profileRoutes);

    // CAPAIGN ROUTES
    app.use('/campaign', campaignRoutes);

    // EXTERNAL ROUTES FOR DAPP 
    app.use('/external', externalRoutes)

    // SWAGGER DOCS
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, cssOptions));

    // CATCH NOT FOUND END-POINTS
    app.use(handleEndpointNotFound)

    // ERROR HANDLER
    app.use(errorHandler)

  }



  
  module.exports = setupRoutes;