
let express = require('express');
let router = express.Router();
const {payementRequest, getQuote,transfertEther, transfertBNB, transfertBtc, gasPriceErc20,checkWalletToken, addNewToken, transfertBep20, mywallet, transfertErc20,totalBalances, userBalance,gasPriceBep20, prices} = require('../controllers/wallet.controller')



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
 * /wallet/pricesBnb:
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
router.get('/pricesBnb', prices)



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
 *     tags:
 *     - "wallets"
 *     summary: transfer erc20 {deprecated}.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               token:
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
 *     tags:
 *     - "wallets"
 *     summary: transfer bep20 {deprecated}.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               symbole:
 *                 type: string
 *               to:
 *                 type: string
 *               amount:
 *                 type: string
 *               decimal:
 *                 type: number
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */


 router.post('/transferBep20', transfertBep20)




 	/**
 * @swagger
 * /wallet/checkWalletToken:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: check if token already exist.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAdress:
 *                 type: string
 *               network:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */

 router.post('/checkWalletToken', checkWalletToken)



 	/**
 * @swagger
 * /wallet/addNewToken:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: add new token.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenName:
 *                 type: string
 *               tokenAdress:
 *                 type: string
 *               symbol:
 *                 type: string
 *               network:
 *                 type: string
 *               decimal:
 *                 type: number
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */


 router.post('/addNewToken', addNewToken)




 	/**
 * @swagger
 * /wallet/transfertBtc:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert BTC.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               to:
 *                 type: string
 *               val:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */



 router.post('/transfertBtc', transfertBtc)





 	/**
 * @swagger
 * /wallet/transfertBNB:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert BNB.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               to:
 *                 type: string
 *               val:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */



 router.post('/transfertBNB', transfertBNB)







  	/**
 * @swagger
 * /wallet/transfertEther:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert ETHER.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               to:
 *                 type: string
 *               val:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */



router.post('/transfertEther', transfertEther)


 	/**
 * @swagger
 * /wallet/getQuote:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: buy quote.
 *     description: parametres acceptées :body{transferParameter}.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               digital_currency:
 *                 type: string
 *               fiat_currency:
 *                 type: string
 *               requested_amount:
 *                 type: number
 *               requested_currency:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password OR hash
 *       "500":
 *          description: error:error message
 */





 router.post('/getQuote', getQuote)


 	/**
 * @swagger
 * /wallet/payementRequest/{idWallet}:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary:  payement request in simplex.

 *     description: parametres acceptées :body{transferParameter}.
 *     parameters:
 *       - name: idWallet
 *         description: wallet id.
 *         in: path
 *         required: true
 *         type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               currency:
 *                 type: string
 *               quote_id:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:Validation failed
 *       "500":
 *          description: error:error message
 */

 router.post('/payementRequest/:idWallet', payementRequest)


module.exports = router;
