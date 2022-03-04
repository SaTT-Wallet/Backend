const { Notification, User } = require('../model/index')

const { sendNotification } = require('./notification')

var rp = require('request-promise')

const { token200 } = require('../conf/config1')

exports.notificationManager = async (id, NotifType, label) => {
    try {
        let notification = {
            idNode: '0' + id,
            type: NotifType,
            status: 'done',
            label,
            isSeen: false,
            isSend: false,
            attachedEls: {
                id: id,
            },
            created: new Date(),
        }

        await Notification.create(notification)

        let user = await User.findOne({ _id: +id }).select(
            'fireBaseAccessToken '
        )

        if (user.fireBaseAccessToken) {
            let data = {
                message: {
                    token: user.fireBaseAccessToken,
                    data: {
                        obj: JSON.stringify(notification),
                    },
                },
            }
            await sendNotification(data)
        }
    } catch (error) {
        console.log('--------errrrr', error)
    }
}

exports.manageTime = () => {
    var d = new Date()
    var date = d.getDate()
    var month = d.getMonth() + 1
    var year = d.getFullYear()
    var seconds = d.getSeconds()
    var minutes = d.getMinutes()
    var hour = d.getHours()
    return year + '-' + month + '-' + ' ' + hour + ':' + minutes + ':' + seconds
}

exports.differenceBetweenDates = (authDate, dateNow) => {
    return Math.ceil(Math.abs(dateNow * 1000 - authDate * 1000) / 60000)
}

exports.updateAndGenerateCode = async (_id, type) => {
    try {
        const code = Math.floor(100000 + Math.random() * 900000)
        let secureCode = {}
        ;(secureCode.code = code),
            (secureCode.expiring = Date.now() + 3600 * 20 * 5),
            (secureCode.type = type)
        await User.updateOne({ _id }, { $set: { secureCode } })
        return code
    } catch (e) {
        reject({ message: e.message })
    }
}

exports.isBlocked = async (user, auth = false) => {
    let dateNow = Math.floor(Date.now() / 1000)
    var res = false
    let logBlock = {}
    if (auth) {
        if (user.account_locked) {
            if (
                this.differenceBetweenDates(user.date_locked, dateNow) <
                process.env.lockedPeriod
            ) {
                logBlock.date_locked = dateNow
                logBlock.failed_count = 0
                res = true
            } else {
                logBlock.failed_count = 0
                logBlock.account_locked = false
                res = false
            }
        }
    } else {
        let failed_count = user.failed_count ? user.failed_count + 1 : 1
        logBlock.failed_count = failed_count
        if (failed_count == 1) logBlock.dateFirstAttempt = dateNow
        if (user.account_locked) {
            logBlock.date_locked = dateNow
            logBlock.failed_count = 0
            res = true
        } else if (
            !user.account_locked &&
            failed_count >= process.env.bad_login_limit &&
            accountManager.differenceBetweenDates(
                user.dateFirstAttempt,
                dateNow
            ) < process.env.failInterval
        ) {
            logBlock.account_locked = true
            logBlock.failed_count = 0
            logBlock.date_locked = dateNow
            res = true
        } else if (failed_count >= process.env.bad_login_limit)
            logBlock.failed_count = 1
    }
    if (Object.keys(logBlock).length)
        await User.updateOne({ _id: user._id }, { $set: logBlock })

    return { res, blockedDate: dateNow, auth }
}
