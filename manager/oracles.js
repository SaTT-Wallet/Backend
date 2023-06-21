const { linkedinActivityUrl, config, oauth } = require('../conf/config')
var rp = require('axios');
const child_process = require('child_process')
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
const {
    getWeb3Connection,
    networkProviders,
    networkProvidersOptions,
} = require('../web3/web3-connection')
const { responseHandler } = require('../helpers/response-handler')

exports.getLinkedinLinkInfo = async (accessToken, activityURN) => {
    try {
        let linkInfo = {}
        let postData = (await rp.get(linkedinActivityUrl(activityURN),{headers : {'Authorization': 'Bearer ' + accessToken}})).data
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
    } catch (err) {}
}

exports.verifyFacebook = async (idPost, page) => {
    try {
        if (page) {
            var token = page.token
            var idPage = page.id
            var res = (await rp.get(
                    'https://graph.facebook.com/' +
                    process.env.FB_GRAPH_VERSION +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '?access_token=' +
                    token
            )).data
            if (res) return true
        } else {
            return false
        }
    } catch (err) {
        return 'lien_invalid'
    }
}

exports.verifyYoutube = async (userId, idPost, accessToken) => {
    try {
        var res = await rp(
            'https://www.googleapis.com/youtube/v3/videos',
            {
                params: {
                    id: idPost,
                    access_token: accessToken,
                    part: 'snippet',
                }
            });

        if (res.data.items) {
            var channelId = res.data.items[0]?.snippet.channelId
            var googleProfile = await GoogleProfile.findOne({
                UserId: userId,
                channelId: channelId,
            }).lean()
            return googleProfile
        } else {
            return false
        }
    } catch (err) {
        console.error('verifyYoutube', err)
    }
}

exports.verifyInsta = async function (userId, idPost) {
    try {
        let userName
        var fbProfile = await FbProfile.findOne(
            { UserId: userId },
            { accessToken: 1 }
        ).lean()
        if (fbProfile) {
            var accessToken = fbProfile.accessToken
            var media =
                'https://graph.facebook.com/' +
                oauth.facebook.fbGraphVersion +
                '/me/accounts?fields=id,instagram_business_account{id, name, username, media{shortcode, username}}&access_token=' +
                accessToken
            var resMedia = (await rp.get(media)).data
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
            }).lean()

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
         const client = new Twitter({
            consumer_key: process.env.TWITTER_CONSUMER_KEY,
            consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
            access_token_key: twitterProfile.access_token_key,
            access_token_secret: twitterProfile.access_token_secret,
            bearer_token: process.env.TWITTER_BEARER_TOKEN
          });
         const tweet = await client.get('statuses/show', { id: idPost });
         var twitterProfile = await TwitterProfile.findOne({
             id: tweet.user.id_str,
             UserId: userId,
         }).select('access_token_key access_token_secret id')
         return twitterProfile ? true : false
    } catch (err) {
        return 'lien_invalid'
    }
}

exports.verifyLinkedin = async (linkedinProfile, idPost) => {
    try {
        let res = false
        let urn = `urn:li:activity:${idPost}`
        let postData = await rp.get(config.linkedinActivityUrl(idPost) ,{headers:{
            Authorization: 'Bearer ' + linkedinProfile.accessToken
        }})
         
        const {data: {results}} = postData
        if (!Object.keys(results).length) return res

        let owner =
            results[urn]['domainEntity~'].owner ??
            results[urn]['domainEntity~'].author
        linkedinProfile.pages.forEach((element) => {
            if (element.organization === owner && !element.deactivate)
                res = true
            if (element.organization === owner && element.deactivate === true)
                return 'deactivate'
        })
        return res
    } catch (err) {
        console.error('verifyLinkedin', err)
    }
}

