
let express = require('express');
let router = express.Router();
const {exportEth,exportBtc,bridge, payementRequest, getQuote,transfertEther, transfertBNB, transfertBtc, 
	gasPriceErc20,checkWalletToken, addNewToken, transfertBep20, mywallet, 
	transfertErc20,totalBalances, userBalance,gasPriceBep20, cryptoDetails,prices,createNewWallet} = require('../controllers/wallet.controller')
const { verifyAuth} =require('../middleware/passport.middleware');


/**
 * @swagger
 * /wallet/mywallet:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: return user wallet.
 *     description: system return object of wallet(address,bnb balance ...)<br> with access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: wallet:{"address":"address","ether_balance":"balance","bnb_balance":"balance","satt_balance":"balance","btc_balance":0}
 *       "500":
 *          description: error:"error"
 */
router.get('/mywallet',verifyAuth,mywallet)

/**
 * @swagger
 * /wallet/userBalance:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get user balance
 *     description: return to user his crypto list <br> with access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: listOfCrypto:[{ list of crypto}]
 *       "500":
 *          description: error:"error"
 */
router.get('/userBalance',verifyAuth,userBalance)




/**
 * @swagger
 * /wallet/Bep20GasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get bnb gas price
 *     description: get bnb gas price <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: data:{ "gasPrice":gas price}
 *       "500":
 *          description: error:"error"
 */


router.get('/Bep20GasPrice', gasPriceBep20)




/**
 * @swagger
 * /wallet/cryptoDetails:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get crypto list details
 *     description: return detail of crypto list to user <br> with access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: list:[{list of crypto}]
 *       "500":
 *          description: error:"error"
 */
router.get('/cryptoDetails', cryptoDetails)

/**
 * @swagger
 * /wallet/totalBalance:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get total balance
 *     description: return the sum of balances for user
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: Total_balance:Total_balance
 *       "500":
 *          description: error:"error"
 */
router.get('/totalBalance',verifyAuth, totalBalances);





/**
 * @swagger
 * /wallet/Erc20GasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: gas price ERC20
 *     description: return gas price of ERC20 network <br> without access_token 
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: gasPrice:gasPrice
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
 *     summary: transfer erc20.
 *     description: transfert crypto belongs to erc20 network <br> with access_token.
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
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
 router.post('/transferErc20',verifyAuth, transfertErc20)
 



 	/**
 * @swagger
 * /wallet/transferBep20:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfer bep20.
 *     description: transfert crypto belongs to bep20 network <br> with access_token.
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
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
 router.post('/transferBep20',verifyAuth, transfertBep20)




 	/**
 * @swagger
 * /wallet/checkWalletToken:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: check if token already exist.
 *     description: check if a valid token or not <br> without access token.
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
 *          description: error:not a token address <br> data:{message:Token found,tokenName:tokenName,symbol:symbol,decimal:decimal,tokenAdress:tokenAdress,network:network}
 *       "500":
 *          description: error:error message
 */

 router.post('/checkWalletToken',verifyAuth, checkWalletToken)



 	/**
 * @swagger
 * /wallet/addNewToken:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: add new token.
 *     description: add new custom token to user <br> with access_token.
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
 *          description: message:token already added <br> data:token added
 *       "500":
 *          description: error:error message
 */
 router.post('/addNewToken',verifyAuth, addNewToken)


 	/**
 * @swagger
 * /wallet/transfertBtc:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert BTC.
 *     description: transfert btc <br> with access_token.
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
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
 router.post('/transfertBtc',verifyAuth, transfertBtc)


 	/**
 * @swagger
 * /wallet/transfertBNB:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert BNB.
 *     description: transfert bnb <br> with access_token.
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
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
 router.post('/transfertBNB',verifyAuth, transfertBNB)
  	/**
 * @swagger
 * /wallet/transfertEther:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfert ETHER.
 *     description: transfert ETH <br> with access_token.
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
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */



router.post('/transfertEther',verifyAuth, transfertEther)


 	/**
 * @swagger
 * /wallet/getQuote:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: get quote.
 *     description: initial step to interact with the wallet api of simplex to asking for prices details.
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
 *          description: error:Transaction amount too low. Please enter a value of 50 USD or more. <br> data:{user_id:user_id,quote_id:quote_id,wallet_id:satt,digital_money:{currency:currency,amount:amount},fiat_money:{currency:currency,base_amount:base_amount,total_amount:total_amount},valid_until:valid_until}
 *       "500":
 *          description: error:error message
 */
 router.post('/getQuote',verifyAuth, getQuote)


 	/**
 * @swagger
 * /wallet/payementRequest:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary:  payement request in simplex.
 *     description: simplex process the payement and send the payment_id.
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
 *               idWallet:
 *                 type: string
 *     responses:
 *       "200":
 *          description: {"is_kyc_update_required":true,"payment_id":payment_id}
 *       "500":
 *          description: error:error message
 */
 router.post('/payementRequest',verifyAuth, payementRequest)


 /**
 * @swagger
 * /wallet/bridge:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: swap satt erc20 to bep20 and the opposite.
 *     description: to swapp satt from bep20 to erc20 you need to use direction="bte", from erc20 to bep20 you need to use direction="etb".
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               direction:
 *                 type: string
 *               password:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       "200":
 *          description: transactionHash:transactionHash,address:address,to:to,amount:amount
 *       "500":
 *          description: error:error message
 */
  router.post('/bridge',verifyAuth, bridge)


 	/**
 * @swagger
 * /wallet/exportBtc:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: export btc wallet.
 *     description: user can download his BTC key, <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string

 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
	  router.post('/exportBtc',verifyAuth, exportBtc)



	   	/**
 * @swagger
 * /wallet/exportETH:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: export eth wallet.
 *     description: user can download his ETH key, <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string

 *     responses:
 *       "200":
 *          description: err:Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
router.post('/exportETH',verifyAuth, exportEth)

   /**
 * @swagger
 * /wallet/prices:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get prices.
 *     description: get prices.
 *     responses:
 *       "200":
 *          description: list:[{list of crypto}]
 *       "500":
 *          description: error:error message
 */
	router.get('/prices', prices)

/**
 * @swagger
 * /wallet/create:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: create new wallet.
 *     description: create new wallet.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: list:[{list of crypto}]
 *       "500":
 *          description: error:error message
 */
 router.post('/create',verifyAuth,createNewWallet)
module.exports = router;
