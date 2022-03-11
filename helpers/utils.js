var express = require('express')
var app = express()
//const { config } = require('../conf/config1')

const path = require('path')
const i18n = require('i18n')
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const { responseHandler } = require('../helpers/response-handler')
const Big = require('big.js')

var fs = require('fs')

var nodemailer = require('nodemailer')
const hasha = require('hasha')
const jwt = require('jsonwebtoken')

const handlebars = require('handlebars')
var ejs = require('ejs')
var transporter = nodemailer.createTransport({
    host: process.env.MAILER_HOST,
    port: process.env.MAILER_PORT,
    secure: false,
    auth: {
        user: process.env.MAILER_USER,
        pass: process.env.MAILER_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
})

exports.readHTMLFileProfile = (
    path,
    event,
    body,
    ip,
    requestDate,
    code,
    newEmail
) => {
    readHTMLFile(path, async (err, html) => {
        var template = handlebars.compile(html)

        if (event === 'changeEmail') {
            var replacements = {
                ip,
                requestDate,
                satt_url: process.env.BASED_URL,
                back_url: process.env.BASEURL,
                satt_faq: process.env.SATT_FAQ,
                code,
                imgUrl: process.env.BASE_EMAIL_IMG_URL,
            }
            var htmlToSend = template(replacements)

            var mailOptions = {
                from: process.env.MAIL_SENDER,
                //to: user.email,
                to: newEmail.email,
                subject: 'Satt wallet change email',
                html: htmlToSend,
            }
        }

        if (event === 'contact_support') {
            let mailContent = {
                SaTT: {
                    Url: process.env.BASEURL + 'FAQ',
                },
                letter: {
                    from: body.name + ' (' + body.email + ')',
                    subject: body.subject,
                    message: body.message,
                },
            }
            let htmlToSend = ejs.render(html, mailContent)

            var mailOptions = {
                from: process.env.NOTIFICATION_MAIL,
                to: process.env.CONTACT_MAIL,
                subject: 'Customer service',
                html: htmlToSend,
            }
        }

        if (event === 'notification') {
            var mailContent = {
                SaTT: {
                    faq: process.env.SATT_FAQ,
                    imageUrl: process.env.BASE_EMAIL_IMG_URL,
                    Url: process.env.BASED_URL,
                },
                notification: {
                    name: body.name,
                    price: body.price,
                    cryptoCurrency: body.cryptoCurrency,
                    message: body.message,
                    wallet: body.wallet,
                },
            }

            var htmlToSend = template(mailContent)

            var mailOptions = {
                from: process.env.MAIL_SENDER,
                to: body.to,
                subject: 'Payment request',
                html: htmlToSend,
                attachments: [
                    {
                        filename: 'codeQr.jpg',
                        contentType: 'image/png',
                        content: new Buffer.from(
                            code.split('base64,')[1],
                            'base64'
                        ),
                    },
                ],
            }
        }

        await transporter.sendMail(mailOptions, (error, info) => {
            if (err) {
                return responseHandler.makeResponseError(
                    res,
                    500,
                    err.message ? err.message : err.error
                )            } else {
                res.end(JSON.stringify(info.response))
                res.end(JSON.stringify({ message: 'Email sent' }))
            }
        })
    })
}

exports.readHTMLFileLogin = (path, event, ip, requestDate, code, user) => {
    readHTMLFile(path, async (err, html) => {
        var template = handlebars.compile(html)

        if (event === 'codeRecover') {
            var replacements = {
                ip,
                code,
                requestDate,
                satt_url: process.env.BASED_URL,
                imgUrl: process.env.BASE_EMAIL_IMG_URL,
                satt_faq: process.env.SATT_FAQ,
            }
            var htmlToSend = template(replacements)
            var mailOptions = {
                from: process.env.RESET_PASSWORD_EMAIL,
                to: user.email,
                subject: 'Satt wallet password recover',
                html: htmlToSend,
            }
        }

        if (event === 'emailValidation') {
            var replacements = {
                satt_faq: process.env.SATT_FAQ,
                satt_url: process.env.BASED_URL,
                code,
                imgUrl: process.env.BASE_EMAIL_IMG_URL,
            }
            var htmlToSend = template(replacements)
            var mailOptions = {
                from: process.env.MAIL_SENDER,
                to: user.email.toLowerCase(),
                subject: 'Satt wallet activation',
                html: htmlToSend,
            }
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (err) {
 return responseHandler.makeResponseError(
            res,
            500,
            err.message ? err.message : err.error
        )             } 
        })
    })
}

