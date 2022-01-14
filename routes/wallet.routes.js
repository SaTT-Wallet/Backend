
let express = require('express');
let router = express.Router();
const {gasPriceErc20, transfertBep20, mywallet, transfertErc20,totalBalances, userBalance,gasPriceBep20, prices} = require('../controllers/wallet.controller')



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
 * /wallet/Bep20GasPrice:
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


router.get('/Bep20GasPrice', gasPriceBep20)




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





/**
 * @swagger
 * /wallet/Erc20GasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     description: gas price ERC20
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: {gasPrice}
 *       "500":
 *          description: error:"error"
 */



 router.get('/Erc20GasPrice', gasPriceErc20)



 	/**
 * @swagger
 * /wallet/transferErc20:
 *   post:
 *     summary: transfer erc20 {deprecated}.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenERC20:
 *                 type: string
 *               to:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               symbole:
 *                 type: string
 *               decimal:
 *                 type: number
 *               access_token:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */


 router.post('/transferErc20', transfertErc20)
 


 	/**
 * @swagger
 * /wallet/transferBep20:
 *   post:
 *     summary: transfer bep20 {deprecated}.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               newsLetter:
 *                 type: boolean
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */



 router.post('/transferBep20', transfertBep20)




module.exports = router;
