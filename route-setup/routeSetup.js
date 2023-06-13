const loginRoutes = require('../routes/login.routes')
const walletRoutes = require('../routes/wallet.routes')
const profileRoutes = require('../routes/profile.routes')
const campaignRoutes = require('../routes/campaign.routes')
const {swaggerUi, swaggerSpec, cssOptions} = require('../conf/swaggerSetup');


const setupRoutes = (app) => {
    // AUTH ROUTES
    app.use('/auth', loginRoutes);

    // WALLET ROUTES
    app.use('/wallet', walletRoutes);

    // PROFILE ROUTES
    app.use('/profile', profileRoutes);

    // CAPAIGN ROUTES
    app.use('/campaign', campaignRoutes);

    // SWAGGER DOCS
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, cssOptions));
  }


  
  
  module.exports = setupRoutes;