const { config } = require('./config')

module.exports = {
    linkedinShareUrl: (shareURN) => `${config.LINKEDIN_SHARE_FIRST}${shareURN}`,
    linkedinStatsUrl: (type, idPost, organization) =>
        `${config.LINKEDIN_START_URL_FIRST}${type}${config.LINKEDIN_START_URL_SECOND}${type}:${idPost}${config.LINKEDIN_START_URL_THIRD}${organization}`,
}
