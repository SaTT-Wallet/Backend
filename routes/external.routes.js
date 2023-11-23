const express = require('express');
const router = express.Router();

const {
    createUserFromExternalWallet, 
    externalSocialAccounts,
    externalDeleteTiktokChannel,
    externalDeleteTiktokChannels,
    externalDeleteGoogleChannel,
    externalDeleteGoogleChannels,
    externalDeleteFacebookChannels,
    externalDeleteFacebookChannel,
    externalDeleteLinkedinChannels,
    externalDeleteLinkedinChannel,
    externalDeleteTwitterChannels,
    externalDeleteTwitterChannel
} = require('../controllers/external.controller');

const verifySignatureMiddleware = require('./../middleware/verifySignature.middleware')



// DONE
router.post('/create-user', createUserFromExternalWallet)

// DONE
router.get('/socialAccounts', verifySignatureMiddleware , externalSocialAccounts)

// DONE
router.delete('/RemoveTiktokChannel/:id', verifySignatureMiddleware, externalDeleteTiktokChannel)


router.delete('/RemoveTiktokChannels', verifySignatureMiddleware, externalDeleteTiktokChannels)


router.delete('/RemoveGoogleChannel/:id', verifySignatureMiddleware, externalDeleteGoogleChannel)


router.delete('/RemoveGoogleChannels', verifySignatureMiddleware, externalDeleteGoogleChannels)


router.delete('/RemoveFacebookChannels', verifySignatureMiddleware, externalDeleteFacebookChannels)


router.delete('/RemoveFacebookChannel/:id', verifySignatureMiddleware, externalDeleteFacebookChannel)


router.delete('/RemoveLinkedInChannels', verifySignatureMiddleware, externalDeleteLinkedinChannels)


router.delete('/remove/:linkedinId/linkedInChannel/:organization', verifySignatureMiddleware, externalDeleteLinkedinChannel)


router.delete('/RemoveTwitterChannels', verifySignatureMiddleware, externalDeleteTwitterChannels)


router.delete('/RemoveTwitterChannel/:id', verifySignatureMiddleware, externalDeleteTwitterChannel)



module.exports = router;