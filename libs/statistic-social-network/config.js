module.exports.config = {
    LINKEDIN_SHARE_FIRST:
        'https://api.linkedin.com/v2/shares?ids=urn:li:share:',
    LINKEDIN_START_URL_FIRST:
        'https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&',
    LINKEDIN_START_URL_SECOND: 's[0]=urn:li:',
    LINKEDIN_START_URL_THIRD: '&organizationalEntity=',
    LINKEDIN_OAUTH_URL: 'https://www.linkedin.com/oauth/v2/introspectToken',
    LINKEDIN_SECOND_OAUTH_URL:
        'https://www.linkedin.com/oauth/v2/accessToken?grant_type=refresh_token&refresh_token=',
    FACEBOOK_GRAPH_FIRST_URL: 'https://graph.facebook.com/',
    FACEBOOK_GRAPH_FIELDS_URL: '?fields=shares,full_picture&access_token=',
    FACEBOOK_GRAPH_MEDIA_URL:
        '/media?fields=like_count,shortcode,media_url&limit=50&access_token=',
    FACEBOOK_GRAPH_INSIGHTS_URL:
        '/insights?metric=post_reactions_by_type_total,post_impressions&period=lifetime&access_token=',
    FACEBOOK_GRAPH_OAUTH_URL:
        'https://graph.facebook.com/v11.0/oauth/access_token?grant_type=fb_exchange_token',
    TIKTOK_OAUTH_URL: 'https://open-api.tiktok.com/oauth/refresh_token?',
    TIKTOK_VIDEO_URL: 'https://open-api.tiktok.com/video/query/',
    YOUTUBE_VIDEO_URL: 'https://www.googleapis.com/youtube/v3/videos',
    YOUTUBE_OEMBED_URL:
        'https://www.youtube.com/oembed?url=https%3A//youtube.com/watch%3Fv%3D',
}
