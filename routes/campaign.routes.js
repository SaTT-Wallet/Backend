let express = require('express')
let router = express.Router()
const {
    rejectLink,
    bep20Approval,
    erc20Approval,
    campaignDetails,
    campaigns,
    launchCampaign,
    campaignPromp,
    launchBounty,
    apply,
    linkNotifications,
    linkStats,
    increaseBudget,
    getLinks,
    getFunds,
    gains,
    addKits,
    update,
    kits,
    saveCampaign,
    upload,
    validateCampaign,
    bep20Allow,
    erc20Allow,
} = require('../controllers/campaign.controller')
const { verifyAuth } = require('../middleware/passport.middleware')

/**
 * @swagger
 * /campaign/bep20/approval:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: bep20 aprroval
 *     description: bep20 aprroval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               campaignAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br> message,<br> data:{token:tokenAddress,allowance:allowance,spender:campaignAddress}
 *          content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                   allowance:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: string
 *                   spender:
 *                     type: string
 *                 example:
 *                   token: "0x123456...654654"
 *                   allowance:
 *                     amount: "0"
 *                   spender: "0x987654...3221"
 *       "500":
 *          description: error:"error"
 */
router.post('/bep20/approval', verifyAuth, bep20Approval)

/**
 * @swagger
 * /campaign/bep20/allow:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: bep20 allow
 *     description: bep20 allow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaignAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: code,<br> message,<br> data:{transactionHash:transactionHash,address:address,campaignAddress:campaignAddress}
 *          content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   transactionHash:
 *                     type: string
 *                   address:
 *                     type: string
 *                   spender:
 *                     type: string
 *       "500":
 *          description: error:"error"
 */
router.post('/bep20/allow', verifyAuth, bep20Allow)
/**
 * @swagger
 * /campaign/erc20/approval:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: erc20 aprroval
 *     description: erc20 aprroval
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               campaignAddress:
 *                 type: string
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   token:
 *                     type: string
 *                   allowance:
 *                     type: object
 *                     properties:
 *                       amount:
 *                         type: string
 *                   spender:
 *                     type: string
 *                 example:
 *                   token: "0x123456...654654"
 *                   allowance:
 *                     amount: "0"
 *                   spender: "0x987654...3221"
 *       "500":
 *          description: error:"error"
 */
router.post('/erc20/approval', verifyAuth, erc20Approval)
/**
 * @swagger
 * /campaign/erc20/allow:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: erc20 allow
 *     description: erc20 allow
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaignAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               tokenAddress:
 *                 type: string
 *               pass:
 *                 type: string
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  name:
 *                    type: string
 *                  message:
 *                    type: string
 *                  expiredAt:
 *                    type: string
 *       "500":
 *          description: error:"error"
 */
router.post('/erc20/allow', verifyAuth, erc20Allow)
/**
 * @swagger
 * /campaign/launch/performance:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: transfer erc20.
 *     description: transfert crypto belongs to erc20 network <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               amount:
 *                 type: string
 *               contract:
 *                 type: string
 *               dataUrl:
 *                 type: string
 *               endDate:
 *                 type: integer
 *               startDate:
 *                 type: integer
 *               idCampaign:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema:      # Request body contents
 *                type: object
 *                properties:
 *                  transactionHash:
 *                    type: string
 *                  address:
 *                    type: string
 *                  to:
 *                    type: string
 *                  amount:
 *                    type: string
 *       "500":
 *          description: ERROR
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *              example:
 *                error: error
 */
router.post('/launch/performance', verifyAuth, launchCampaign)
/**
 * @swagger
 * /campaign/launchBounty:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: transfer erc20.
 *     description: transfert crypto belongs to erc20 network <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               tokenAddress:
 *                 type: string
 *               contract:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               dataUrl:
 *                 type: string
 *               amount:
 *                 type: string
 *               pass:
 *                 type: string
 *               startDate:
 *                 type: integer
 *               endDate:
 *                 type: integer
 *     responses:
 *       "200":
 *          description: err:gas insuffisant,solde insuffisant,Wrong password <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *          content:
 *            application/json:
 *              schema: # Request body contents
 *                type: object
 *                properties:
 *                  transactionHash:
 *                    type: string
 *                  address:
 *                    type: string
 *                  to:
 *                    type: string
 *                  amount:
 *                    type: string
 *       "500":
 *          description: error:error message
 *          content:
 *            application/json:
 *              schema: # Request body contents
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 *              example:
 *                error: error
 */

