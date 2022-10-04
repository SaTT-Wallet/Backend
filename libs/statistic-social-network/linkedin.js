module.exports.linkedin = async ({
    organization,
    idPost,
    type,
    accessToken,
}) => {
    try {
        var perf = { shares: 0, likes: 0, views: 0 }
        const params = new URLSearchParams()
        params.append('client_id', process.env.LINKEDIN_KEY)
        params.append('client_secret', process.env.LINKEDIN_SECRET)
        params.append('token', accessToken)
        let tokenValidityBody = await axios.post(
            'https://www.linkedin.com/oauth/v2/introspectToken',
            params
        )
        if (!tokenValidityBody.data?.active) {
            let accessTokenUrl = `https://www.linkedin.com/oauth/v2/accessToken?grant_type=refresh_token&refresh_token=${linkedinProfile.refreshToken}&client_id=${process.env.LINKEDIN_KEY}&client_secret=${process.env.LINKEDIN_SECRET}`
            let resAccessToken = await rp({ uri: accessTokenUrl, json: true })
            accessToken = resAccessToken.access_token
        }

        let url = config.linkedinStatsUrl(type, idPost, organization)

        const linkedinData = {
            url: url,
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        console.log('linkedinData', linkedinData)
        var body = await rp(linkedinData)
        if (body.elements.length) {
            perf.views = body.elements[0]?.totalShareStatistics.impressionCount
            perf.likes = body.elements[0]?.totalShareStatistics.likeCount
            perf.shares = body.elements[0]?.totalShareStatistics.shareCount
        }
        // if (type !== 'share') {
        //     const linkedinVideoData = {
        //         url: config.linkedinUgcPostStats(idPost),
        //         method: 'GET',
        //         headers: {
        //             Authorization: 'Bearer ' + accessToken,
        //         },
        //         json: true,
        //     }
        //     var bodyVideo = await rp(linkedinVideoData)
        //     perf.views = bodyVideo.elements[0].value
        // }
        return perf
    } catch (err) {
        console.log(err.message)
        return err.message
    }
}
