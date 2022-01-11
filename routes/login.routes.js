let express = require('express');
let router = express.Router();


const {captcha,verifyCaptcha} = require('../controllers/login.controller')

/**
 * @swagger
 * /auth/captcha:
 *   get:
 *     tags:
 *     - "auth"
 *     description: get random captcha
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description:_id,puzzle,position,originalImage
 */
    router.get('/captcha',captcha)


/**
 * @swagger
 * /auth/verifyCaptcha:
 *   post:
 *     tags:
 *     - "auth"
 *     description: verify if valid captcha
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: _id
 *         description: the Id of captcha.
 *       - name: position
 *         description: the position of puzzle.
 *     responses:
 *       200:
 *         description:_id,puzzle,position,originalImage
 */
 router.post('/verifyCaptcha',verifyCaptcha)

module.exports = router;