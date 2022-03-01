const { linkedinActivityUrl, config, auth } = require('../conf/config1')
var rp = require('request-promise')
const {
    FbPage,
    FbProfile,
    CampaignLink,
    GoogleProfile,
    TwitterProfile,
    Wallet,
    LinkedinProfile,
} = require('../model/index')

exports.getLinkedinLinkInfo = async (accessToken, activityURN) => {
    try {
        let linkInfo = {}
        const linkedinData = {
            url: linkedinActivityUrl(activityURN),
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        console.log('data', linkedinData)
        let postData = await rp(linkedinData)
        console.log(postData)
        let urn = `urn:li:activity:${activityURN}`
        linkInfo.idUser =
            postData.results[urn]['domainEntity~'].owner ??
            postData.results[urn]['domainEntity~'].author
        linkInfo.idPost = postData.results[urn]['domainEntity']
        if (postData.results[urn]['domainEntity~'].content)
            linkInfo.mediaUrl =
                postData.results[urn][
                    'domainEntity~'
                ].content.contentEntities[0].entityLocaion
        return linkInfo
    } catch (err) {
        console.log(err.message)
    }
}

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

exports.getInstagramUserName = async (shortcode) => {
    try {
        var media =
            'https://api.instagram.com/oembed/?callback=&url=https://www.instagram.com/p/' +
            shortcode
        var resMedia = await rp({ uri: media, json: true })
        return resMedia.author_name
    } catch {
        console.log(err.message)
    }
}

exports.findBountyOracle = (typeSN) => {
    return typeSN == '1'
        ? 'facebook'
        : typeSN == '2'
        ? 'youtube'
        : typeSN == '3'
        ? 'instagram'
        : typeSN == '4'
        ? 'twitter'
        : 'linkedin'
}

exports.answerAbos = async (typeSN, idPost, idUser, linkedinProfile = null) => {
    switch (typeSN) {
        case '1':
            var res = await this.facebookAbos(idUser)

            break
        case '2':
            var res = await this.youtubeAbos(idPost)

            break
        case '3':
            var res = await this.instagramAbos(idPost)

            break
        case '4':
            var res = await this.twitterAbos(idUser, idPost)

            break
        case '5':
            var res = await this.linkedinAbos(linkedinProfile, idUser)

            break
        default:
            var res = 0
            break
    }

    return res
}

exports.facebookAbos = async function (pageName) {
    try {
        var page = await FbPage.findOne({ username: pageName })

        if (page) {
            var token = page.token
            var res = await rp({
                uri:
                    'https://graph.facebook.com/' +
                    app.config.fbGraphVersion +
                    '/' +
                    pageName +
                    '?access_token=' +
                    token +
                    '&fields=fan_count',
                json: true,
            })

            return res.fan_count
        } else {
            return null
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.youtubeAbos = async function (idPost) {
    try {
        var res = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
                id: idPost,
                key: auth.google.gdataApiKey,
                part: 'snippet',
            },
            json: true,
        })
        if (res.items.length > 0) {
            var channelId = res.items[0]?.snippet.channelId
            var res = await rp({
                uri: 'https://www.googleapis.com/youtube/v3/channels',
                qs: {
                    id: channelId,
                    key: auth.google.gdataApiKey,
                    part: 'statistics',
                },
                json: true,
            })
            return res.items[0].statistics.subscriberCount
        } else {
            return null
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.instagramAbos = async (idPost) => {
    try {
        var followers = 0
        var campaign_link = await CampaignLink.findOne({ idPost })
        var userWallet = await Wallet.findOne({
            'keystore.address': campaign_link.id_wallet
                .toLowerCase()
                .substring(2),
        })
        let instagramUserName = campaign_link.instagramUserName

        var fbPage = await FbPage.findOne({
            $and: [
                { UserId: userWallet.UserId },
                { instagram_username: instagramUserName },
                { instagram_id: { $exists: true } },
            ],
        })
        if (fbPage) {
            var instagram_id = fbPage.instagram_id
            var fbProfile = await FbProfile.findOne({
                UserId: userWallet.UserId,
            })
            var token = fbProfile.accessToken
            var res = await rp({
                uri:
                    'https://graph.facebook.com/' +
                    app.config.fbGraphVersion +
                    '/' +
                    instagram_id +
                    '?access_token=' +
                    token +
                    '&fields=followers_count',
                json: true,
            })
            if (res.followers_count) return (followers = res.followers_count)
            else return null
        }
        return followers
    } catch (err) {
        console.log(err.message)
    }
}

exports.twitterAbos = async function (pageName, idPost) {
    try {
        tweet.get('statuses/show', { id: idPost }).then(
            (tweet_res) => {
                return tweet_res.user.followers_count
            },
            (err) => {
                return null
            }
        )
    } catch (err) {
        console.log(err.message)
    }
}

exports.linkedinAbos = async (linkedinProfile, organization) => {
    try {
        const linkedinData = {
            url: `https://api.linkedin.com/v2/networkSizes/${organization}?edgeType=CompanyFollowedByMember`,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + linkedinProfile.accessToken,
            },
            json: true,
        }
        let postData = await rp(linkedinData)
        return postData.firstDegreeSize
    } catch (err) {
        console.log(err.message)
    }
}

exports.getPromApplyStats = async (
    oracles,
    link,
    id,
    linkedinProfile = null
) => {
    try {
        let socialOracle = {}
        if (oracles == 'facebook' || oracles == 'twitter')
            socialOracle = await app.oracle[oracles](link.idUser, link.idPost)
        else if (oracles == 'youtube')
            socialOracle = await app.oracle.youtube(link.idPost)
        else if (oracles == 'instagram')
            socialOracle = await app.oracle.instagram(id, link.idPost)
        else
            socialOracle = await app.oracle.linkedin(
                link.idUser,
                link.idPost,
                link.typeURL,
                linkedinProfile
            )
        delete socialOracle.date
        return socialOracle
    } catch (err) {
        console.log(err.message)
    }
}

exports.youtube = async function (idPost) {
    return new Promise(async (resolve, reject) => {
        try {
            if (-1 != idPost.indexOf('&')) {
                idPost = idPost.split('&')[0]
            }
            var perf = { shares: 0, likes: 0, views: 0 }
            var body = await rp({
                uri: 'https://www.googleapis.com/youtube/v3/videos',
                qs: {
                    id: idPost,
                    key: app.config.gdataApiKey,
                    part: 'statistics',
                },
            })
            var res = JSON.parse(body)
            if (res.items && res.items[0]) {
                perf = {
                    shares: 0 /*res.items[0].statistics.commentCount*/,
                    likes: res.items[0].statistics.likeCount,
                    views: res.items[0].statistics.viewCount,
                    date: Math.floor(Date.now() / 1000),
                }
            }

            resolve(perf)
        } catch (err) {
            reject({ message: err.message })
        }
    })
}
