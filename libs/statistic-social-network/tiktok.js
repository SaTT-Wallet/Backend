const rp = require('request-promise')
const axios = require('axios')

module.exports.tiktok = async ({
    idPost,
    tiktok_key,
    tiktok_refresh_token,
    user_tiktok_id,
}) => {
    try {
        let getUrl = `https://open-api.tiktok.com/oauth/refresh_token?client_key=${tiktok_key}&grant_type=refresh_token&refresh_token=${tiktok_refresh_token}`
        let resMedia = await rp({ uri: getUrl, json: true })
        let videoInfoResponse = await axios
            .post('https://open-api.tiktok.com/video/query/', {
                access_token: resMedia?.data.access_token,
                open_id: user_tiktok_id,
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

        if (videoInfoResponse.data?.videos) {
            return {
                likes: videoInfoResponse.data.videos[0].like_count,
                shares: videoInfoResponse.data.videos[0].share_count,
                views: videoInfoResponse.data.videos[0].view_count,
                media_url:
                    videoInfoResponse.data?.videos[0]?.cover_image_url || ' ',
            }
        }
        return videoInfoResponse.data
    } catch (error) {
        console.log(error)
        return error.message
    }
}
