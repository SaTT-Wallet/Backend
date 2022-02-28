var rp = require('request-promise')

const {
    FbPage,
    FbProfile,
    GoogleProfile,
    TwitterProfile,
    LinkedinProfile,
} = require('../model/index')

const { config } = require('../conf/config1')

exports.verifyFacebook = async function (userId, pageName, idPost) {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('verifyFacebook works...')
            var page = await FbPage.findOne({
                $and: [{ UserId: userId }, { username: pageName }],
            })
            if (page) {
                var token = page.token
                var idPage = page.id
                var res = await rp({
                    uri:
                        'https://graph.facebook.com/' +
                        app.config.fbGraphVersion +
                        '/' +
                        idPage +
                        '_' +
                        idPost +
                        '?access_token=' +
                        token,
                    json: true,
                })
                if (res) resolve(true)
            } else {
                resolve(false)
            }
        } catch (err) {
            resolve('lien_invalid')
            reject({ message: err.message })
        }
    })
}

exports.verifyYoutube = async function (userId, idPost) {
    return new Promise(async (resolve, reject) => {
        try {
            var googleProfile = await GoogleProfile.findOne({
                UserId: userId,
            })

            var res = await rp({
                uri: 'https://www.googleapis.com/youtube/v3/videos',
                qs: {
                    id: idPost,
                    access_token: googleProfile.accessToken,
                    part: 'snippet',
                },
                json: true,
            })

            if (res.items) {
                var channelId = res.items[0]?.snippet.channelId
                var googleProfile = await GoogleProfile.findOne({
                    UserId: userId,
                    channelId: channelId,
                })
                resolve(googleProfile)
            } else {
                resolve(false)
            }
        } catch (err) {
            reject({ message: err.message })
        }
    })
}

exports.verifyInsta = async function (userId, idPost) {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('verifyInsta works')
            var media =
                'http://api.instagram.com/oembed/?callback=&url=https://www.instagram.com/p/' +
                idPost

            var resMedia = await rp({ uri: media, json: true })
            var page = await FbPage.findOne({
                $and: [
                    { UserId: userId },
                    { instagram_username: resMedia.author_name },
                ],
            })

            if (page && !page.deactivate) resolve(true)
            else if (page && page.deactivate === true) resolve('deactivate')
            else resolve(false)
        } catch (err) {
            resolve('lien_invalid')
            reject({ message: err.message })
        }
    })
}

exports.verifyTwitter = async function (userId, idPost) {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('verifyTwitter works')
            var twitterProfile = await TwitterProfile.findOne({
                UserId: userId,
            }).select('access_token_key access_token_secret id')

            if (twitterProfile.deactivate === true) resolve('deactivate')
            else {
                var tweet = new Twitter2({
                    consumer_key: app.config.twitter.consumer_key,
                    consumer_secret: app.config.twitter.consumer_secret,
                    access_token_key: twitterProfile.access_token_key,
                    access_token_secret: twitterProfile.access_token_secret,
                })
                var res = await tweet.get('tweets', {
                    ids: idPost,
                    'tweet.fields': 'author_id',
                })
                resolve(res.data[0].author_id == twitterProfile.id)
            }
        } catch (err) {
            resolve('lien_invalid')
            reject({ message: err.message })
        }
    })
}

exports.verifyLinkedin = async (linkedinProfile, idPost) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log('verifyLinkedin works')
            const linkedinData = {
                url: config.linkedinActivityUrl(idPost),
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + linkedinProfile.accessToken,
                },
                json: true,
            }
            let res = false
            let urn = `urn:li:activity:${idPost}`
            let postData = await rp(linkedinData)
            if (!Object.keys(postData.results).length) {
                resolve(res)
                return
            }
            let owner =
                postData.results[urn]['domainEntity~'].owner ??
                postData.results[urn]['domainEntity~'].author
            linkedinProfile.pages.forEach((element) => {
                if (element.organization === owner && !element.deactivate)
                    res = true
                if (
                    element.organization === owner &&
                    element.deactivate === true
                )
                    resolve('deactivate')
            })
            resolve(res)
        } catch (err) {
            reject({ message: err.message })
        }
    })
}
