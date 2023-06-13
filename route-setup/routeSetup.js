const loginRoutes = require('../routes/login.routes')
const walletRoutes = require('../routes/wallet.routes')
const profileRoutes = require('../routes/profile.routes')
const campaignRoutes = require('../routes/campaign.routes')

const setupRoutes = (app) => {
    // AUTH ROUTES
    app.use('/auth', loginRoutes);

    // WALLET ROUTES
    app.use('/wallet', walletRoutes);

    // PROFILE ROUTES
    app.use('/profile', profileRoutes);

    // CAPAIGN ROUTES
    app.use('/campaign', campaignRoutes);
  }
  
  module.exports = setupRoutes;