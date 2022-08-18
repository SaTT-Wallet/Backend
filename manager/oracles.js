const { linkedinActivityUrl, config, oauth } = require('../conf/config')
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
var fs = require('fs')
const axios = require('axios')

var Twitter = require('twitter')
const { default: Big } = require('big.js')
const {
    getOracleContractByCampaignContract,
    webTronInstance,
} = require('../blockchainConnexion')
const puppeteer = require('puppeteer')
const { TronConstant } = require('../conf/const')
const { timeout } = require('../helpers/utils')
const { TikTokProfile } = require('../model')

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
                    process.env.FB_GRAPH_VERSION +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '?access_token=' +
                    token,
                json: true,
            })
            if (res) return true
        } else {
            return false
        }
    } catch (err) {
        return 'lien_invalid'
    }
}

exports.verifyYoutube = async function (userId, idPost) {
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
            return googleProfile
        } else {
            return false
        }
    } catch (err) {
        console.log(err.message)
    }
}

exports.verifyInsta = async function (userId, idPost) {
    try {
        let userName
        var fbProfile = await FbProfile.findOne({ UserId: userId })
        if (fbProfile) {
            var accessToken = fbProfile.accessToken
            var media =
                'https://graph.facebook.com/' +
                oauth.facebook.fbGraphVersion +
                '/me/accounts?fields=id,instagram_business_account{id, name, username, media{shortcode, username}}&access_token=' +
                accessToken
            var resMedia = await rp({ uri: media, json: true })
            let data = resMedia.data
            data = data.filter(
                (element) => !!element.instagram_business_account
            )
            data.forEach((account) => {
                // userName = account.instagram_business_account.username
                account.instagram_business_account.media.data.forEach(
                    (media) => {
                        if (media.shortcode === idPost) {
                            userName = media.username
                        }
                    }
                )
            })
            if (!userName) {
                return false
            }
            var page = await FbPage.findOne({
                $and: [{ UserId: userId }, { instagram_username: userName }],
            })

            if (page && !page.deactivate) return true
            else if (page && page.deactivate === true) return 'deactivate'
            else return false
        }
        return false
    } catch (err) {
        return 'lien_invalid'
    }
}

exports.verifyTwitter = async function (twitterProfile, userId, idPost) {
    try {
        var tweet = new Twitter2({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token_key: twitterProfile.access_token_key,
            access_token_secret: twitterProfile.access_token_secret,
        })
        var res = await tweet.get('tweets', {
            ids: idPost,
            'tweet.fields': 'author_id',
        })
        var twitterProfile = await TwitterProfile.findOne({
            id: res.data[0].author_id,
            UserId: userId,
        }).select('access_token_key access_token_secret id')
        return twitterProfile ? true : false
    } catch (err) {
        console.log(err.message)
        return 'lien_invalid'
    }
}

exports.verifyLinkedin = async (linkedinProfile, idPost) => {
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
        if (!Object.keys(postData.results).length) return res

        let owner =
            postData.results[urn]['domainEntity~'].owner ??
            postData.results[urn]['domainEntity~'].author
        linkedinProfile.pages.forEach((element) => {
            if (element.organization === owner && !element.deactivate)
                res = true
            if (element.organization === owner && element.deactivate === true)
                return 'deactivate'
        })
        return res
    } catch (err) {
        console.log(err.message)
    }
}

