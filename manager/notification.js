module.exports = async (app) => {
    const { JWT } = require('google-auth-library')
    const serviceAccount = require('../conf/satt-token-firebase-adminsdk-fwxcj-2215bda3fa.json')
    const request = require('request')

    let notificationManager = {}

    notificationManager.getAccessToken = () => {
        return new Promise((resolve, reject) => {
            let serAccount = serviceAccount
            const key = serAccount
            const jwtClient = new JWT(
                key.client_email,
                null,
                key.private_key,
                ['https://www.googleapis.com/auth/cloud-platform'],
                null
            )
            jwtClient.authorize((err, tokens) => {
                if (err) {
                    reject(err)
                    return
                }
                resolve(tokens.access_token)
            })
        })
    }

    notificationManager.sendNotification = async (data) => {
        let fireBaseAccessToken = await notificationManager.getAccessToken()
        var clientServerOptions = {
            uri: 'https://fcm.googleapis.com/v1/projects/satt-token/messages:send',
            body: JSON.stringify(data),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: 'Bearer ' + fireBaseAccessToken,
            },
        }
        request(clientServerOptions, (error, response) => {
            error && console.log(error)
            return
        })
    }

    app.notification = notificationManager
    return app
}
