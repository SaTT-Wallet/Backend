let express = require('express');
let router = express.Router();


const {captcha} = require('../controllers/login.controller')


router.get('/captcha',captcha)




module.exports = router;