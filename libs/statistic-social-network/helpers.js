const { config } = require('./config')

module.exports = {
    linkedinActivityUrl: (activityURN) =>
        `${config.LINKEDIN_FIRST_URL_ADRR_FIRST}${activityURN}${config.LINKEDIN_FIRST_URL_ADRR_SECOND}`,
    linkedinShareUrl: (shareURN) => `${config.LINKEDIN_SHARE_FIRST}${shareURN}`,
    linkedinStatsUrl: (type, idPost, organization) =>
        `${config.LINKEDIN_START_URL_FIRST}${type}${config.LINKEDIN_START_URL_SECOND}${type}:${idPost}${config.LINKEDIN_START_URL_THIRD}${organization}`,
    linkedinUgcPostStats: (idPost) =>
        `${config.LINKEDIN_UGC_POST_FIRST}${idPost}${config.LINKEDIN_UGC_POST_SECOND}`,
    linkedinPages: (accessToken) => {
        return {
            url: 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(*, organization~(localizedName,logoV2(original~:playableStreams))))',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            json: true,
        }
    },
    linkedinMediaUrl: (idPost) =>
        `${config.LINKEDIN_ORIGINAL_ARTICLE}${idPost}`,
}
