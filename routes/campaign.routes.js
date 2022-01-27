let express = require('express');
let router = express.Router();
const {bep20Approval,erc20Approval,campaign,pendingLink, campaigns, 
    launchCampaign,campaignPromp,launchBounty, totalEarned, 
    totalSpent,apply, linkNotifications,
    linkStats,increaseBudget, 
    getLinks,getFunds,gains , addKits,update, kits, saveCampaign, upload,
    validateCampaign} = require('../controllers/campaign.controller')
    const { verifyAuth} =require('../middleware/passport.middleware');
const { route } = require('./login.routes');

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


router.post('/launch/performance',verifyAuth,launchCampaign);


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

router.post('/launchBounty',verifyAuth,launchBounty);


/**
 * @swagger
 * /campaign/totalEarned:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get total earned
 *     description: return to user the total earned <br> without access_token 
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: {"SattEarned","USDEarned","subscriptions"}
 *       "500":
 *          description: error:"error"
 */


router.get('/totalEarned',verifyAuth,totalEarned);




/**
 * @swagger
 * /campaign/campaigns:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get total earned
 *     description: return to user the total earned <br> without access_token 
 *     produces:
 *       - application/json
 *     responses:
 *       "200":
 *          description: list:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


 router.get('/campaigns',verifyAuth,campaigns);



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
 *         description: the  id.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: list:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */
  router.get('/details/:id',campaign);




   /**
 * @swagger
 * /campaign/totalSpent:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign details
 *     description: return to user campaign detalds <br> with access_token 
 *     produces:
 *       - application/json


 *     responses:
 *       "200":
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


    router.get('/totalSpent',verifyAuth,totalSpent);






   /**
 * @swagger
 * /campaign/pendingLink/{id}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign pending link
 *     description: return to user the list of campaign with pending link <br> without access_token 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the  id.
 *         in: path
 *         required: true



 *     responses:
 *       "200":
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


    router.get('/pendingLink/:id',pendingLink);




   /**
 * @swagger
 * /campaign/campaignPrompAll/{id}:
 *   get:
 *     tags:
 *     - "campaign"
 *     summary: get campaign pending link
 *     description: return to user the list of campaign promp ALl <br> without access_token 
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         description: the  id.
 *         in: path
 *         required: true

 *     responses:
 *       "200":
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


    router.get('/campaignPrompAll/:id',verifyAuth,campaignPromp);




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
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */


router.post('/apply',verifyAuth,apply);


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
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */


         router.post('/linkNotification',linkNotifications);




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

 router.post('/validate',verifyAuth,validateCampaign);

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
 *               idCampaign:
 *                 type: string
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

   router.post('/gains', verifyAuth,gains);
 
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
 *                  id:
 *                      type: string              
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
 *                  id:
 *                      type: string  
 *               bounties:
 *                 type: array
 *                 items:
 *                  id:
 *                      type: string  
 * 
 *     responses:
 *       "200":
 *          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */

      router.post('/save', verifyAuth,saveCampaign);




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
*          description:[list of campaigns]
*       "500":
*          description: error:"error"
*/


       router.get('/:idCampaign/kits',verifyAuth,kits);




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

   router.post('/addKits',upload,addKits);







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
*               logo:
*                 type: string
*               countries:
*                 type: array
*                 items:
*                  id:
*                      type: string              
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
*                  id:
*                      type: string  
*               bounties:
*                 type: array
*                 items:
*                  id:
*                      type: string  
* 
*     responses:
*       "200":
*          description: err:gransaction has been reverted by the EVM<br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
*       "500":
*          description: error:error message
*/

   router.put('/update/:idCampaign', verifyAuth,update);
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
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */
     router.get('/prom/stats/:idProm',linkStats);


 	/**
 * @swagger
 * /campaign/funding:
 *   post:
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
     router.post('/funding',verifyAuth,increaseBudget);


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
     router.get('/filterLinks/:id_wallet',getLinks);

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
     router.post('/remaining',getFunds);



                /**
 * @swagger
 * /campaign/erc20/{token}/approval/{spender}/{addr}:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: erc20 aprroval
 *     description: erc20 aprroval
 *     parameters:
 *       - name: token
 *         description: the  token.
 *         in: path
 *         required: true
 *       - name: spender
 *         description: the  spender.
 *         in: path
 *         required: true
 *       - name: addr
 *         description: the  addr.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: data
 *       "500":
 *          description: error:"error"
 */

router.post('/erc20/:token/approval/:spender/:addr',erc20Approval);




/**
 * @swagger
 * /campaign/bep20/{token}/approval/{spender}/{addr}:
 *   post:
 *     tags:
 *     - "campaign"
 *     summary: bep20 aprroval
 *     description: bep20 aprroval
 *     parameters:
 *       - name: token
 *         description: the  token.
 *         in: path
 *         required: true
 *       - name: spender
 *         description: the  spender.
 *         in: path
 *         required: true
 *       - name: addr
 *         description: the  addr.
 *         in: path
 *         required: true
 *     responses:
 *       "200":
 *          description: data
 *       "500":
 *          description: error:"error"
 */
 router.post('/bep20/:token/approval/:spender/:addr',bep20Approval);
     
     
module.exports = router;

