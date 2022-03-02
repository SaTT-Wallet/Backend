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
