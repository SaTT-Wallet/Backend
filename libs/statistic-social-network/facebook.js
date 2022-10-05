const rp = require('request-promise')
const { config } = require('./config')

module.exports.facebook = async ({ accessToken, idPage, idPost }) => {
    try {
        const token = accessToken
        const res2 = await rp({
            uri:
                config.FACEBOOK_GRAPH_FIRST_URL +
                'v11.0/' +
                idPage +
                '_' +
                idPost +
                config.FACEBOOK_GRAPH_FIELDS_URL +
                token,
            json: true,
        })
        const res3 = await rp({
            uri:
                config.FACEBOOK_GRAPH_FIRST_URL +
                'v11.0/' +
                idPage +
                '_' +
                idPost +
                config.FACEBOOK_GRAPH_INSIGHTS_URL +
                token,
            json: true,
        })

        let shares = 0
        if (res2.shares) {
            shares = res2.shares.count
        }
        let likes = res3.data[0].values[0].value.like || 0
        let views = res3.data[1].values[0].value || 0
        let perf = {
            shares: shares,
            likes: likes,
            views: views,
            date: Math.floor(Date.now() / 1000),
            media_url: res2?.full_picture || '',
        }

        return perf
    } catch (err) {
        console.log('error', err.message)
        return err.message
    }
}