exports.verifytiktok = async function (tiktokProfile, userId, idPost) {
    try {
        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${process.env.TIKTOK_KEY}&grant_type=refresh_token&refresh_token=${tiktokProfile.refreshToken}`
        let resMedia = await rp({ uri: getUrl, json: true })
        let videoInfoResponse = await axios.post(
            'https://open-api.tiktok.com/video/query/',
            {
                access_token: resMedia?.data.access_token,
                open_id: tiktokProfile.userTiktokId,
                filters: {
                    video_ids: [idPost],
                },
                fields: ['embed_html', 'embed_link'],
            }
        )
        let username =
            videoInfoResponse?.data?.data?.videos?.length &&
            videoInfoResponse.data.data.videos[0].embed_html.split('/')[3]
        username &&
            (await TikTokProfile.updateOne(
                { _id: tiktokProfile._id },
                { $set: { username } }
            ))

        if (videoInfoResponse.data.data.videos) {
            return true
        } else {
            return false
        }
    } catch (err) {
        console.log(err.message)
        return 'lien_invalid'
    }
}

exports.getInstagramUserName = async (shortcode, id) => {
    let userName
    // let shortcode =req.params.shortcode
    // let id= req.params.id
    try {
        var fbProfile = await FbProfile.findOne({ UserId: id })
        if (fbProfile) {
            var accessToken = fbProfile.accessToken
            var media =
                'https://graph.facebook.com/' +
                oauth.facebook.fbGraphVersion +
                '/me/accounts?fields=id,instagram_business_account{id, name, username, media{shortcode, username}}&access_token=' +
                accessToken
            var resMedia = await rp({ uri: media, json: true })
            var data = resMedia.data
            data = data.filter(
                (element) => !!element.instagram_business_account
            )
            data.forEach((account) => {
                // userName = account.instagram_business_account.username
                account.instagram_business_account.media.data.forEach(
                    (media) => {
                        if (media.shortcode === shortcode) {
                            userName = media.username
                        }
                    }
                )
            })
        }
        //https://www.instagram.com/p/CXdclE_oKjm/?__a=1
        // var media =
        //     'https://api.instagram.com/oembed/?callback=&url=https://www.instagram.com/p/' +
        //     shortcode
        // var media ='https://www.instagram.com/p/'+shortcode+'/?__a=1'
        // var resMedia = await rp({ uri: media, json: true })
        // console.log('resMedia', resMedia)
        return userName
    } catch (err) {
        console.log('instagram username errr', err)
    }
}

exports.findBountyOracle = (typeSN) => {
    try {
        return typeSN == '1'
            ? 'facebook'
            : typeSN == '2'
            ? 'youtube'
            : typeSN == '3'
            ? 'instagram'
            : typeSN == '4'
            ? 'twitter'
            : typeSN == '5'
            ? 'linkedin'
            : 'tiktok'
    } catch (err) {
        console.log(err.message)
    }
}

exports.answerAbos = async (
    typeSN,
    idPost,
    idUser,
    linkedinProfile = null,
    tiktokProfile = null
) => {
    try {
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
            case '6':
                var res = await this.tiktokAbos(tiktokProfile.username)

                break
            default:
                var res = 0
                break
        }

        return res
    } catch (error) {
        console.log(error.message)
    }
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

exports.tiktokAbos = async (username) => {
    const vgmUrl = 'https://www.tiktok.com/' + username
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto(vgmUrl)
    const scrappedData = await page.$$eval('strong', (elements) => {
        return elements
            .filter((element) => {
                return element.getAttribute('data-e2e') === 'followers-count'
            })
            .map((element) => element.innerHTML)
    })
    let abosNumber
    if (!!scrappedData.length) {
        abosNumber = scrappedData[0]

        if (abosNumber.indexOf('M') > 0) {
            abosNumber = parseFloat(abosNumber.split('M')[0]) * 1000000
        } else if (abosNumber.indexOf('K') > 0) {
            abosNumber = parseFloat(abosNumber.split('k')[0]) * 1000
        } else {
            abosNumber = parseFloat(abosNumber)
        }
    }
    await browser.close()
    return abosNumber
}

exports.getPromApplyStats = async (
    oracles,
    link,
    id,
    linkedinProfile = null,
    tiktokProfile = null
) => {
    try {
        let socialOracle = {}
        if (oracles == 'facebook')
            socialOracle = await facebook(link.idUser, link.idPost)
        else if (oracles == 'twitter')
            socialOracle = await twitter(link.idUser, link.idPost)
        else if (oracles == 'youtube') socialOracle = await youtube(link.idPost)
        else if (oracles == 'instagram')
            socialOracle = await instagram(id, link)
        else if (oracles == 'linkedin') {
            socialOracle = await linkedin(
                link.idUser,
                link.idPost,
                link.typeURL,
                linkedinProfile
            )
        } else {
            socialOracle = await tiktok(tiktokProfile, link.idPost)
        }

        delete socialOracle.date
        return socialOracle
    } catch (err) {
        console.log('error from getPromApplyStats', err.message)
    }
}

const facebook = async (pageName, idPost) => {
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
            var likes = res3.data[0].values[0].value.like || 0
            var views = res3.data[1].values[0].value || 0
            var perf = {
                shares: shares,
                likes: likes,
                views: views,
                date: Math.floor(Date.now() / 1000),
                media_url: res2.full_picture || '',
            }

            return perf
        } else {
            return { shares: 0, likes: 0, views: 0 }
        }
    } catch (err) {
        console.log('error form facebook', err.message)
    }
}

const youtube = async (idPost) => {
    try {
        if (idPost.indexOf('&') !== -1) {
            idPost = idPost.split('&')[0]
        }
        var perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        var body = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
                id: idPost,
                key: oauth.google.gdataApiKey,
                part: 'statistics',
            },
        })
        var res = JSON.parse(body)
        var media = await rp({
            uri: `https://www.youtube.com/oembed?url=https%3A//youtube.com/watch%3Fv%3D${idPost}&format=json`,
            json: true,
        })
        if (res.items && res.items[0]) {
            perf = {
                shares: 0 /*res.items[0].statistics.commentCount*/,
                likes: res.items[0].statistics.likeCount,
                views: res.items[0].statistics.viewCount,
                date: Math.floor(Date.now() / 1000),
                media_url: media.thumbnail_url || '',
            }
        }

        return perf
    } catch (err) {
        console.log(err.message)
    }
}
const linkedin = async (organization, idPost, type, linkedinProfile) => {
    try {
        let accessToken = linkedinProfile.accessToken
        var perf = { shares: 0, likes: 0, views: 0 }
        const params = new URLSearchParams()
        params.append('client_id', process.env.LINKEDIN_KEY)
        params.append('client_secret', process.env.LINKEDIN_SECRET)
        params.append('token', accessToken)
        let tokenValidityBody = await axios.post(
            'https://www.linkedin.com/oauth/v2/introspectToken',
            params
        )
        if (!tokenValidityBody.data?.active) {
            let accessTokenUrl = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=refresh_token&refresh_token=${linkedinProfile.refreshToken}&client_id=${process.env.LINKEDIN_KEY}&client_secret=${process.env.LINKEDIN_SECRET}`
            let resAccessToken = await rp({ uri: accessTokenUrl, json: true })
            accessToken = resAccessToken.access_token
        }

        let url = config.linkedinStatsUrl(type, idPost, organization)

        const linkedinData = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        console.log('linkedinData', linkedinData)
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
                    Authorization: 'Bearer ' + accessToken,
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

const instagram = async (UserId, link) => {
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
                var mediaGetNewAccessToken = `https://graph.facebook.com/${oauth.facebook.fbGraphVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.APPID}&client_secret=${process.env.APP_SECRET}&fb_exchange_token=${accessToken}`
                var resMediaAccessToken = await rp({
                    uri: mediaGetNewAccessToken,
                    json: true,
                })
                var media =
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    instagram_id +
                    '/media?fields=like_count,shortcode,media_url&limit=50&access_token=' +
                    resMediaAccessToken.access_token
                var resMedia = await rp({ uri: media, json: true })
                var data = resMedia.data
                for (let i = 0; i < data.length; i++) {
                    if (data[i].shortcode == idPost) {
                        perf.likes = data[i].like_count
                        perf.media_url = data[i].media_url || ''
                        var mediaViews =
                            'https://graph.facebook.com/' +
                            oauth.facebook.fbGraphVersion +
                            '/' +
                            data[i].id +
                            '/insights?metric=impressions&access_token=' +
                            resMediaAccessToken.access_token
                        try {
                            var resMediaViews = await rp({
                                uri: mediaViews,
                                json: true,
                            })
                            let nbviews = JSON.stringify(resMediaViews)
                            perf.views =
                                JSON.parse(nbviews).data[0].values[0].value
                        } catch (error) {
                            perf.views = 0
                            return perf
                        }
                        break
                    }
                }
                return perf
            } else {
                return 'indisponible'
            }
        }
    } catch (err) {
        console.log('this.instagram', err.message)
    }
}

