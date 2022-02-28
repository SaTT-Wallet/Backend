const { linkedinActivityUrl } = require('../conf/config1')

exports.getLinkedinLinkInfo = async (accessToken, activityURN) => {
    try {
        let linkInfo = {}
        const linkedinData = {
            url: linkedinActivityUrl(activityURN),
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
            },
            json: true,
        }
        console.log('data', linkedinData)
        let postData = await rp(linkedinData)
        console.log(postData)
        let urn = `urn:li:activity:${activityURN}`
        linkInfo.idUser =
            postData.results[urn]['domainEntity~'].owner ??
            postData.results[urn]['domainEntity~'].author
        linkInfo.idPost = postData.results[urn]['domainEntity']
        if (postData.results[urn]['domainEntity~'].content)
            linkInfo.mediaUrl =
                postData.results[urn][
                    'domainEntity~'
                ].content.contentEntities[0].entityLocaion
        return linkInfo
    } catch (err) {
        console.log(err.message)
    }
}
