require('dotenv').config()
const corsSetup = (req, res, next) =>{
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
                req.url.includes('youtube') ||
                req.url.includes('facebook') ||
                req.url.includes('tikTok') ||
                req.url.includes('tiktok') ||
                req.url.includes('linkedin') ||
                req.url.includes('twitter') ||
                req.url.includes('telegram')
            ) {
                return next()
            } else return res.redirect("https://satt-token.com");
            
                
                
        }
    } else return next()
}



module.exports = corsSetup