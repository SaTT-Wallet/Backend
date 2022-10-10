const rp = require('request-promise')
const { config } = require('./config')

module.exports.instagram = async (
    instagramAccessToken,
    instagram_id,
    idPost,
    appId,
    appSecret
) => {
    try {
        const accessToken = instagramAccessToken
        let perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        let mediaGetNewAccessToken = `${config.FACEBOOK_GRAPH_OAUTH_URL}&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`
        let resMediaAccessToken = await rp({
            uri: mediaGetNewAccessToken,
            json: true,
        })
        let media =
            config.FACEBOOK_GRAPH_FIRST_URL +
            'v11.0' +
            '/' +
            instagram_id +
            config.FACEBOOK_GRAPH_MEDIA_URL +
            resMediaAccessToken.access_token
        let resMedia = await rp({ uri: media, json: true })
        let data = resMedia.data
        for (let i = 0; i < data.length; i++) {
            if (data[i].shortcode == idPost) {
                perf.likes = data[i].like_count
                perf.media_url = data[i]?.media_url || ''
                const mediaViews =
                    config.FACEBOOK_GRAPH_FIRST_URL +
                    'v11.0' +
                    '/' +
                    data[i].id +
                    '/insights?metric=impressions&access_token=' +
                    resMediaAccessToken.access_token
                try {
                    const resMediaViews = await rp({
                        uri: mediaViews,
                        json: true,
                    })
                    let nbviews = JSON.stringify(resMediaViews)
                    perf.views = JSON.parse(nbviews).data[0].values[0].value
                } catch (error) {
                    perf.views = 0
                    return perf
                }
                break
            }
        }
        return perf
    } catch (err) {
        // console.log('error', err.message)
        return err.message
    }
}
