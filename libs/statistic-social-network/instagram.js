module.exports.instagram = async (UserId, link) => {
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
                        perf.media_url = data[i]?.media_url || ' '
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
