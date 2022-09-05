const qrcode = require('qrcode')
const speakeasy = require('speakeasy')
const mongoose = require('mongoose')
const validator = require('validator')

const { Captcha, UserArchived, User, Wallet } = require('../model/index')

const { responseHandler } = require('../helpers/response-handler')
const { createUser } = require('../middleware/passport.middleware')
const {
    synfonyHash,
    readHTMLFileLogin,
    configureTranslation,
    cloneUser,
    generateAccessToken,
} = require('../helpers/utils')

const {
    differenceBetweenDates,
    manageTime,
    updateAndGenerateCode,
} = require('../manager/accounts.js')

const { loginSettings } = require('../conf/config')
const maxAttempts = 3
exports.changePassword = async (req, res) => {
    try {
        var newpass = req.body.newpass
        var oldpass = req.body.oldpass
        var _id = req.user._id
        var user = await User.findOne({ _id })
        if (user) {
            if (user.password != synfonyHash(oldpass)) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'wrong password'
                )
            } else {
                await User.updateOne(
                    { _id },
                    { $set: { password: synfonyHash(newpass) } }
                )
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'changed',
                    true
                )
            }
        } else {
            return responseHandler.makeResponseError(res, 204, 'no account')
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
exports.captcha = async (req, res) => {
    try {
        let count = await Captcha.countDocuments()
        let random = Math.floor(Math.random() * count)
        let captcha = await Captcha.findOne().limit(1).skip(random)
        return responseHandler.makeResponseData(res, 200, 'success', captcha)
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.verifyCaptcha = async (req, res) => {
    try {
        let _id = req.body._id
        let position = +req.body.position

        if (!mongoose.Types.ObjectId.isValid(_id)) {
            return responseHandler.makeResponseError(
                res,
                400,
                'Please provide a valid id!'
            )
        }
        let captcha = await Captcha.findOne({
            $and: [
                { _id },
                { position: { $gte: position - 5, $lte: position + 5 } },
            ],
        })
        if (captcha) {
            return responseHandler.makeResponseData(
                res,
                200,
                'success',
                captcha
            )
        } else {
            return responseHandler.makeResponseError(
                res,
                401,
                'wrong captcha',
                false
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.walletConnection = async (req, res) => {
    const address = req.body.address
    try {
        var date = Math.floor(Date.now() / 1000) + 86400
        var user = await Wallet.findOne({
            'keystore.address': address,
        }).select('UserId')
        if (user) {
            let userAuth = cloneUser(user.toObject())
            let token = generateAccessToken(userAuth)

            var param = {
                access_token: token,
                expires_in: date,
                token_type: 'bearer',
                scope: 'user',
            }

            return responseHandler.makeResponseData(res, 200, 'success', param)
        } else {
            return responseHandler.makeResponseError(res, 401, {
                error: true,
                message: 'user not found',
            })
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.codeRecover = async (req, res) => {
    const validateEmail = /\S+@\S+\.\S+/

    if (!validateEmail.test(req.body.mail.toLowerCase())) {
        return responseHandler.makeResponseError(
            res,
            400,
            'please enter a valid email address!'
        )
    }
    try {
        let dateNow = Math.floor(Date.now() / 1000)
        let lang = req.body.lang || 'en'
        configureTranslation(lang)
        let email = req.body.mail.toLowerCase()
        let user = await User.findOne({ email })

        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'account not exists',
                false
            )
        }
        if (
            user.account_locked &&
            differenceBetweenDates(user.date_locked, dateNow) <
                loginSettings.lockedPeriod
        ) {
            return responseHandler.makeResponseError(
                res,
                401,
                'account_locked',
                { blockedDate: user.date_locked }
            )
        }

        let requestDate = manageTime()
        let ip =
            req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
        // if (ip) ip = ip.split(':')[3]

        let code = await updateAndGenerateCode(user._id, 'reset')

        readHTMLFileLogin(
            __dirname + '/../public/emails/reset_password_code.html',
            'codeRecover',
            ip,
            requestDate,
            code,
            user
        )
        return responseHandler.makeResponseData(
            res,
            200,
            'Email was sent to ' + user.email,
            user.email
        )
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.confirmCode = async (req, res) => {
    try {
        let [email, code] = [req.body.email.toLowerCase(), req.body.code]
        let user = await User.findOne({ email }, { secureCode: 1 })
        let dateNow = Math.floor(Date.now() / 1000)
        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'user not found',
                false
            )
        } else {
            if (
                differenceBetweenDates(user.secureCode.lastTry, dateNow) >
                    loginSettings.lockedPeriod ||
                !user.secureCode.lastTry
            ) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { 'secureCode.attempts': 0 } }
                )
                    .then((data) => {
                        user.secureCode.attempts = 0
                    })
                    .catch((err) => {
                        console.log('eee', err)
                    })
            }
            if (user.secureCode.attempts >= maxAttempts) {
                return responseHandler.makeResponseError(
                    res,
                    429,
                    'Too Many Attempts',
                    false
                )
            } else if (user.secureCode.code != code) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { 'secureCode.lastTry': dateNow } }
                )
                user.secureCode.attempts++
                User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            'secureCode.attempts': user.secureCode.attempts,
                        },
                    }
                )
                    .then((data) => {
                        return responseHandler.makeResponseError(
                            res,
                            401,
                            'wrong code',
                            false
                        )
                    })
                    .catch((err) => {
                        console.log('eee', err)
                    })
            } else if (Date.now() >= user.secureCode.expiring)
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'code expired',
                    false
                )
            else if (user.secureCode.code == req.body.code) {
                let authMethod = { message: 'code is matched' }
                let date = Math.floor(Date.now() / 1000) + 86400
                let userAuth = cloneUser(user)
                let token = generateAccessToken(userAuth)
                ;(authMethod.token = token),
                    (authMethod.expires_in = date),
                    (authMethod.idUser = user._id)
                await User.updateOne(
                    { _id: user._id },
                    { $set: { enabled: 1 } }
                )
                user.secureCode.attempts = 0
                return responseHandler.makeResponseData(
                    res,
                    200,
                    authMethod.message,
                    true
                )
            }
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.passRecover = async (req, res) => {
    try {
        let newpass = req.body.newpass
        let email = req.body.email
        let code = Number(req.body.code)
        let dateNow = Math.floor(Date.now() / 1000)
        let user = await User.findOne({ email }, { secureCode: 1 })

        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'user not found',
                false
            )
        } else {
            if (
                differenceBetweenDates(user.secureCode.lastTry, dateNow) >
                    loginSettings.lockedPeriod ||
                !user.secureCode.lastTry
            ) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { 'secureCode.attempts': 0 } }
                )
                    .then((data) => {
                        user.secureCode.attempts = 0
                    })
                    .catch((err) => {
                        console.log('eee', err)
                    })
            }
            if (user.secureCode.attempts >= maxAttempts) {
                return responseHandler.makeResponseError(
                    res,
                    429,
                    'Too Many Attempts',
                    false
                )
            } else if (
                !isNaN(user.secureCode.code) &&
                !isNaN(code) &&
                user.secureCode.code === code
            ) {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { password: synfonyHash(newpass), enabled: 1 } }
                )
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'successfully',
                    true
                )
            } else if (Date.now() >= user.secureCode.expiring)
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'code expired',
                    false
                )
            else {
                await User.updateOne(
                    { _id: user._id },
                    { $set: { 'secureCode.lastTry': dateNow } }
                )
                user.secureCode.attempts++
                User.updateOne(
                    { _id: user._id },
                    {
                        $set: {
                            'secureCode.attempts': user.secureCode.attempts,
                        },
                    }
                )
                    .then((data) => {
                        return responseHandler.makeResponseError(
                            res,
                            401,
                            'wrong code',
                            false
                        )
                    })
                    .catch((err) => {
                        console.log('eee', err)
                    })
            }
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.resendConfirmationToken = async (req, res) => {
    try {
        let email = req.body.email
        let user = await User.findOne({ email: email }, { email: 1 })
        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'user not found',
                false
            )
        } else {
            let code = await updateAndGenerateCode(user._id, 'validation')
            let lang = req.body.lang || 'en'
            configureTranslation(lang)
            readHTMLFileLogin(
                __dirname +
                    '/../public/emailtemplate/email_validated_code.html',
                'emailValidation',
                null,
                null,
                code,
                user
            )
            return responseHandler.makeResponseData(
                res,
                200,
                'Email sent',
                true
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.getToken = async (req, res) => {
    try {
        let _id = +req.params.id
        var date = Math.floor(Date.now() / 1000) + 86400
        console.log(_id)
        var user = await User.findOne({ _id })
        let userAuth = cloneUser(user.toObject())
        let token = generateAccessToken(userAuth)
        res.send({
            id: user._id,
            token,
            expires_in: date,
            noredirect: req.body.noredirect,
        })
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.saveFirebaseAccessToken = async (req, res) => {
    try {
        let data = req.body

        let fireBase =
            req.query.fireBase === 'mobile'
                ? 'fireBaseAccessTokenMObile'
                : 'fireBaseAccessToken'
        await User.updateOne(
            { _id: req.user._id },
            { $set: { [fireBase]: data.fb_accesstoken } }
        )
        return responseHandler.makeResponseData(res, 200, 'success', true)
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.updateLastStep = async (req, res) => {
    try {
        let _id = req.user._id
        let profile = req.body
        let password = Math.random().toString(36).slice(-8)
        let user = await User.findOne({ email: profile.email })
        if (user && user._id !== _id) {
            return responseHandler.makeResponseError(
                res,
                401,
                'email already exists'
            )
        } else if (user && user._id === _id) {
            await User.updateOne(
                { _id },
                {
                    $set: {
                        email: profile.email,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        enabled: 0,
                        completed: true,
                        password: synfonyHash(password),
                    },
                }
            )
            return responseHandler.makeResponseData(
                res,
                200,
                'updated successfully with same email',
                true
            )
        } else {
            await User.updateOne(
                { _id },
                {
                    $set: {
                        email: profile.email,
                        firstName: profile.firstName,
                        lastName: profile.lastName,
                        isChanged: true,
                        enabled: 0,
                        completed: true,
                        password: synfonyHash(password),
                    },
                }
            )
            return responseHandler.makeResponseData(
                res,
                200,
                'updated successfully',
                true
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.purgeAccount = async (req, res) => {
    try {
        let password = req.body.password
        let reason = req.body.reason
        if (req.user.password === synfonyHash(password)) {
            let user = req.user.toObject()
            if (reason) user.reason = reason
            await UserArchived.create(user)
            await User.deleteOne({ _id: req.user._id })
            return responseHandler.makeResponseData(
                res,
                200,
                'account deleted',
                true
            )
        } else
            return responseHandler.makeResponseError(
                res,
                401,
                'wrong password',
                false
            )
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.authApple = async (req, res) => {
    try {
        let date = Math.floor(Date.now() / 1000) + 86400
        let email = req.body.mail
        let id_apple = req.body.id_apple
        let idSn = req.body.idSN
        let name = req.body.name

        let user = await User.findOne({ id_apple })
        if (user) {
            let userAuth = cloneUser(user)
            let token = generateAccessToken(userAuth)
            if (user.idSn === idSn) {
                let param = {
                    access_token: token,
                    expires_in: date,
                    token_type: 'bearer',
                    scope: 'user',
                }
                return responseHandler.makeResponseData(
                    res,
                    200,
                    'success',
                    param
                )
            } else {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'account_exists_with_another_courrier',
                    false
                )
            }
        } else {
            let createdUser = createUser(
                0,
                idSn,
                true,
                false,
                name,
                email,
                '',
                '',
                '',
                ''
            )
            createdUser.id_apple = id_apple
            let user = await User.create(createdUser)
            createdUser._id = user._id
            let token = generateAccessToken(createdUser)
            let param = {
                access_token: token,
                expires_in: date,
                token_type: 'bearer',
                scope: 'user',
            }
            return responseHandler.makeResponseData(res, 200, 'success', param)
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.socialSignUp = async (req, res) => {
    try {
        let snUser = createUser(
            0,
            +req.body.idSn,
            req.body.lang,
            true,
            req.body.photo,
            req.body.name,
            req.body.email,
            null,
            null,
            req.body.givenName,
            req.body.familyName
        )
        let socialField = req.body.idSn === 1 ? 'idOnSn' : 'idOnSn2'
        snUser[socialField] = req.body.id
        let user = await User.findOne({ [socialField]: req.body.id })

        if (user) {
            return responseHandler.makeResponseError(
                res,
                401,
                'account_exists',
                false
            )
        } else {
            let date = Math.floor(Date.now() / 1000) + 86400
            let user = User.create(snUser)
            snUser._id = user._id
            let token = generateAccessToken(snUser)
            let param = {
                access_token: token,
                expires_in: date,
                token_type: 'bearer',
                scope: 'user',
            }
            return responseHandler.makeResponseData(res, 200, 'success', param)
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.socialSignin = async (req, res) => {
    try {
        if (req.body.idSn !== 1 && req.body.idSn !== 2)
            return responseHandler.makeResponseError(
                res,
                401,
                'invalid idSn',
                false
            )
        let socialField = req.body.idSn === 1 ? 'idOnSn' : 'idOnSn2'
        let user = await User.findOne({ [socialField]: req.body.id })
        if (user) {
            let date = Math.floor(Date.now() / 1000) + 86400
            let userAuth = cloneUser(user)
            let token = generateAccessToken(userAuth)
            let param = {
                access_token: token,
                expires_in: date,
                token_type: 'bearer',
                scope: 'user',
            }
            return responseHandler.makeResponseData(res, 200, 'success', param)
        } else {
            return responseHandler.makeResponseError(
                res,
                401,
                'account_doesnt_exist',
                false
            )
        }
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

module.exports.getQrCode = async (req, res) => {
    try {
        let id = req.user._id
        let secret = speakeasy.generateSecret({
            name: 'SaTT_Token ' + id,
        })
        await User.updateOne({ _id: id }, { $set: { secret: secret.ascii } })
        qrcode.toDataURL(secret.otpauth_url, (err, data) => {
            return responseHandler.makeResponseData(res, 200, 'success', {
                qrCode: data,
                secret: secret.base32,
                googleAuthName: `SaTT_Token ${id}`,
            })
        })
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

module.exports.verifyQrCode = async (req, res) => {
    try {
        let _id = req.user._id
        let user = await User.findOne({ _id })
        let secret = user.secret
        let code = req.body.code
        let verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'ascii',
            token: code,
        })
        let data = { verifiedCode: verified }
        return responseHandler.makeResponseData(res, 200, 'success', data)
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.socialdisconnect = async (req, res) => {
    try {
        let _id = req.user._id
        let social = req.params.social
        let socialField = {
            telegram: 'idOnSn3',
            facebook: 'idOnSn',
            google: 'idOnSn2',
        }
        let queryField = socialField[social]
        await User.updateOne({ _id }, { $set: { [queryField]: null } })
        return responseHandler.makeResponseData(
            res,
            200,
            `deconnect successfully from ${social}`,
            false
        )
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.logout = async (req, res) => {
    try {
        let _id = req.user._id
        await User.updateOne({ _id }, { $set: { fireBaseAccessToken: null } })
        return responseHandler.makeResponseData(res, 200, 'success', false)
    } catch (err) {
        console.log(err.message)

        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.sattConnect = async (req, res) => {
    const address = req.body.address
    const password = req.body.password
    try {
        const user = await User.findOne({ address })
        if (user) {
            let userAuth = cloneUser(user.toObject())
            let token = generateAccessToken(userAuth)

            var param = {
                access_token: token,
                expires_in: date,
                token_type: 'bearer',
                scope: 'user',
            }

            return responseHandler.makeResponseData(res, 200, 'success', param)
        } else {
            return responseHandler.makeResponseError(res, 401, {
                error: true,
                message: 'user not found',
            })
        }
    } catch (err) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

exports.setVisitSignUpStep = async (req, res, next) => {
    try {
        const userId = req.body.userId
        const visitedStep = req.body.visitedStep

        const user = await User.findOne({ _id: userId })
        if (!user) {
            return responseHandler.makeResponseError(
                res,
                204,
                'account not exists',
                false
            )
        }
        await User.updateOne(
            { _id: userId },
            { $set: { ['visited-' + visitedStep]: true } }
        )

        return responseHandler.makeResponseData(res, 200, 'success', true)
    } catch (error) {
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error,
            false
        )
    }
}

module.exports.signupRequest = async (req, res) => {
    const { email } = req.body

    try {
        if (!validator.isEmail(email)) {
            return responseHandler.makeResponseError(
                res,
                400,
                'please provide a valid email address!'
            )
        } else {
            // const existUser = await User.findOne({ email })
            // if (existUser) {
            //     return responseHandler.makeResponseError(
            //         res,
            //         406,
            //         'Account already exist'
            //     )
            // } else {
            readHTMLFileLogin(
                __dirname + '/../public/emails/signup.html',
                'signup',
                req.body
            )
            return responseHandler.makeResponseData(res, 200, 'Email was sent')
            // }
        }
    } catch (err) {
        // console.log('error', err.message)
        return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )
    }
}
