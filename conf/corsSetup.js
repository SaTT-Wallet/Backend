require('dotenv').config()
const corsSetup = (req, res, next) => {
    const apiKey = req.headers['api-key'];
  
    if (apiKey && apiKey === process.env.API_KEY) {
      return next();
    }
  
    if (process.env.NODE_ENV === "mainnet") {
      const allowedOrigins = [
        'https://dapp.satt.com',
        'https://satt-token.com',
        'https://app.ihave.io',
        'http://backoffice.atayen.us'
      ];
  
      if (req.headers.origin && allowedOrigins.includes(req.headers.origin)) {
        return next();
      }
  
      const blockedUrls = [
        'google',
        'youtube',
        'facebook',
        'tikTok',
        'tiktok',
        'linkedin',
        'twitter',
        'telegram'
      ];
  
      if (blockedUrls.some(url => req.url.includes(url))) {
        return next();
      }
  
      return res.redirect("https://satt-token.com");
    }
  
    return next();
  };



module.exports = corsSetup