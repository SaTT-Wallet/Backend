const { Notification, User } = require('../model/index')

const { sendNotification } = require('./notification')

exports.notificationManager = async (id, NotifType, label) => {
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

    let user = await User.findOne({ _id: +id }).select('fireBaseAccessToken ')

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
