let express = require('express');
let router = express.Router();

const {deleteLinkedinChannels, deleteFacebookChannels, deleteGoogleChannels,account,
    profilePicture,updateProfile, UserLegalProfile } = require('../controllers/profile.controller')


 /**
 * @swagger
 * /profile/account:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get account details.
 *     description: get account details.
 *     responses:
 *       "200":
 *          description: user:{_id,idOnSn2,email,username...} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */
router.get('/account', account)

 /**
 * @swagger
 * /profile/picture:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get user profile.
 *     description: return to user his picture.  <br> without access_token
 *     responses:
 *       "200":
 *          description: user:{picture} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.get('/picture', profilePicture)


 	/**
 * @swagger
 * /profile/UpdateProfile:
 *   put:
 *     tags:
 *     - "profile"
 *     summary: update profile infos.
 *     description: user can update his profile infos <br> with access_token.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:      # Request body contents
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *               birthday:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               gender:
 *                 type: string
 *               locale:
 *                 type: string
 *               phone:
 *                 type: object
 *                 properties:
 *                    countryCode:
 *                      type: string
 *                    dialCode:
 *                      type: string
 *                    e164Number:
 *                      type: string
 *                    internationalNumber:
 *                      type: string
 *                    nationalNumber:
 *                       type: string
 *                    number:
 *                       type: string
 *                    zipCode:
 *                      type: string
 *                      
 *     responses:
 *       "200":
 *          description: err:email already exists, <br> data:{"transactionHash":"hash","address":"your address","to":"reciever address","amount":"amount"}
 *       "500":
 *          description: error:error message
 */
  router.put('/UpdateProfile', updateProfile)



   /**
 * @swagger
 * /profile/UserLegal:
 *   get:
 *     tags:
 *     - "profile"
 *     summary: get user legal profile.
 *     description: return to user the legals picture.  <br> with access_token
 *     responses:
 *       "200":
 *          description: legal:[{_id,length,chunkSize, uploadDate,filename,md5,contentType,DataUser:{$ref,$id,$db},idNode,type,validate}] <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.get('/UserLegal', UserLegalProfile)


   /**
 * @swagger
 * /profile/RemoveGoogleChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove google channels.
 *     description: allow user to delete all his google channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


router.delete('/RemoveGoogleChannels', deleteGoogleChannels)

   /**
 * @swagger
 * /profile/RemoveFacebookChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove facebook channels.
 *     description: allow user to delete all his facebook channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


    router.delete('/RemoveFacebookChannels', deleteFacebookChannels)

       /**
 * @swagger
 * /profile/RemoveLinkedInChannels:
 *   delete:
 *     tags:
 *     - "profile"
 *     summary: remove linkedin channels.
 *     description: allow user to delete all his linkedin channels.  <br> without access_token
 *     responses:
 *       "200":
 *          description: message:{deleted successfully} <br> Invalid Access Token <br> error:user not found <br> error:AC_Token expired
 *       "500":
 *          description: error:error message
 */


        router.delete('/RemoveLinkedInChannels', deleteLinkedinChannels)




 

module.exports = router;