const twitter = async (userName, idPost) => {
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
                media_url: res.includes.media[0].url || '',
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

            console.log('media_url', res.includes.media[0].url && true)

            var perf = {
                shares: res.data[0].public_metrics.retweet_count,
                likes: res.data[0].public_metrics.like_count,
                date: Math.floor(Date.now() / 1000),
                media_url: res.includes.media[0].url || '',
                views: 'old',
            }

            return perf
        }

        var perf = {
            shares: res.data[0].public_metrics.retweet_count,
            likes: res.data[0].public_metrics.like_count,
            views: res.data[0].non_public_metrics.impression_count,
            date: Math.floor(Date.now() / 1000),
            media_url: res.includes.media[0].url || '',
        }

        return perf
    } catch (err) {
        return 'indisponible'
    }
}

const tiktok = async (tiktokProfile, idPost) => {
    try {
        if (!tiktokProfile) return 'indisponible'

        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${process.env.TIKTOK_KEY}&grant_type=refresh_token&refresh_token=${tiktokProfile.refreshToken}`
        let resMedia = await rp({ uri: getUrl, json: true })
        let videoInfoResponse = await axios
            .post('https://open-api.tiktok.com/video/query/', {
                access_token: resMedia?.data.access_token,
                open_id: tiktokProfile.userTiktokId,
                filters: {
                    video_ids: [idPost],
                },
                fields: [
                    'like_count',
                    'comment_count',
                    'share_count',
                    'view_count',
                    'cover_image_url',
                ],
            })
            .then((response) => response.data)

        return {
            likes: videoInfoResponse.data.videos[0].like_count,
            shares: videoInfoResponse.data.videos[0].share_count,
            views: videoInfoResponse.data.videos[0].view_count,
            media_url: videoInfoResponse.data.videos[0].cover_image_url || '',
        }
    } catch (error) {
        console.log(error)
    }
}
exports.getReachLimit = (campaignRatio, oracle) => {
    try {
        let ratio = campaignRatio.find((item) => item.oracle == oracle)
        if (ratio) return ratio.reachLimit
    } catch (error) {
        console.log(error.message)
    }
}

exports.getTotalToEarn = (socialStats, ratio) => {
    try {
        let reachLimit = this.getReachLimit(ratio, socialStats.oracle)
        if (reachLimit)
            socialStats = this.limitStats(
                '',
                socialStats,
                '',
                socialStats.abosNumber,
                reachLimit
            )
        let totalToEarn = '0'
        let payedAmount = socialStats.payedAmount || '0'
        ratio.forEach((num) => {
            if (
                num.oracle === socialStats.oracle ||
                num.typeSN === socialStats.typeSN
            ) {
                let view = socialStats.views
                    ? new Big(num['view']).times(socialStats.views)
                    : '0'
                let like = socialStats.likes
                    ? new Big(num['like']).times(socialStats.likes)
                    : '0'
                let share = socialStats.shares
                    ? new Big(num['share']).times(socialStats.shares.toString())
                    : '0'
                let total = new Big(view)
                    .plus(new Big(like))
                    .plus(new Big(share))
                    .toFixed()
                totalToEarn = new Big(total).gt(new Big(payedAmount))
                    ? total
                    : payedAmount
            }
        })
        return totalToEarn
    } catch (err) {
        console.error(err)
    }
}

exports.getReward = (result, bounties) => {
    try {
        let payedAmount = result.payedAmount || '0'
        let totalToEarn = '0'

        bounties.forEach((bounty) => {
            if (
                bounty.oracle === result.oracle ||
                bounty.oracle == this.findBountyOracle(result.typeSN)
            ) {
                bounty = bounty.toObject()
                bounty.categories.forEach((category) => {
                    if (
                        +category.minFollowers <= +result.abosNumber &&
                        +result.abosNumber <= +category.maxFollowers
                    ) {
                        let total = category.reward
                        totalToEarn = new Big(total).gt(new Big(payedAmount))
                            ? total
                            : payedAmount
                    } else if (+result.abosNumber > +category.maxFollowers) {
                        let total = category.reward
                        totalToEarn = new Big(total).gt(new Big(payedAmount))
                            ? total
                            : payedAmount
                    }
                })
            }
        })
        return totalToEarn
    } catch (err) {
        console.error(err)
    }
}

exports.getButtonStatus = (link) => {
    try {
        var type = ''
        var totalToEarn = '0'
        link.payedAmount = link.payedAmount || '0'
        if (link.totalToEarn) totalToEarn = link.totalToEarn
        if (link.reward)
            totalToEarn =
                link.isPayed === false ? link.reward : link.payedAmount
        if (link.status === 'indisponible') type = 'indisponible'
        else if (link.status === 'rejected') type = 'rejected'
        else if (link.status === false && !link.campaign.isFinished)
            type = 'waiting_for_validation'
        else if (
            link.isPayed === true ||
            (link.payedAmount !== '0' &&
                new Big(totalToEarn).lte(new Big(link.payedAmount)))
        )
            type = 'already_recovered'
        else if (totalToEarn === '0' && link.payedAmount === '0')
            type = 'no_gains'
        else if (
            totalToEarn === '0' &&
            link.campaign.funds[1] === '0' &&
            link.payedAmount === '0'
        )
            type = 'not_enough_budget'
        else if (
            (new Big(totalToEarn).gt(new Big(link.payedAmount)) &&
                link.campaign?.ratios?.length) ||
            (link.isPayed === false &&
                new Big(totalToEarn).gt(new Big(link.payedAmount)) &&
                link.campaign.bounties?.length)
        )
            type = 'harvest'
        else type = 'none'
        return type
    } catch (err) {
        console.error(err)
    }
}

exports.answerBounty = async function (opts) {
    try {
        if (!!opts.tronWeb) {
            let privateKey = process.env.CAMPAIGN_TRON_OWNER_PRIVATE_KEY
            let tronWeb = await webTronInstance()
            tronWeb.setPrivateKey(privateKey)
            let walletAddr = tronWeb.address.fromPrivateKey(privateKey)
            tronWeb.setAddress(walletAddr)
            let contract = await tronWeb.contract(
                TronConstant.oracle.abi,
                TronConstant.oracle.address
            )
            let receipt = await contract
                .answerBounty(
                    opts.campaignContract,
                    '0x' + opts.idProm,
                    opts.nbAbos
                )
                .send({
                    feeLimit: 100_000_000,
                    callValue: 0,
                    shouldPollResponse: false,
                })
            await timeout(10000)
            let result = await tronWeb.trx.getTransaction(receipt)
            if (result.ret[0].contractRet === 'SUCCESS') {
                return { result: 'OK', hash: receipt }
            } else {
                res.status(500).send({
                    code: 500,
                    error: result,
                })
            }
        }
        let contract = await getOracleContractByCampaignContract(
            opts.campaignContract,
            opts.credentials
        )
        var campaignKeystore = fs.readFileSync(
            process.env.CAMPAIGN_WALLET_PATH,
            'utf8'
        )

        campaignWallet = JSON.parse(campaignKeystore)

        opts.credentials.Web3ETH.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        opts.credentials.Web3BEP20.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        opts.credentials.Web3POLYGON.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )

        var gasPrice = await contract.getGasPrice()

        var receipt = await contract.methods
            .answerBounty(opts.campaignContract, opts.idProm, opts.nbAbos)
            .send({
                from: process.env.CAMPAIGN_OWNER,
                gas: 500000,
                gasPrice: gasPrice,
            })
            .once('transactionHash', function (hash) {
                console.log('oracle answerBounty transactionHash', hash)
            })
        return { result: 'OK', hash: receipt.hash }
    } catch (err) {
        console.log(err)
    }
}

exports.answerOne = async (
    typeSN,
    idPost,
    idUser,
    type = null,
    linkedinProfile = null,
    tiktokProfile = null
) => {
    try {
        switch (typeSN) {
            case '1':
                var res = await facebook(idUser, idPost)

                break
            case '2':
                var res = await youtube(idPost)

                break
            case '3':
                var campaign_link = await CampaignLink.findOne({ idPost })
                var userWallet = await Wallet.findOne({
                    'keystore.address': campaign_link.id_wallet
                        .toLowerCase()
                        .substring(2),
                })
                var res = await instagram(userWallet.UserId, campaign_link)

                break
            case '4':
                var res = await twitter(idUser, idPost)

                break
            case '5':
                var res = await linkedin(idUser, idPost, type, linkedinProfile)

                break
            case '6':
                var res = await tiktok(tiktokProfile, idPost)

                break
            default:
                var res = { likes: 0, shares: 0, views: 0, date: Date.now() }
                break
        }

        return res
    } catch (error) {
        console.log(error.message)
    }
}

exports.limitStats = (typeSN, stats, ratios, abos, limit = '') => {
    try {
        if (!limit) {
            var limits = ratios[4]
            limit = limits[parseInt(typeSN) - 1]
        }
        if (limit > 0) {
            limit = parseFloat(limit)
            var max = Math.ceil((limit * parseFloat(abos)) / 100)
            if (+stats.views > max) {
                stats.views = max
            }
            if (+stats.likes > max) {
                stats.likes = max
            }
            if (+stats.shares > max) {
                stats.shares = max
            }
        }

        return stats
    } catch (error) {
        console.log(error.message)
    }
}

exports.answerCall = async (opts) => {
    try {
        if (!!opts.tronWeb) {
            let privateKey = process.env.CAMPAIGN_TRON_OWNER_PRIVATE_KEY
            let tronWeb = await webTronInstance()
            tronWeb.setPrivateKey(privateKey)
            let walletAddr = tronWeb.address.fromPrivateKey(privateKey)
            tronWeb.setAddress(walletAddr)
            let contract = await tronWeb.contract(
                TronConstant.oracle.abi,
                TronConstant.oracle.address
            )
            let receipt = await contract
                .answer(
                    opts.campaignContract,
                    '0x' + opts.idRequest,
                    opts.likes,
                    opts.shares,
                    opts.views
                )
                .send({
                    feeLimit: 100_000_000,
                    callValue: 0,
                    shouldPollResponse: false,
                })
            await timeout(10000)
            let result = await tronWeb.trx.getTransaction(receipt)
            if (result.ret[0].contractRet === 'SUCCESS') {
                return { result: 'OK', hash: receipt } //TODO check if transaction if went with SUCCESS
            } else {
                res.status(500).send({
                    code: 500,
                    error: result,
                })
            }
        }
        let contract = await getOracleContractByCampaignContract(
            opts.campaignContract,
            opts.credentials
        )
        var campaignKeystore = fs.readFileSync(
            process.env.CAMPAIGN_WALLET_PATH,
            'utf8'
        )

        campaignWallet = JSON.parse(campaignKeystore)

        opts.credentials.Web3ETH.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        opts.credentials.Web3BEP20.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        opts.credentials.Web3POLYGON.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        opts.credentials.web3UrlBTT.eth.accounts.wallet.decrypt(
            [campaignWallet],
            process.env.CAMPAIGN_OWNER_PASS
        )
        var gasPrice = await contract.getGasPrice()
        var receipt = await contract.methods
            .answer(
                opts.campaignContract,
                opts.idRequest,
                opts.likes,
                opts.shares,
                opts.views
            )
            .send({
                from: process.env.CAMPAIGN_OWNER,
                gas: 500000,
                gasPrice: gasPrice,
            })
            .once('transactionHash', function (hash) {
                console.log('oracle answerCall transactionHash', hash)
            })
        return { result: 'OK', hash: receipt.hash }
    } catch (error) {
        console.log(error.message)
    }
}
exports.updateFacebookPages = async (UserId, accessToken, isInsta = false) => {
    try {
        var instagram_id = false
        var accountsUrl =
            'https://graph.facebook.com/' +
            process.env.FB_GRAPH_VERSION +
            '/me/accounts?fields=instagram_business_account,access_token,username,name,picture,fan_count&access_token=' +
            accessToken
        var res = await rp({ uri: accountsUrl, json: true })

        if (res.data.length === 0) {
            return
        } else {
            while (true) {
                for (var i = 0; i < res.data.length; i++) {
                    let page = {
                        UserId: UserId,
                        username: res.data[i].username,
                        token: res.data[i].access_token,
                        picture: res.data[i].picture.data.url,
                        name: res.data[i].name,
                        subscribers: res.data[i].fan_count,
                    }

                    if (res.data[i].instagram_business_account) {
                        if (!isInsta) {
                            isInsta = true
                        }
                        instagram_id = res.data[i].instagram_business_account.id
                        page.instagram_id = instagram_id
                        var media =
                            'https://graph.facebook.com/' +
                            process.env.FB_GRAPH_VERSION +
                            '/' +
                            instagram_id +
                            '?fields=username&access_token=' +
                            accessToken
                        var resMedia = await rp({ uri: media, json: true })
                        page.instagram_username = resMedia.username
                    }
                    await FbPage.updateOne(
                        { id: res.data[i].id, UserId },
                        { $set: page },
                        { upsert: true }
                    )
                }
                if (!res.paging || !res.paging.next) {
                    break
                }
                res = await rp({ uri: res.paging.next, json: true })
            }
        }
    } catch (e) {
        console.log({ message: e.message })
    }
}
exports.getFacebookPages = async (UserId, accessToken, isInsta = false) => {
    try {
        let message = 'account_linked_with_success'
        var instagram_id = false
        var accountsUrl =
            'https://graph.facebook.com/' +
            process.env.FB_GRAPH_VERSION +
            '/me/accounts?fields=instagram_business_account,access_token,username,name,picture,fan_count&access_token=' +
            accessToken
        var res = await rp({ uri: accountsUrl, json: true })

        let pages = await FbPage.find({ UserId })
        if (res.data.length === 0) {
            message = 'required_page'
        } else if (this.isDefferent(res.data, pages)) {
            while (true) {
                for (var i = 0; i < res.data.length; i++) {
                    let page = {
                        UserId: UserId,
                        username: res.data[i].username,
                        token: res.data[i].access_token,
                        picture: res.data[i].picture.data.url,
                        name: res.data[i].name,
                        subscribers: res.data[i].fan_count,
                    }

                    if (res.data[i].instagram_business_account) {
                        if (!isInsta) {
                            message += '_instagram_facebook'
                            isInsta = true
                        }
                        instagram_id = res.data[i].instagram_business_account.id
                        page.instagram_id = instagram_id
                        var media =
                            'https://graph.facebook.com/' +
                            process.env.FB_GRAPH_VERSION +
                            '/' +
                            instagram_id +
                            '?fields=username&access_token=' +
                            accessToken
                        var resMedia = await rp({ uri: media, json: true })
                        page.instagram_username = resMedia.username
                    }
                    await FbPage.updateOne(
                        { id: res.data[i].id, UserId },
                        { $set: page },
                        { upsert: true }
                    )
                }
                if (!res.paging || !res.paging.next) {
                    break
                }
                res = await rp({ uri: res.paging.next, json: true })
            }

            if (!isInsta && res.data.length > 0) message += '_facebook'
        } else {
            message = 'page already exists'
        }
        return message
    } catch (e) {
        console.log({ message: e.message })
    }
}
exports.isDefferent = (data, pages) => {
    try {
        let isNew = false
        let i = 0
        while (!isNew && i < data.length) {
            let items = data[i]
            let object = pages.find((item) => item.id == items.id) || false
            if (!object) {
                isNew = true
                return true
            } else i++
        }
        return isNew
    } catch (e) {
        return { message: e.message }
    }
}
