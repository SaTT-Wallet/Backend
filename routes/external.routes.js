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
    externalUploadPictureToIPFS,
    campaignsPictureUploadExternal,
    externalAddKits,
    uploadExternal,
    externalGetLinks,
    externalGetOneLinks,
    externalApply,
    checkHarvest,
    externalAnswer,
    externalGains,
    campaigns,
    getBalanceUserExternal,
    externalDeleteDraft,
} = require('../controllers/external.controller')
const { verifyAuthExternal } = require('../middleware/passport.middleware')
const {
    verifySignatureMiddleware,
    idCheckValidation,
    addKitsValidation,
    externalGainsValidation,
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
const upload = multer({ storage: storage })

router.post('/create-user', createUserFromExternalWallet)
router.get('/campaigns', campaigns)
router.post('/getBalance', getBalanceUserExternal)
router.post('/createCampaign', verifyAuthExternal, externalSaveCampaign)
// DONE
router.get('/socialAccounts', verifyAuthExternal, externalSocialAccounts)
router.post(
    '/campaign/filterLinksExternal',
    verifyAuthExternal,
    externalGetLinks
)

router.delete(
    '/deleteDraft/:id',
    verifyAuthExternal,
    idCheckValidation,
    externalDeleteDraft
)
router.post(
    '/campaign/getLinksExternal',
    verifyAuthExternal,
    externalGetOneLinks
)

// DONE

router.get('/verify-token', verifyAuthExternal, externalVerifyExpiredToken)
router.get('/externalAccount', verifyAuthExternal, externalAccount)

// DONE
router.delete(
    '/RemoveTiktokChannel/:id',
    verifyAuthExternal,
    externalDeleteTiktokChannel
)

router.delete(
    '/RemoveTiktokChannels',
    verifyAuthExternal,
    externalDeleteTiktokChannels
)

router.delete(
    '/RemoveGoogleChannel/:id',
    verifyAuthExternal,
    externalDeleteGoogleChannel
)

router.delete(
    '/RemoveGoogleChannels',
    verifyAuthExternal,
    externalDeleteGoogleChannels
)

router.delete(
    '/RemoveFacebookChannels',
    verifyAuthExternal,
    externalDeleteFacebookChannels
)

router.delete(
    '/RemoveFacebookChannel/:id',
    verifyAuthExternal,
    externalDeleteFacebookChannel
)

router.delete(
    '/RemoveLinkedInChannels',
    verifyAuthExternal,
    externalDeleteLinkedinChannels
)

router.delete(
    '/remove/:linkedinId/linkedInChannel/:organization',
    verifyAuthExternal,
    externalDeleteLinkedinChannel
)

router.delete(
    '/RemoveTwitterChannels',
    verifyAuthExternal,
    externalDeleteTwitterChannels
)

router.delete(
    '/RemoveTwitterChannel/:id',
    verifyAuthExternal,
    externalDeleteTwitterChannel
)

router.get(
    '/link/verify/:typeSN/:idUser/:idPost',
    verifyAuthExternal,
    externalVerifyLink
)

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

router.post('/apply', verifyAuthExternal, externalApply)

router.post('/checkHarvest', verifySignatureMiddleware, checkHarvest)

router.post('/externalAnswer', verifySignatureMiddleware, externalAnswer)
router.post('/externalGains', verifySignatureMiddleware, externalGains)

module.exports = router
