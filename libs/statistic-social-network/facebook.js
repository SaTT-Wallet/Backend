const rp = require('request-promise')

module.exports.facebook = async ({ accessToken, idPage, idPost }) => {
    try {
        var token = accessToken
        var res2 = await rp({
            uri:
                'https://graph.facebook.com/' +
                'v11.0/' +
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
                'v11.0/' +
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
            media_url: res2?.full_picture || ' ',
        }

        return perf
    } catch (err) {
        console.log('error', err.message)
        return err.message
    }
}
