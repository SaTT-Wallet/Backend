let express = require('express')
let router = express.Router()
const cron = require('node-cron')

const {
    exportEth,
    exportBtc,
    payementRequest,
    getQuote,
    gasPriceErc20,
    gasPriceTron,
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
    createNewWallet,
    removeToken,
    getTransactionHistory,
    bridge,
    balanceStat,
    exportWalletInfos,
    addTronWalletToExistingAccount,
    transferTokensController30trx,
    gasPriceTrx,
} = require('../controllers/wallet.controller')
const {
    verifyAuth,
    verifyAuthGetQuote,
} = require('../middleware/passport.middleware')

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
 *          description: code:200,<br>message:"success"
 *       "401":
 *          description: code:401,<br>error:"token required"
 *       "204":
 *          description: code:204,<br>error:"Wallet not found"
 *       "500":
 *          description: code:500,<br>error
 */
router.get('/mywallet', verifyAuth, mywallet)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.get('/userBalance', verifyAuth, userBalance)

// router.get('/polygonCnx', testPolygon.polygonConnexion)
// router.get('/polygonContract', getContractPolygon)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.get('/totalBalance', verifyAuth, totalBalances)

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
router.post('/checkWalletToken', verifyAuth, checkWalletToken)

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
router.post('/addNewToken', verifyAuth, addNewToken)

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
router.post('/transferTokens', verifyAuth, transferTokensController)
/**
 * @swagger
 * /wallet/30-transaction:
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
 */
router.post('/30-transaction', verifyAuth, transferTokensController30trx)
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
router.post('/getQuote', verifyAuthGetQuote, getQuote)

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
router.post('/payementRequest', verifyAuth, payementRequest)

/**
 * @swagger
 * /wallet/bridge:
 *   post:
 *     tags:
 *     - "wallets"
 *     summary: swap satt erc20 to bep20 and the opposite.
 *     description: to swap satt from bep20 to erc20 you need to use direction="bte", from erc20 to bep20 you need to use direction="etb".
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               amount:
 *                 type: string
 *     responses:
 *       "200":
 *          description: transactionHash:transactionHash,address:address,to:to,amount:amount
 *       "500":
 *          description: error:error message
 */
//router.post('/bridge', verifyAuth, bridge)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/exportBtc', verifyAuth, exportBtc)

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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/exportETH', verifyAuth, exportEth)

/**
 * @swagger
 * /wallet/exportWalletInfos:
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
 *          description: code,<br>message:"success"
 *       "204":
 *          description: code,<br>error:"Wallet not found"
 *       "500":
 *          description: code,<br>error:"error"
 */
router.post('/exportWalletInfos', verifyAuth, exportWalletInfos)

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
router.post('/create', verifyAuth, createNewWallet)

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
router.post('/add-tron-wallet', verifyAuth, addTronWalletToExistingAccount)

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
router.delete('/removeToken/:tokenAddress', verifyAuth, removeToken)

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
router.get('/transaction_history/:address', getTransactionHistory)

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

module.exports = router
