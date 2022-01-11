let express = require('express');
let router = express.Router();
const {mywallet} = require('../controllers/wallet.controller')



router.get('/v2/mywallet/:token',mywallet)



module.exports = router;