exports.verifytiktok = async function (tiktokProfile, userId, idPost) {
    try {
        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${process.env.TIKTOK_KEY}&grant_type=refresh_token&refresh_token=${tiktokProfile.refreshToken}`
        let resMedia = (await rp.get(getUrl)).data
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
            var resMedia = (await rp.get(media)).data
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

        return userName
    } catch (err) {}
}

exports.findBountyOracle = (typeSN) =>
    typeSN == '1'
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

exports.answerAbos = async (
    typeSN,
    idPost,
    idUser,
    linkedinProfile = null,
    tiktokProfile = null,
    id = null,
    userName = false
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
                var res = await this.instagramAbos(idPost, id, userName)

                break
            case '4':
                var res = await this.twitterAbos(idUser, idPost)

                break
            case '5':
                var res = await this.linkedinAbos(linkedinProfile, idUser)
                break
            case '6':
                var res = await this.tiktokAbos(tiktokProfile.userId)
                tiktokProfile.followers = res ?? 0
                await tiktokProfile.save()
                break
            default:
                var res = 0
                break
        }

        return res
    } catch (error) {}
}

exports.facebookAbos = async pageName =>{
    try {
        var page = await FbPage.findOne({ username: pageName })

        if (page) {
            var token = page.token
            var res = (await rp.get(
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    pageName +
                    '?access_token=' +
                    token +
                    '&fields=fan_count')).data

            return res.fan_count
        } else {
            return null
        }
    } catch (err) {}
}

exports.youtubeAbos = async  idPost => {
    try {
        var res = (await rp.get('https://www.googleapis.com/youtube/v3/videos',{params : {
            id: idPost,
                key: oauth.google.gdataApiKey,
                part: 'snippet'
        }})).data
        if (res.items.length > 0) {
            var channelId = res.items[0]?.snippet.channelId
            var res = (await rp.get('https://www.googleapis.com/youtube/v3/channels', {
                params : {
                    id: channelId,
                    key: oauth.google.gdataApiKey,
                    part: 'statistics'
                }
            })).data
            let follwers_count = res.items[0].statistics.subscriberCount
            await GoogleProfile.updateMany(
                { channelId },
                { 'channelStatistics.subscriberCount': follwers_count }
            )
            return follwers_count
        } else {
            return null
        }
    } catch (err) {
        console.error('youtubeAbos', err)
    }
}

exports.instagramAbos = async (idPost, id, userName) => {
    try {
        var followers = 0
        var campaign_link = await CampaignLink.findOne({ idPost }).lean()
        var userWallet = await Wallet.findOne({
            $or: [
                {
                    'keystore.address': campaign_link?.id_wallet
                        .toLowerCase()
                        .substring(2),
                },
                {
                    'walletV2.keystore.address': campaign_link?.id_wallet
                        .toLowerCase()
                        .substring(2),
                },
            ],
        })

        let instagramUserName = campaign_link?.instagramUserName || userName
        var fbPage = await FbPage.findOne({
            $and: [
                { UserId: userWallet?.UserId || id },
                { instagram_username: instagramUserName },
                { instagram_id: { $exists: true } },
            ],
        })
        if (fbPage) {
            var instagram_id = fbPage.instagram_id
            var fbProfile = await FbProfile.findOne({
                UserId: userWallet?.UserId || id,
            })
            var token = fbProfile.accessToken
            var res = (await rp.get(
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    instagram_id +
                    '?access_token=' +
                    token +
                    '&fields=followers_count')).data
            if (res.followers_count) return (followers = res.followers_count)
            else return null
        }
        return followers
    } catch (err) {}
}

exports.twitterAbos = async function (pageName, idPost) {
    try {
        var tweet = new Twitter({
            consumer_key: oauth.twitter.consumer_key_alt,
            consumer_secret: oauth.twitter.consumer_secret_alt,
            access_token_key: oauth?.twitter?.access_token_key,
            access_token_secret: oauth.twitter.access_token_secret,
            bearer_token: process.env.TWITTER_BEARER_TOKEN
        })
        var twitterDetails = await tweet.get('statuses/show', { id: idPost })
        await TwitterProfile.updateMany(
            {
                id: twitterDetails.user.id_str,
            },
            { '_json.followers_count': twitterDetails.user.followers_count }
        )

        return twitterDetails.user.followers_count
    } catch (err) {}
}

exports.linkedinAbos = async (linkedinProfile, organization) => {
    try {
        let postData = (await rp.get(`https://api.linkedin.com/v2/networkSizes/${organization}?edgeType=CompanyFollowedByMember`,{
            headers: {
                Authorization: 'Bearer ' + linkedinProfile.accessToken
            }
        })).data
        var subscribers = postData.firstDegreeSize
        return subscribers
    } catch (err) {
        console.error('linkedinAbos', err)
        return 0
    } finally {
        subscribers &&
            (await LinkedinProfile.updateMany(
                { 'pages.organization': organization },
                { $set: { 'pages.$.subscribers': subscribers } }
            ))
    }
}

