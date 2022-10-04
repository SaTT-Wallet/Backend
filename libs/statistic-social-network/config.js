let config = {
    symfonySalt: process.env.SYMPHONY_SATT,
    linkedinActivityUrl: (activityURN) =>
        `${process.env.LINKEDIN_FIRST_URL_ADRR_FIRST}${activityURN}${process.env.LINKEDIN_FIRST_URL_ADRR_SECOND}`,
    linkedinShareUrl: (shareURN) =>
        `${process.env.LINKEDIN_SHARE_FIRST}${shareURN}`,
    linkedinStatsUrl: (type, idPost, organization) =>
        `${process.env.LINKEDIN_START_URL_FIRST}${type}${process.env.LINKEDIN_START_URL_SECOND}${type}:${idPost}${process.env.LINKEDIN_START_URL_THIRD}${organization}`,
    linkedinUgcPostStats: (idPost) =>
        `${process.env.LINKEDIN_UGC_POST_FIRST}${idPost}${process.env.LINKEDIN_UGC_POST_SECOND}`,
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
        `${process.env.LINKEDIN_ORIGINAL_ARTICLE}${idPost}`,
}
