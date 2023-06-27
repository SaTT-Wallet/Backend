let express = require('express')
let router = express.Router()
const cron = require('node-cron')

const {
    payementRequest,
    getQuote,
    gasPriceErc20,
    checkWalletToken,
    addNewToken,
    mywallet,
    transferTokensController,
    totalBalances,
    userBalance,
    gasPriceBep20,
    gasPriceBtt,
    gasPricePolygon,
    cryptoDetails,
    getMnemo,
    verifyMnemo,
    verifySign,
    createNewWallet,
    removeToken,
    getTransactionHistory,
    balanceStat,
    addTronWalletToExistingAccount,
    gasPriceTrx,
    getGasPrice,
    countWallets,
    allwallets,
    createNewWalletV2,
    transfertAllTokensBEP20,
    checkUserWalletV2Exist,
    checkIsNewUser,
    getCodeKeyStore,
    exportKeyStore,
    exportKeyStoreMobile,
    cryptoPriceDetails,
    globalCryptoMarketInfo,
} = require('../controllers/wallet.controller')
const {
    verifyAuth,
    verifyAuthGetQuote,
} = require('../middleware/passport.middleware')

const {
    getCodeKeyStoreValidation,
    exportKeyStoreValidation,
    walletVersionValidation,
    networkValidation,
    checkTokenValidation,
    checkEVMValidation,
    addNewTokenValidation,
    passwordCheckValidation,
    paymentRequestValidation,
    getQuoteValidation,
    sendTokenValidation,
    migrationWalletValidation,
    cryptoListValidation
} = require('../middleware/walletValidator.middleware')

/**
 * @swagger
 * /wallet/mywallet:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: return user wallet depending on version (v1/v2).
 *     description: system return object of wallet(address,bnb balance ...)<br> with access_token
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code:200,<br>message:"success"
 *       "401":
 *          description: code:401,<br>error:"token required"
 *       "204":
 *          description: code:204,<br>error:"Wallet not found"
 *       "500":
 *          description: code:500,<br>error
 */
router.post('/mywallet', verifyAuth, walletVersionValidation , mywallet)


/**
 * @swagger
 * /wallet/allwallets:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: return user wallet.
 *     description: system return object of wallet(address,bnb balance ...)<br> with access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code:200,<br>message:"success"
 *       "401":
 *          description: code:401,<br>error:"token required"
 *       "204":
 *          description: code:204,<br>error:"Wallet not found"
 *       "500":
 *          description: code:500,<br>error
 */
router.get('/allwallets', verifyAuth, allwallets)

/**
 * @swagger
 * /wallet/userBalance:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: get user balance depending on version (v1/v2).
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *     description: return to user his crypto list <br> with access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/userBalance', verifyAuth, walletVersionValidation ,userBalance)


/**
 * @swagger
 * /wallet/gasPrice/{network}:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get gas price
 *     description: get gas price <br> without access_token
 *     parameters:
 *       - name: network
 *         description: network
 *         in: path
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */

router.get('/gasPrice/:network', networkValidation,getGasPrice)

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
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */

router.get('/Bep20GasPrice', gasPriceBep20)

/**
 * @swagger
 * /wallet/BttGasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get bnb gas price
 *     description: get btt gas price <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */

router.get('/BttGasPrice', gasPriceBtt)

/**
 * @swagger
 * /wallet/TrxGasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get trx gas price
 *     description: get trx gas price <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */

router.get('/TrxGasPrice', gasPriceTrx)

/**
 * @swagger
 * /wallet/polygonGasPrice:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get Matic gas price
 *     description: get Matic gas price <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */

router.get('/polygonGasPrice', gasPricePolygon)


/**
* @swagger
* /wallet/globalCryptoMarketInfo:
*   get:
*     tags:
*     - "wallets"
*     summary: get crypto list details
*     description: return detail of crypto list to user <br> without access_token
*     produces:
*       - application/json
*     responses:
*       "200":
*          description: code,<br>message:"success"
*       "500":
*          description: error:"error"
*/
router.get('/globalCryptoMarketInfo', globalCryptoMarketInfo)

/**
 * @swagger
 * /wallet/cryptoDetails:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get crypto list details
 *     description: return detail of crypto list to user <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: error:"error"
 */
router.get('/cryptoDetails', cryptoDetails)

/**
 * @swagger
 * /wallet/cryptoPriceDetails:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get crypto list details
 *     description: return detail of crypto list to user <br> without access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: cryptolist
 *         required: false
 *         type: string
 *         description: The list of cryptos to get details for, separated by commas
 *     responses:
 *       "200":
 *         description: code,<br>message:"success"
 *       "500":
 *         description: error:"error"
 */
router.get('/cryptoPriceDetails',cryptoListValidation, cryptoPriceDetails);