exports.tiktokAbos = async (userId, access_token = null) => {
    const accessToken =
        (access_token && access_token) ||
        (
            await TikTokProfile.findOne(
                { userId: +userId },
                { accessToken: 1 }
            ).lean()
        ).accessToken   

    try {

         const runCmd = cmd => {
            let resp = child_process.execSync(cmd)
            return resp.toString('UTF8')
        }
        var cmd = `curl -L -X GET 'https://open.tiktokapis.com/v2/user/info/?fields=follower_count' \
        -H 'Authorization: Bearer ${accessToken}'`
        var result = JSON.parse(runCmd(cmd))

    
        
          
        return result?.data?.user?.follower_count ?? 0
    } catch (err) {
        console.error('tiktokAbos', err.message ? err.message : err.error)
    }
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
        if (oracles === 'facebook')
            socialOracle = await facebook(link.idUser, link.idPost)
        else if (oracles === 'twitter')
            socialOracle = await twitter(link.idUser, link.idPost)
        else if (oracles === 'youtube')
            socialOracle = await youtube(link.idPost)
        else if (oracles === 'instagram')
            socialOracle = await instagram(id, link)
        else if (oracles === 'linkedin') {
            socialOracle = await linkedin(
                link.idUser,
                link.idPost,
                link.typeURL,
                linkedinProfile
            )
        } else if (oracles === 'tiktok') {
            socialOracle = await tiktok(tiktokProfile, link.idPost)
        }

        delete socialOracle?.date
        return socialOracle
    } catch (err) {
        console.error('getPromApplyStats', err)
    }
}

const facebook = async (pageName, idPost) => {
    try {
        var page = await FbPage.findOne({ username: pageName })
        if (page) {
            var token = page.token
            var idPage = page.id
            var res2 = (await rp.get(
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '?fields=shares,full_picture&access_token=' +
                    token)).data
            var res3 = (await rp.get(

                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    idPage +
                    '_' +
                    idPost +
                    '/insights?metric=post_reactions_by_type_total,post_impressions&period=lifetime&access_token=' +
                    token)).data

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
                media_url: res2?.full_picture || ' ',
            }

            return perf
        } else {
            return { shares: 0, likes: 0, views: 0 }
        }
    } catch (err) {}
}

