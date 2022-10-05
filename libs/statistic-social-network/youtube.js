const rp = require('request-promise')
const { config } = require('./config')

module.exports.youtube = async ({ idPost, googleApiKey }) => {
    try {
        if (idPost.indexOf('&') !== -1) {
            idPost = idPost.split('&')[0]
        }
        let perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        const body = await rp({
            uri: config.YOUTUBE_VIDEO_URL,
            qs: {
                id: idPost,
                key: googleApiKey,
                part: 'statistics',
            },
        })
        const res = JSON.parse(body)
        const media = await rp({
            uri: `${config.YOUTUBE_OEMBED_URL}${idPost}&format=json`,
            json: true,
        })
        if (res.items && res.items[0]) {
            perf = {
                shares: 0 /*res.items[0].statistics.commentCount*/,
                likes: res.items[0].statistics.likeCount,
                views: res.items[0].statistics.viewCount,
                date: Math.floor(Date.now() / 1000),
                media_url: media?.thumbnail_url || '',
            }
        }
        return perf
    } catch (err) {
        console.log(err.message)
        return err.message
    }
}
