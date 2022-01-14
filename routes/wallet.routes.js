
let express = require('express');
let router = express.Router();
const {mywallet} = require('../controllers/wallet.controller')



/**
 * @swagger
 * /wallet/mywallet:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: get my wallet
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: captcha:{_id,originalImage,puzzle,position}
 *       "500":
 *          description: error:"error"
 */

router.get('/mywallet',mywallet)



module.exports = router;