const youtube = async (idPost) => {
    try {
        if (idPost.indexOf('&') !== -1) {
            idPost = idPost.split('&')[0]
        }
        var perf = { shares: 0, likes: 0, views: 0, media_url: '' }
  
        var body = (await rp.get('https://www.googleapis.com/youtube/v3/videos', {
            params : {
                id: idPost,
                key: oauth.google.gdataApiKey,
                part: 'statistics,snippet'
            }
        })).data
        if (body.items && body.items[0]) {
            perf = {
                shares: 0 /*res.items[0].statistics.commentCount*/,
                likes: body.items[0].statistics.likeCount,
                views: body.items[0].statistics.viewCount,
                date: Math.floor(Date.now() / 1000),
                media_url:
                    body.items[0]?.snippet?.thumbnails?.default?.url || ' ',
            }
        }

        return perf
    } catch (err) {
        
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
            let resAccessToken = (await rp.get(accessTokenUrl)).data
            accessToken = resAccessToken.access_token
        }

        let url = config.linkedinStatsUrl(type, idPost, organization)

        var body = (await rp.get(url,{headers:{
            Authorization: 'Bearer ' + accessToken
        }})).data;
        if (body.elements.length) {
            perf.views = body.elements[0]?.totalShareStatistics.impressionCount
            perf.likes = body.elements[0]?.totalShareStatistics.likeCount
            perf.shares = body.elements[0]?.totalShareStatistics.shareCount
        }
        // if (type !== 'share') {
        //     const linkedinVideoData = {
        //         url: config.linkedinUgcPostStats(idPost),
        //         method: 'GET',
        //         headers: {
        //             Authorization: 'Bearer ' + accessToken,
        //         },
        //         json: true,
        //     }
        //     var bodyVideo = await rp(linkedinVideoData)
        //     perf.views = bodyVideo.elements[0].value
        // }
        return perf
    } catch (err) {}
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
            var fbProfile = await FbProfile.findOne({ UserId: UserId }).lean()
            if (fbProfile) {
                var accessToken = fbProfile.accessToken
                var mediaGetNewAccessToken = `https://graph.facebook.com/${oauth.facebook.fbGraphVersion}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.APPID}&client_secret=${process.env.APP_SECRET}&fb_exchange_token=${accessToken}`
                var resMediaAccessToken = (await rp.get(mediaGetNewAccessToken)).data
                var media =
                    'https://graph.facebook.com/' +
                    oauth.facebook.fbGraphVersion +
                    '/' +
                    instagram_id +
                    '/media?fields=like_count,shortcode,media_url&limit=50&access_token=' +
                    resMediaAccessToken.access_token
                var resMedia = (await rp.get(media)).data
                var data = resMedia.data
                for (let i = 0; i < data.length; i++) {
                    if (data[i].shortcode == idPost) {
                        perf.likes = data[i].like_count
                        perf.media_url = data[i]?.media_url || ' '
                        var mediaViews =
                            'https://graph.facebook.com/' +
                            oauth.facebook.fbGraphVersion +
                            '/' +
                            data[i].id +
                            '/insights?metric=impressions&access_token=' +
                            resMediaAccessToken.access_token
                        try {
                            var resMediaViews = (await rp.get( mediaViews)).data
                            let nbviews = JSON.stringify(resMediaViews)
                            perf.views =
                                JSON.parse(nbviews).data[0].values[0].value || 0
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
        console.error('instagram manager oracle', err)
    }
}

const twitter = async (userName, idPost) => {
    try {
        
        var tweet = new Twitter({
            consumer_key: oauth.twitter.consumer_key_alt,
            consumer_secret: oauth.twitter.consumer_secret_alt,
            access_token_key: oauth.access_token_key,
            access_token_secret: oauth.access_token_secret,
            bearer_token: process.env.TWITTER_BEARER_TOKEN
        })
        const res = await tweet.get(`https://api.twitter.com/1.1/statuses/show.json?id=${idPost}&include_entities=true`, {params: {}});
        var perf = {
            shares: res.retweet_count,
            likes: res.favorite_count,
            // views: No direct equivalent in API v1.1, impression count is not available
            date: Math.floor(Date.now() / 1000),
            // API v1.1 doesn't provide a 'media_url' in the same manner as API v2.
            // Here we are trying to find it from the entities->media object if it exists.
            media_url: res.extended_entities.media[0]?.media_url_https || ' ',
        };
        return perf
    } catch (err) {
        console.error('error twittRate limit exceededer oracles', err)
        return err[0]?.message === 'Rate limit exceeded'
            ? 'Rate limit exceeded'
            : err[0]?.message === 'No status found with that ID.'
            ? 'No found'
            : 'indisponible'
    }
}

const tiktok = async (tiktokProfile, idPost) => {
    try {
        if (!tiktokProfile) return 'indisponible'

        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${process.env.TIKTOK_KEY}&grant_type=refresh_token&refresh_token=${tiktokProfile.refreshToken}`
        let resMedia = await rp.get(getUrl)
        resMedia?.data?.data?.access_token && await TikTokProfile.updateOne({_id:tiktokProfile._id},{accessToken : resMedia?.data?.data.access_token})
        let videoInfoResponse = await axios
            .post('https://open-api.tiktok.com/video/query/', {
                access_token: resMedia?.data?.data.access_token,
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
            media_url:
                videoInfoResponse.data?.videos[0]?.cover_image_url || ' ',
        }
    } catch (error) {
        console.error('tiktok fetch stats', error)
    }
}
exports.getReachLimit = (campaignRatio, oracle) => {
    try {
        let ratio = campaignRatio.find((item) => item.oracle == oracle)
        if (ratio) return ratio.reachLimit
    } catch (error) {}
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
        ratio?.forEach((num) => {
            if (
                num.oracle === socialStats.oracle ||
                num.typeSN === socialStats.typeSN
            ) {
                let view = socialStats.views
                    ? new Big(num['view']).times(socialStats.views)
                    : '0'
                let like = socialStats.likes
                    ? new Big(num['like'] || '0').times(
                          socialStats.likes || '0'
                      )
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
                // bounty = bounty.toObject()
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
        var totalToEarn = '0'
        link.payedAmount = link.payedAmount || '0'

        if (link.status === false) {
            return 'waiting_for_validation'
        }

        if (link.totalToEarn) totalToEarn = link.totalToEarn

        if (link.reward)
            totalToEarn =
                link.isPayed === false ? link.reward : link.payedAmount

        if (
            link.isPayed === true ||
            (link.payedAmount !== '0' &&
                new Big(totalToEarn).lte(new Big(link.payedAmount)))
        )
            return 'already_recovered'

        if (totalToEarn === '0' && link.payedAmount === '0') return 'no_gains'

        if (
            totalToEarn === '0' &&
            link.campaign.funds[1] === '0' &&
            link.payedAmount === '0'
        )
            return 'not_enough_budget'

        if (
            (new Big(totalToEarn).gt(new Big(link.payedAmount)) &&
                link.status === true &&
                link.campaign?.ratios?.length) ||
            (link.isPayed === false &&
                new Big(totalToEarn).gt(new Big(link.payedAmount)) &&
                link.status === true &&
                link.campaign.bounties?.length)
        ) {
            // link.status = true
            return 'harvest'
        }

        if (link.status === 'indisponible') return 'indisponible'

        if (link.status === 'rejected') return 'rejected'

        return 'none'
    } catch (err) {
        console.error(err)
    }
}

exports.answerBounty = async function (opts) {
    try {
        if (!!opts.tronWeb) {
            let tronWeb = await webTronInstance()
            var tronCampaignKeystore = fs.readFileSync(
                process.env.CAMPAIGN_TRON_WALLET_PATH,
                'utf8'
            )
            tronCampaignWallet = JSON.parse(tronCampaignKeystore)

            let ethAddr = tronCampaignWallet.address.slice(2)
            tronCampaignWallet.address = ethAddr

            let wallet = opts.credentials.Web3ETH.eth.accounts.decrypt(
                tronCampaignWallet,
                process.env.CAMPAIGN_TRON_OWNER_PASS
            )
            tronWeb.setPrivateKey(wallet.privateKey.slice(2))
            let walletAddr = tronWeb.address.fromPrivateKey(
                wallet.privateKey.slice(2)
            )
            tronWeb.setAddress(walletAddr)

            let contract = await tronWeb.contract(
                TronConstant.oracle.abi,
                TronConstant.oracle.address
            )
            let receipt = await contract
                .answerBounty(opts.campaignContract, opts.idProm, opts.nbAbos)
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
            opts.credentials
        )
        var campaignKeystore = fs.readFileSync(
            process.env.CAMPAIGN_WALLET_PATH,
            'utf8'
        )

        campaignWallet = JSON.parse(campaignKeystore)

        opts.credentials.WEB3.eth.accounts.wallet.decrypt(
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
            .once('transactionHash', function (hash) {})
        return { result: 'OK', hash: receipt.hash }
    } catch (err) {}
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
                var userWallet = await Wallet.findOne(
                    {
                        $or: [
                            {
                                'keystore.address': campaign_link.id_wallet
                                    .toLowerCase()
                                    .substring(2),
                            },
                            {
                                'walletV2.keystore.address':
                                    campaign_link.id_wallet
                                        .toLowerCase()
                                        .substring(2),
                            },
                        ],
                    },
                    { UserId: 1 }
                ).lean()
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
    } catch (error) {}
}

exports.limitStats = (typeSN, stats, ratios, abos, limit = '') => {
    try {
        let calculstats = {...stats}
        if (!limit) {
            var limits = ratios[4]
            limit = limits[parseInt(typeSN) - 1]
        }
        if (limit > 0) {
            limit = parseFloat(limit)
            var max = Math.ceil((limit * parseFloat(abos)) / 100)
            if (+stats.views > max) {
                calculstats.views = max
            }
            if (+stats.likes > max) {
                calculstats.likes = max
            }
            if (+stats.shares > max) {
                calculstats.shares = max
            }
        }

        return calculstats 
    } catch (error) {
        console.error(error)
    }
}

exports.answerCall = async (opts) => {
    try {
        if (!!opts.tronWeb) {
            var tronCampaignKeystore = fs.readFileSync(
                process.env.CAMPAIGN_TRON_WALLET_PATH,
                'utf8'
            )
            tronCampaignWallet = JSON.parse(tronCampaignKeystore)

            let ethAddr = tronCampaignWallet.address.slice(2)
            tronCampaignWallet.address = ethAddr

            let webTron = getWeb3Connection(
                networkProviders['ERC20'],
                networkProvidersOptions['ERC20']
            )

            let wallet = webTron.eth.accounts.decrypt(
                tronCampaignWallet,
                process.env.CAMPAIGN_TRON_OWNER_PASS
            )

            let tronWeb = await webTronInstance()
            tronWeb.setPrivateKey(wallet.privateKey.slice(2))
            let walletAddr = tronWeb.address.fromPrivateKey(
                wallet.privateKey.slice(2)
            )
            tronWeb.setAddress(walletAddr)
            let contract = await tronWeb.contract(
                TronConstant.oracle.abi,
                TronConstant.oracle.address
            )
            let receipt = await contract
                .answer(
                    opts.campaignContract,
                    opts.idRequest,
                    opts.likes,
                    opts.shares,
                    opts?.views
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
            opts.credentials
        )
        var campaignKeystore = fs.readFileSync(
            process.env.CAMPAIGN_WALLET_PATH,
            'utf8'
        )

        campaignWallet = JSON.parse(campaignKeystore)

        opts.credentials.WEB3.eth.accounts.wallet.decrypt(
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
            .once('transactionHash', function (hash) {})
        return { result: 'OK', hash: receipt.hash }
    } catch (error) {
        console.error('answerCall', error)
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
        var res = (await rp.get(accountsUrl)).data

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
                        var resMedia = (await rp.get( media)).data
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
                res = (await rp.get(res.paging.next)).data
            }
        }
    } catch (e) {}
}
exports.getFacebookUsername = async (userId, idlink) => {
    try {
        const fbpage = await FbPage.findOne({ UserId: userId })
        const accessToken = fbpage.token
        const response = await fetch(
            `https://graph.facebook.com/${idlink}?access_token=${accessToken}`
        )
        const json = await response.json()
        const fbpagename = json.name
        var fbprofile = await FbPage.findOne({ name: fbpagename })
        return fbprofile.username
    } catch (err) {}
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
        var res = (await rp.get(accountsUrl)).data

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
                        var resMedia = (await rp.get(media)).data
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
                res = (await rp.get(res.paging.next)).data
            }

            if (!isInsta && res.data.length > 0) message += '_facebook'
        } else {
            message = 'page already exists'
        }
        return message
    } catch (e) {}
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
