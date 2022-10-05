const rp = require('request-promise')
const axios = require('axios')
const { linkedinStatsUrl, linkedinShareUrl } = require('./helpers')
const { config } = require('./config')

module.exports.linkedin = async ({
    organization,
    idPost,
    type,
    linkedinKey,
    linkedinSecret,
    accessToken,
    refreshToken,
}) => {
    try {
        var perf = { shares: 0, likes: 0, views: 0, mediaUrl: '' }
        const params = new URLSearchParams()
        params.append('client_id', linkedinKey)
        params.append('client_secret', linkedinSecret)
        params.append('token', accessToken)

        let tokenValidityBody = await axios.post(
            config.LINKEDIN_OAUTH_URL,
            params
        )

        if (!tokenValidityBody.data?.active) {
            let accessTokenUrl = `${config.LINKEDIN_SECOND_OAUTH_URL}${refreshToken}&client_id=${linkedinKey}&client_secret=${linkedinSecret}`
            let resAccessToken = await rp({ uri: accessTokenUrl, json: true })
            accessToken = resAccessToken.access_token
        }

        let url = linkedinStatsUrl(type, idPost, organization)

        const linkedinStatsData = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }

        var body = await rp(linkedinStatsData)

        const linkedinMediaData = {
            url: linkedinShareUrl(idPost),
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        let postData = await rp(linkedinMediaData)
        let urn = idPost
        if (postData.results[urn].content)
            perf.mediaUrl =
                postData.results[urn].content.contentEntities[0].entityLocation
        if (body.elements.length) {
            perf.views = body.elements[0]?.totalShareStatistics.impressionCount
            perf.likes = body.elements[0]?.totalShareStatistics.likeCount
            perf.shares = body.elements[0]?.totalShareStatistics.shareCount
        }

        return perf
    } catch (err) {
        console.log(err.message)
        return err.message
    }
}
