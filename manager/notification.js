const { JWT } = require('google-auth-library')
const serviceAccount = require('../conf/satt-token-firebase-adminsdk-fwxcj-2215bda3fa.json')
const request = require('request')

const getAccessToken = () => {
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

exports.sendNotification = async (data) => {
    let fireBaseAccessToken = await getAccessToken()
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

exports.sendNotificationTest = async (req, res) => {
    let notification = {
        idNode: '0149',
        type: 'NotifType',
        status: 'done',
        label: 'label',
        isSeen: false,
        isSend: false,
        attachedEls: {
            id: 149,
        },
        created: new Date(),
    }
    //let token="dMhtAVFNRAqSrlHtePzqk_:APA91bFFr8q8j_XBcZDGSnPvrVgSJvD3dxXP6thieH_LqGRb-joMN17fsLEgTDF6mhoXX_hO11wajyDICdGs203RVARUIxOZ8u84g0KjD9umoEeEh5_hDanflpNub1EmnWhZiw1iXGsV";
    let token =
        'ckGww57_lZ23aTxajLkzyh:APA91bGaqiJ7ny5CE0Jj6TOFOdiDYjW8UFpzSnHLy3NyPB5YHj6Hc232GodJP1o8ZyXK5Z6v11HVgVKmkmU9AfbJgDPx0v9MDckN'
    let data = {
        message: {
            token,
            data: {
                obj: JSON.stringify(notification),
            },
        },
    }

    let fireBaseAccessToken = await getAccessToken()
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
        if (response) {
            console.log('response')
            res.send(response)
        }
        if (error) {
            console.log('error')
        }
        // console.log("response new",response);
        // error && console.log("new error",error)
        return
    })
}

// module.exports = { sendNotification }
