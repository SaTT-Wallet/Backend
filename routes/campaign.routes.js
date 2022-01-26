let express = require('express');
let router = express.Router();
const {campaign,pendingLink, campaigns, 
    launchCampaign,campaignPromp,launchBounty, totalEarned, 
    totalSpent,apply, linkNotifications, 
    validateCampaign,gains , addKits,update, kits, saveCampaign, upload} = require('../controllers/campaign.controller')
    const { verifyAuth} =require('../middleware/passport.middleware');

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
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


 router.get('/campaigns',verifyAuth,campaigns);



 /**
 * @swagger
 * /campaign/CampaignDetailds/{id}:
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
 *          description:[list of campaigns]
 *       "500":
 *          description: error:"error"
 */


  router.get('/CampaignDetailds/:id',campaign);




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
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               campaign:
 *                 type: string
 *               files:
 *                 type: string
 *                 format : binary
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
 * /campaign/update:
 *   put:
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


module.exports = router;