/**
 * @swagger
 * /wallet/totalBalance:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: get total balance depending on version (v1/v2).
 *     description: return the sum of balances for user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               version:
 *                 type: string
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/totalBalance', verifyAuth, walletVersionValidation,totalBalances)


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
 * /wallet/checkWalletToken:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: check if token already exist.
 *     description: check if a valid token or not <br> with access token.
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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found" /"not a token address"

 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/checkWalletToken', verifyAuth, checkTokenValidation,checkWalletToken)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found" /"not a token address"
 *       "401":
 *          description: code,<br>error:"token already added"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/addNewToken', verifyAuth, addNewTokenValidation,addNewToken)

/**
 * @swagger
 * /wallet/transferTokens:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: transfer ALL TOKENS.
 *     description: transfer BTT <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               from:
 *                 type: string
 *               to:
 *                 type: string
 *               amount:
 *                 type: string
 *               tokenSymbol:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *               network:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "401":
 *          description: code,<br>error:"not_enough_budget" /"wrong password"
 *       "500":
 *          description: code,<br>error:"error"
 *
 */
router.post('/transferTokens', verifyAuth, sendTokenValidation ,transferTokensController)

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
 *                 type: string!
 *               fiat_currency:
 *                 type: string
 *               requested_amount:
 *                 type: number
 *               requested_currency:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "403":
 *          description: code,<br>error:"Please enter amount of 50 USD or more"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/getQuote', verifyAuthGetQuote, getQuoteValidation ,getQuote)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/payementRequest', verifyAuth, paymentRequestValidation ,payementRequest)



/**
 * @swagger
 * /wallet/getMnemo:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: get passphrase.
 *     description: get wallet seed.
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.get('/getMnemo', verifyAuth, getMnemo)

/**
 * @swagger
 * /wallet/verifyMnemo:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: check passphrase.
 *     description: verify if the user got his seed phrase.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               mnemo:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/verifyMnemo', verifyAuth, verifyMnemo)

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
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"Wallet already exist"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/create', verifyAuth, passwordCheckValidation,createNewWallet)

/**
 * @swagger
 * /wallet/verifySign:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: verify wallet.
 *     description: verif wallet.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"Wallet already exist"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/verifySign', verifyAuth, passwordCheckValidation ,verifySign)

/**
 * @swagger
 * /wallet/create/v2:
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
 *               password:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"Wallet already exist"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/create/v2', verifyAuth, passwordCheckValidation ,createNewWalletV2)


/**
 * @swagger
 * /wallet/add-tron-wallet:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: add TRX wallet to preExisting ETH/BTC Wallet .
 *     description: add TRX wallet to preExisting ETH/BTC Wallet.
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
 *          description: code,<br>message:"success"
 *       "401":
 *          description: code,<br>error:"Wallet already exist"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/add-tron-wallet', verifyAuth, passwordCheckValidation, addTronWalletToExistingAccount)

/**
 * @swagger
 * /wallet/removeToken/{tokenAddress}:
 *   delete:
 *     tags:
 *     - "wallets"
 *     summary: remove added token.
 *     description: remove custom token added by user.
 *     parameters:
 *       - in: path
 *         name: tokenAddress
 *         required: true
 *         description: token address to remove.
 *     responses:
 *       "200":
 *          description: code,<br>message:"token removed"
 *       "401":
 *          description: code,<br>error:"token not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.delete('/removeToken/:address', verifyAuth, checkEVMValidation,removeToken)

/**
 * @swagger
 * /wallet/transaction_history/{address}:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: transaction history.
 *     description: user enter his wallet id and get her transaction history.
 *     parameters:
 *       - name: address
 *         description: wallet id.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Token not found" /"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.get('/transaction_history/:address', checkEVMValidation,getTransactionHistory)

/**
 * @swagger
 * /wallet/countWallets:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: total wallets.
 *     description: render satt total wallets.

 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: code,<br>error:"error"
 */

router.get('/countWallets', countWallets)

/**
 * @swagger
 * /wallet/stats:
 *   get:
 *     tags:
 *     - "wallets"
 *     summary: status balance.
 *     description: user get his hitorics of balance.

 *     responses:
 *       "200":
 *          description: code,<br>message:"success"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.get('/stats', verifyAuth, balanceStat)

router.post('/transfertTokensBep20', verifyAuth, migrationWalletValidation,transfertAllTokensBEP20)


router.get('/checkUserWalletV2', verifyAuth, checkUserWalletV2Exist)



router.get('/checkIsNewUser', verifyAuth, checkIsNewUser)



router.post('/code-export-keystore', verifyAuth, getCodeKeyStoreValidation ,getCodeKeyStore)



router.post('/export-keystore', verifyAuth, exportKeyStoreValidation ,exportKeyStore)


router.post('/export-keystore-mobile', verifyAuth ,exportKeyStoreMobile)

module.exports = router
