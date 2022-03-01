const { linkedinActivityUrl, config, oauth } = require('../conf/config1')
var rp = require('request-promise')
const {
    FbPage,
    FbProfile,
    CampaignLink,
    GoogleProfile,
    TwitterProfile,
    Wallet,
    IgMedia,
    LinkedinProfile,
} = require('../model/index')
var Twitter2 = require('twitter-v2')

var Twitter = require('twitter')

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
        let postData = await rp(linkedinData)
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
                    oauth.facebook.fbGraphVersion +
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
                key: oauth.google.gdataApiKey,
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
                    key: oauth.google.gdataApiKey,
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
                    oauth.facebook.fbGraphVersion +
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
        var tweet = new Twitter({
            consumer_key: oauth.twitter.consumer_key_alt,
            consumer_secret: oauth.twitter.consumer_secret_alt,
            access_token_key: oauth.twitter.access_token_key,
            access_token_secret: oauth.twitter.access_token_secret,
        })
        var twitterDetails = await tweet.get('statuses/show', { id: idPost })
        return twitterDetails.user.followers_count
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
        if (oracles == 'facebook')
            socialOracle = await this.facebook(link.idUser, link.idPost)
        else if (oracles == 'twitter')
            socialOracle = await this.twitter(link.idUser, link.idPost)
        else if (oracles == 'youtube')
            socialOracle = await this.youtube(link.idPost)
        else if (oracles == 'instagram')
            socialOracle = await this.instagram(id, link)
        else
            socialOracle = await this.linkedin(
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

exports.facebook = async (pageName, idPost) => {
    try {
        var page = await FbPage.findOne({ username: pageName })
        if (page) {
            var token = page.token
            var idPage = page.id

            var res2 = await rp({
                uri:
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '?fields=shares,full_picture&access_token=' +
                    token,
                json: true,
            })
            var res3 = await rp({
                uri:
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '/insights?metric=post_reactions_by_type_total,post_impressions&period=lifetime&access_token=' +
                    token,
                json: true,
            })

            var shares = 0
            if (res2.shares) {
                shares = res2.shares.count
            }
            var likes = res3.data[0].values[0].value.like
            var views = res3.data[1].values[0].value
            var perf = {
                shares: shares,
                likes: likes,
                views: views,
                date: Math.floor(Date.now() / 1000),
                media_url: res2.full_picture,
            }

            return perf
        } else {
            return { shares: 0, likes: 0, views: 0 }
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.youtube = async (idPost) => {
    try {
        if (idPost.indexOf('&') !== -1) {
            idPost = idPost.split('&')[0]
        }
        var perf = { shares: 0, likes: 0, views: 0 }
        var body = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
                id: idPost,
                key: oauth.google.gdataApiKey,
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

        return perf
    } catch (err) {
        rconsole.log(err.message)
    }
}
exports.linkedin = async (organization, idPost, type, linkedinProfile) => {
    try {
        var perf = { shares: 0, likes: 0, views: 0 }
        let url = config.linkedinStatsUrl(type, idPost, organization)
        const linkedinData = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + linkedinProfile.accessToken,
            },
            json: true,
        }
        var body = await rp(linkedinData)
        if (body.elements.length) {
            perf.views = body.elements[0]?.totalShareStatistics.impressionCount
            perf.likes = body.elements[0]?.totalShareStatistics.likeCount
            perf.shares = body.elements[0]?.totalShareStatistics.shareCount
        }
        if (type !== 'share') {
            const linkedinVideoData = {
                url: config.linkedinUgcPostStats(idPost),
                method: 'GET',
                headers: {
                    Authorization: 'Bearer ' + linkedinProfile.accessToken,
                },
                json: true,
            }
            var bodyVideo = await rp(linkedinVideoData)
            perf.views = bodyVideo.elements[0].value
        }
        return perf
    } catch (err) {
        console.log(err.message)
    }
}

exports.instagram = async (UserId, link) => {
    try {
        let idPost = link.idPost
        var perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        let instagramUserName = link.instagramUserName
        var fbPage = await FbPage.findOne({
            instagram_username: instagramUserName,
        })
        if (fbPage && fbPage.instagram_id) {
            var instagram_id = fbPage.instagram_id
            var fbProfile = await FbProfile.findOne({ UserId: UserId })
            if (fbProfile) {
                var accessToken = fbProfile.accessToken
                var media =
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    instagram_id +
                    '/media?fields=like_count,shortcode,media_url&limit=50&access_token=' +
                    accessToken
                var resMedia = await rp({ uri: media, json: true })
                var data = resMedia.data
                for (let i = 0; i < data.length; i++) {
                    if (data[i].shortcode == idPost) {
                        perf.likes = data[i].like_count
                        perf.media_url = data[i].media_url
                        break
                    }
                }
                return perf
            } else {
                return 'indisponible'
            }
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.twitter = async (userName, idPost) => {
    try {
        var tweet = new Twitter({
            consumer_key: oauth.twitter.consumer_key_alt,
            consumer_secret: oauth.twitter.consumer_secret_alt,
            access_token_key: oauth.access_token_key,
            access_token_secret: oauth.access_token_secret,
        })

        var tweet_res = await tweet.get('statuses/show', { id: idPost })
        var twitterProfile = await TwitterProfile.findOne({
            username: tweet_res.user.screen_name,
        })

        if (!twitterProfile) {
            var res = await tweet.get('statuses/show', {
                id: idPost,
                expansions: 'attachments.media_keys',
                'media.fields':
                    'duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text',
            })
            var perf = {
                shares: res.retweet_count,
                likes: res.favorite_count,
                views: 0,
                date: Math.floor(Date.now() / 1000),
                media_url: res.includes?.media[0]?.url,
            }
            return perf
        }

        var tweet = new Twitter2({
            consumer_key: oauth.twitter.consumer_key,
            consumer_secret: oauth.twitter.consumer_secret,
            access_token_key: twitterProfile.access_token_key,
            access_token_secret: twitterProfile.access_token_secret,
        })

        var res = await tweet.get('tweets', {
            ids: idPost,
            'tweet.fields': 'public_metrics,non_public_metrics',
            expansions: 'attachments.media_keys',
            'media.fields':
                'duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text',
        })

        if (res.errors) {
            res = await tweet.get('tweets', {
                ids: idPost,
                'tweet.fields': 'public_metrics',
                expansions: 'attachments.media_keys',
                'media.fields':
                    'duration_ms,height,media_key,preview_image_url,public_metrics,type,url,width,alt_text',
            })

            var perf = {
                shares: res.data[0].public_metrics.retweet_count,
                likes: res.data[0].public_metrics.like_count,
                date: Math.floor(Date.now() / 1000),
                media_url: res.includes?.media[0]?.url,
                views: 'old',
            }
            return perf
        }

        var perf = {
            shares: res.data[0].public_metrics.retweet_count,
            likes: res.data[0].public_metrics.like_count,
            views: res.data[0].non_public_metrics.impression_count,
            date: Math.floor(Date.now() / 1000),
            media_url: res.includes?.media[0]?.url,
        }

        return perf
    } catch (err) {
        return 'indisponible'
    }
}