router.post('/launchBounty', verifyAuth, launchBounty)

/**
 * @swagger
 * /campaign/campaigns:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaigns list
 *     description: Returns the list of campaigns <br> without access_token
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema:
 *                type: array
 *                items:
 *                  type: object
 *       "500":
 *          description: ERROR
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 */
router.get('/campaigns', verifyAuth, campaigns)

/**
 * @swagger
 * /campaign/details/{id}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign details
 *     description: return to user campaign detalds <br> with access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: campaign id
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema:      # Request body contents
 *                type: object
 *                $ref: '#/definitions/Campaign'
 *
 *       "500":
 *          description: ERROR
 *          content:
 *            application/json:
 *              schema:
 *                type: object
 *                properties:
 *                  error:
 *                    type: string
 */
router.get('/details/:id', campaignDetails)

/**
 * @swagger
 * /campaign/campaignPrompAll/{id}:
 *   get:
 *     tags: ["campaign"]
 *     summary: get campaign pending link
 *     description: return to user the list of campaign promp ALl <br> without access_token
 *     produces:
 *     - application/json
 *     parameters:
 *     - in: path
 *       name: id
 *       type: string
 *       description: the campaign id.
 *
 *       required: true
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema:      # Request body contents
 *                type: array
 *                items:
 *                  type: object
 *                  $ref: '#/definitions/Campaign'
 *       "500":
 *          description: error:"error"
 */
router.get('/campaignPrompAll/:id', verifyAuth, campaignPromp)

/**
 * @swagger
 * /campaign/apply:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: apply your link.
 *     description:  allow user to apply his post link for the campaign <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               typeSN:
 *                 type: number
 *               idPost:
 *                 type: string
 *               idUser:
 *                 type: string
 *               title:
 *                 type: string
 *               hash:
 *                 type: string
 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema: # Request body contents
 *                type: object
 *                properties:
 *                  idCampaign:
 *                    type: string
 *                  idPost:
 *                    type: string
 *                  idProm:
 *                    type: string
 *                  isUser:
 *                    type: string
 *                  transactionHash:
 *                    type: string
 *                  typeSN:
 *                    type: number
 *       "500":
 *          description: error:error message
 */
router.post('/apply', verifyAuth, apply)
/**
 * @swagger
 * /campaign/linkNotification:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get link notification.
 *     description:  return to user link notification <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               idCampaign:
 *                 type: string
 *               idProm:
 *                 type: string
 *               link:
 *                 type: string

 *     responses:
 *       "200":
 *          description: ok
 *          content:
 *            application/json:
 *              schema: # Response body contents
 *                type: object
 *                properties:
 *                  message:
 *                    type: string
 *       "500":
 *          description: error:error message
 */
router.post('/linkNotification', linkNotifications)
/**
 * @swagger
 * /campaign/validate:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: validate participation.
 *     description:  admin of campaign can accept  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *               idProm:
 *                 type: string
 *               link:
 *                 type: string
 *               email:
 *                 type: string
 *               idUser:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
router.post('/validate', verifyAuth, validateCampaign)

/**
 * @swagger
 * /campaign/gains:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get gains.
 *     description:  user get his gains  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idProm:
 *                 type: string
 *               hash:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

router.post('/gains', verifyAuth, gains)

/**
 * @swagger
 * /campaign/save:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: create new campaign.
 *     description:  user create new campaign  <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               resume:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               reference:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     item_id:
 *                            type: integer
 *                     item_text:
 *                            type: string
 *               token:
 *                 type: object
 *                 properties:
 *                    name:
 *                      type: string
 *                    type:
 *                      type: string
 *                    addr:
 *                      type: string
 *               tags:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *               endDate:
 *                 type: integer
 *               startDate:
 *                 type: integer
 *               remuneration:
 *                 type: string
 *               cost:
 *                 type: string
 *               cost_usd:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *               bounties:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

router.post('/save', verifyAuth, saveCampaign)

/**
 * @swagger
 * /campaign/{idCampaign}/kits:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign pending link
 *     description: return to user the list of campaign promp ALl <br> without access_token
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: idCampaign
 *         description: the  idCampaign.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: code,<br>message,<br>data[{}]
 *       "500":
 *          description: code,<br>error
 */
