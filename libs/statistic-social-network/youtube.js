const rp = require('request-promise')

module.exports.youtube = async ({ idPost, googleApiKey }) => {
    try {
        if (idPost.indexOf('&') !== -1) {
            idPost = idPost.split('&')[0]
        }
        var perf = { shares: 0, likes: 0, views: 0, media_url: '' }
        var body = await rp({
            uri: 'https://www.googleapis.com/youtube/v3/videos',
            qs: {
                id: idPost,
                key: googleApiKey,
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
                media_url: media?.thumbnail_url || '',
            }
        }
        return perf
    } catch (err) {
        console.log(err.message)
        return err.message
    }
}
