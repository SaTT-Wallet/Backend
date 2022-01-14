let express = require('express');
let router = express.Router();
const {mywallet, totalBalances, userBalance,gasPrice, prices} = require('../controllers/wallet.controller')



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
 *          description: wallet:{}
 *       "500":
 *          description: error:"error"
 */

router.get('/mywallet',mywallet)



/**
 * @swagger
 * /wallet/userBalance:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: get user balance
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: listOfCrypto:[{ list of crypto}]
 *       "500":
 *          description: error:"error"
 */


router.get('/userBalance',userBalance)




/**
 * @swagger
 * /wallet/bnbGasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: get bnb gas price
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: {gasPrice}
 *       "500":
 *          description: error:"error"
 */


router.get('/bnbGasPrice', gasPrice)




/**
 * @swagger
 * /wallet/prices:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: get prices
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: [{list of prices}]
 *       "500":
 *          description: error:"error"
 */
router.get('/prices', prices)



/**
 * @swagger
 * /wallet/totalBalnce:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: get total balance
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: {Total_balance:{Total_balance},variation}
 *       "500":
 *          description: error:"error"
 */



router.get('/totalBalnce', totalBalances)





module.exports = router;