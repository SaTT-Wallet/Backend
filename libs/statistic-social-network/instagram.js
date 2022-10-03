const rp = require('request-promise')

module.exports.instagram = async ({
    instagramAccessToken,
    instagram_id,
    idPost,
    appId,
    appSecret,
}) => {
    try {
        var accessToken = instagramAccessToken
        var perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        var mediaGetNewAccessToken = `https://graph.facebook.com/v11.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${accessToken}`
        var resMediaAccessToken = await rp({
            uri: mediaGetNewAccessToken,
            json: true,
        })
        var media =
            'https://graph.facebook.com/' +
            'v11.0' +
            '/' +
            instagram_id +
            '/media?fields=like_count,shortcode,media_url&limit=50&access_token=' +
            resMediaAccessToken.access_token
        var resMedia = await rp({ uri: media, json: true })
        var data = resMedia.data
        for (let i = 0; i < data.length; i++) {
            if (data[i].shortcode == idPost) {
                perf.likes = data[i].like_count
                perf.media_url = data[i]?.media_url || ''
                var mediaViews =
                    'https://graph.facebook.com/' +
                    'v11.0' +
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
        console.log('error', err.message)
        return err.message
    }
}
