const express = require('express')
const router = express.Router()

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
    externalDeleteTwitterChannel,
    externalVerifyLink,
    externalSaveCampaign,
    externalVerifyExpiredToken,
    externalAccount,
    externalUpdate,
    externalUploadPictureToIPFS,
    campaignsPictureUploadExternal,
    externalAddKits,
    uploadExternal,
    externalGetLinks,
    externalApply
} = require('../controllers/external.controller');

const {
    verifySignatureMiddleware,
    idCheckValidation,
    addKitsValidation,
} = require('./../middleware/verifySignature.middleware')
const multer = require('multer')

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Uploads directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    },
})
const upload = multer({ storage: storage });
router.use(verifySignatureMiddleware);

router.post('/create-user', createUserFromExternalWallet)

router.post('/createCampaign', verifySignatureMiddleware, externalSaveCampaign)
// DONE
router.get('/socialAccounts', verifySignatureMiddleware , externalSocialAccounts)
router.post('/campaign/filterLinksExternal', verifySignatureMiddleware , externalGetLinks)


// DONE
router.get('/socialAccounts', verifySignatureMiddleware, externalSocialAccounts)
router.get(
    '/verify-token',
    verifySignatureMiddleware,
    externalVerifyExpiredToken
)
router.get('/externalAccount', verifySignatureMiddleware, externalAccount)

// DONE
router.delete(
    '/RemoveTiktokChannel/:id',
    verifySignatureMiddleware,
    externalDeleteTiktokChannel
)

router.delete(
    '/RemoveTiktokChannels',
    verifySignatureMiddleware,
    externalDeleteTiktokChannels
)

router.delete(
    '/RemoveGoogleChannel/:id',
    verifySignatureMiddleware,
    externalDeleteGoogleChannel
)

router.delete(
    '/RemoveGoogleChannels',
    verifySignatureMiddleware,
    externalDeleteGoogleChannels
)

router.delete(
    '/RemoveFacebookChannels',
    verifySignatureMiddleware,
    externalDeleteFacebookChannels
)

router.delete(
    '/RemoveFacebookChannel/:id',
    verifySignatureMiddleware,
    externalDeleteFacebookChannel
)

router.delete(
    '/RemoveLinkedInChannels',
    verifySignatureMiddleware,
    externalDeleteLinkedinChannels
)

router.delete(
    '/remove/:linkedinId/linkedInChannel/:organization',
    verifySignatureMiddleware,
    externalDeleteLinkedinChannel
)

router.delete(
    '/RemoveTwitterChannels',
    verifySignatureMiddleware,
    externalDeleteTwitterChannels
)

router.delete(
    '/RemoveTwitterChannel/:id',
    verifySignatureMiddleware,
    externalDeleteTwitterChannel
)

router.get(
    '/link/verify/:typeSN/:idUser/:idPost',
    verifySignatureMiddleware,
    externalVerifyLink
)

router.put('/externalUpdate/:id', verifySignatureMiddleware, externalUpdate)

// Example:
router.post(
    '/externalUploadPictureToIPFS/:id',
    idCheckValidation,
    campaignsPictureUploadExternal,
    externalUploadPictureToIPFS
)

router.post(
    '/externalAddKits',
    addKitsValidation,
    upload.single('file'),
    externalAddKits
)

module.exports = router

router.delete('/RemoveTwitterChannels', verifySignatureMiddleware, externalDeleteTwitterChannels)


router.delete('/RemoveTwitterChannel/:id', verifySignatureMiddleware, externalDeleteTwitterChannel)


router.get('/link/verify/:typeSN/:idUser/:idPost', verifySignatureMiddleware, externalVerifyLink)


router.post('/apply', verifySignatureMiddleware,externalApply)

module.exports = router;
