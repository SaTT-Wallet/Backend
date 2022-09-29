const Twitter2 = require('twitter-v2')

module.exports.twitter = async function ({
    idPost,
    access_token_key,
    twitter_consumer_secret,
    twitter_consumer_key,
    twitter_access_token_secret,
}) {
    try {
        var tweet = new Twitter2({
            consumer_key: twitter_consumer_key,
            consumer_secret: twitter_consumer_secret,
            access_token_key: access_token_key,
            access_token_secret: twitter_access_token_secret,
        })

        var res = await tweet.get('tweets', {
            ids: '1566707450832736256',
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
                media_url: res.includes?.media[0]?.url || ' ',
                views: 'old',
            }

            return perf
        }

        var perf = {
            shares: res.data[0].public_metrics.retweet_count,
            likes: res.data[0].public_metrics.like_count,
            views: res.data[0].non_public_metrics.impression_count,
            date: Math.floor(Date.now() / 1000),
            media_url: res.includes?.media[0]?.url || ' ',
        }

        return perf
    } catch (err) {
        console.log(err.message)
        return err.message
    }
}
