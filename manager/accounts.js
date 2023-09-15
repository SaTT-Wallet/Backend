const { Notification, User } = require('../model/index')

const { sendNotification } = require('./notification')

const { Tokens } = require('../conf/config')

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

        const notif = await Notification.create(notification)
        console.log({notif})
        let user = await User.findOne({ _id: +id }).select(
            'fireBaseAccessToken '
        )
        console.log({user})
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

        console.log('done')
    } catch (error) {
        console.log('err', error)
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

exports.isBlocked = async (user, isAuthAttempt = false) => {
    const currentTime = Math.floor(Date.now() / 1000);
    let [isBlocked,updateFields] = [false,{}];

    if (isAuthAttempt) {
        if (user.account_locked && this.differenceBetweenDates(user.date_locked, currentTime) < process.env.lockedPeriod) {
            // If the user is locked and the locked period hasn't passed yet, reset the failed attempts and keep the account locked
            updateFields.date_locked = currentTime;
            updateFields.failed_count = 0;
            isBlocked = true;
        } else {
            // If the locked period has passed, unlock the account
            updateFields.failed_count = 0;
            updateFields.account_locked = false;
            isBlocked = false;
        }
    } else {
        let failedAttempts = user.failed_count ? user.failed_count + 1 : 1;
        updateFields.failed_count = failedAttempts;

        if (failedAttempts === 1) {
            updateFields.dateFirstAttempt = currentTime;
        }

        if (user.account_locked) {
            // If the user is already locked, reset the failed attempts and update the locked date
            updateFields.date_locked = currentTime;
            updateFields.failed_count = 0;
            isBlocked = true;
        } else if (!user.account_locked && failedAttempts >= process.env.bad_login_limit &&
            this.differenceBetweenDates(user.dateFirstAttempt, currentTime) < process.env.failInterval) {
            // If the user is not locked, and they've reached the limit of failed attempts in the given interval, lock the account
            updateFields.account_locked = true;
            updateFields.failed_count = 0;
            updateFields.date_locked = currentTime;
            isBlocked = true;
        } else if (failedAttempts >= process.env.bad_login_limit) {
            // If the user has reached the limit of failed attempts but not in the given interval, reset the failed attempts count
            updateFields.failed_count = 1;
        }
    }
        // If there are any changes, update the user record in the database
        Object.keys(updateFields).length && await User.updateOne({ _id: user._id }, { $set: updateFields });
    

    return { res: isBlocked, blockedDate: currentTime, auth: isAuthAttempt };
}
exports.getDecimal = (symbol) => {
    try {
        let token_info = Tokens

        symbol =
            symbol === 'SATTBEP20'
                ? 'SATT_BEP20'
                : symbol === 'SATTBTT'
                ? 'SATT_BTT'
                : symbol

        return +token_info[symbol].dicimal
    } catch (err) {}
}