exports.readHTMLFileCampaign = (
    path,
    event,
    title,
    email,
    idCampaign,
    reason,
    link
) => {
    readHTMLFile(path, async (err, html) => {
        var template = handlebars.compile(html)

        if (event === 'rejectLink') {
            var emailContent = {
                reject_reason: reason,
                cmp_link:
                    process.env.BASED_URL + '/myWallet/campaign/' + idCampaign,
                satt_faq: process.env.SATT_FAQ,
                satt_url: process.env.BASED_URL,
                cmp_title: title,
                imgUrl: process.env.BASE_EMAIL_IMG_URL,
            }
            var htmlToSend = template(emailContent)

            var mailOptions = {
                from: process.env.MAIL_SENDER,
                to: email,
                subject: 'Your link has been rejected in a campaign',
                html: htmlToSend,
            }
        }

        if (event === 'campaignValidation') {
            var emailContent = {
                cmp_link:
                    process.env.BASED_URL + '/myWallet/campaign/' + idCampaign,
                satt_faq: process.env.SATT_FAQ,
                satt_url: process.env.BASED_URL,
                cmp_title: title,
                imgUrl: process.env.BASE_EMAIL_IMG_URL,
            }
            var htmlToSend = template(emailContent)

            var mailOptions = {
                from: process.env.MAIL_SENDER,
                to: email,
                subject: 'Your link has been accepted in a campaign',
                html: htmlToSend,
            }
        }

        if (event === 'linkNotifications') {
            let emailContent = {
                cmp_name: title,
                cmp_link: link,
                cmp_imgUrl: process.env.BASE_EMAIL_IMG_URL,
                cmp_satt_faq: process.env.SATT_FAQ,
            }
            let htmlToSend = template(emailContent)

            var mailOptions = {
                from: process.env.MAIL_SENDER,
                to: email,
                subject: 'New link was added To your campaign',
                html: htmlToSend,
            }
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (err) {
                return responseHandler.makeResponseError(
                    res,
                    500,
                    err.message ? err.message : err.error
                )               } else {
                console.log(info.response)
            }
        })
    })
}

const readHTMLFile = (path, callback) => {
    fs.readFile(path, { encoding: 'utf-8' }, function (err, html) {
        if (err) {
            console.log(err)
            throw err
            callback(err)
        } else {
            callback(null, html)
        }
    })
}

exports.synfonyHash = function (pass) {
    var salted = pass + '{' + process.env.SYMPHONY_SATT + '}'

    var buff = hasha(salted, { encoding: 'buffer' })
    var saltBuff = Buffer.from(salted)
    var arr = []

    for (var i = 1; i < 5000; i++) {
        arr = [buff, saltBuff]
        buff = hasha(Buffer.concat(arr), {
            algorithm: 'sha512',
            encoding: 'buffer',
        })
    }

    const base64 = buff.toString('base64')
    return base64
}

exports.configureTranslation = function (lang) {
    try {
        app.use(i18n.init)

        i18n.configure({
            locales: ['fr', 'en'],
            directory: path.join(__dirname, '../public/locales'),
            defaultLocale: lang,
            queryParameter: 'lang',
            cookiename: 'language',
        })
        handlebars.registerHelper('__', function () {
            return i18n.__.apply(this, arguments)
        })
        handlebars.registerHelper('__n', function () {
            return i18n.__n.apply(this, arguments)
        })
    } catch (error) {
        console.log(error)
    }
}

exports.cloneUser = (user) => {
    const {
        daily,
        weekly,
        monthly,
        failed_count,
        account_locked,
        created,
        updated,
        confirmation_token,
        ...newUser
    } = user
    return newUser
}

//global function that generates user acessToken
exports.generateAccessToken = (user) =>
    jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '24h' })