router.get('/:idCampaign/kits', verifyAuth, kits)

/**
 * @swagger
 * /campaign/addKits:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: add kits.
 *     description:  user create new campaign  <br> with access_token.
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaign:
 *                 type: string
 *               file:
 *                 type: string
 *                 format : base64
 *               link:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

router.post('/addKits', verifyAuth, upload, addKits)

/**
 * @swagger
 * /campaign/update/{idCampaign}:
 *   put:
 *     tags:
 *     - "campaign"
 *     summary: create new campaign.
 *     description:  user create new campaign  <br> with access_token.
 *     parameters:
 *       - name: idCampaign
 *         description: the  campaign id.
 *         in: path
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               resume:
 *                 type: string
 *               brand:
 *                 type: string
 *               description:
 *                 type: string
 *               reference:
 *                 type: string
 *               cover:
 *                 type: string
 *               coverSrc:
 *                 type: string
 *               logo:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: object 
 *                   properties:
 *                     item_id:
 *                            type: integer
 *                     item_text:
 *                            type: string   
 *               token:
 *                 type: object
 *                 properties:
 *                    name:
 *                      type: string
 *                    type:
 *                      type: string
 *                    addr:
 *                      type: string
 *               tags:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string
 *               endDate:
 *                 type: date
 *               startDate:
 *                 type: date
 *               remuneration:
 *                 type: string
 *               cost:
 *                 type: string
 *               cost_usd:
 *                 type: string
 *               ratios:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *               bounties:
 *                 type: array
 *                 items:
 *                     oneOf:
 *                         - type: string
 *                         - type: string
 *                         - type: integer
 *                         - type: string

 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

router.put('/update/:idCampaign', verifyAuth, update)
/**
 * @swagger
 * /campaign/prom/stats/{idProm}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: link stats
 *     description: return to user the link info and statistics
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the  idProm.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

router.get('/prom/stats/:idProm', linkStats)

/**
 * @swagger
 * /campaign/funding:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: Increase budget.
 *     description: parametres acceptées :body{campaign} , headers{headers}.
 *     parameters:
 *       - name: pass
 *         description: password of user.
 *       - name: amount
 *         description: amount of campaign.
 *       - name: ERC20token
 *         description: ERC20token.
 *       - name: idCampaign
 *         description: campaign id.
 *     responses:
 *        "200":
 *          description: data
 */
router.post('/funding', verifyAuth, increaseBudget)

/**
 * @swagger
 * /campaign/filterLinks/{id_wallet}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get loggedin user links
 *     description: return  the links of users
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id_wallet
 *         description: the address wallet of user.
 *         in: path
 *         required: true

 *     responses:
 *       "200":
 *          description:[list of links]
 *       "500":
 *          description: error:"error"
 */
router.get('/filterLinks/:id_wallet', getLinks)

/**
 * @swagger
 * /campaign/remaining:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: get remaining funds in a campaign
 *     description: this api allow the user to retrieve his funds in an ended campaign
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               pass:
 *                 type: string
 *               idCampaign:
 *                 type: string
 *     responses:
 *       "200":
 *          description:[list of links]
 *       "500":
 *          description: error:"error"
 */
router.post('/remaining', getFunds)

/**
 * @swagger
 * /campaign/reject/{idLink}:
 *   put:
 *     tags:
 *     - "campaign"
 *     summary: reject link
 *     description: admin of campaign can reject a link
 *     parameters:
 *       - name: idLink
 *         description: the  idLink.
 *         in: path
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               idCampaign:
 *                 type: string
 *               title:
 *                 type: string
 *               email:
 *                 type: string
 *               link:
 *                 type: string
 *               idUser:
 *                 type: string
 *     responses:
 *       "200":
 *          description: data
 *       "500":
 *          description: error:"error"
 */
router.put('/reject/:idLink', rejectLink)

module.exports = router
