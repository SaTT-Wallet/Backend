

let express = require('express');
let router = express.Router();
const {launchCampaign,launchBounty} = require('../controllers/campaign.controller')
/*
router.post('/launch/performance',launchCampaign);

router.post('/launch/bounty',launchBounty);
*/

module.exports = router;
