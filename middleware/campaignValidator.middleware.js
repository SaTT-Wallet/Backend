const Joi = require('joi')

/**********
 *
 *  SCHEMA FOR JOI
 *
 *  **********************       */

// VALIDATION TRANSACTION PASSWORD
const validatePassword = () =>
    Joi.string()
        .min(8)
        .required()
        .custom((value) => {
            const RegUpperCase = RegExp('[A-Z]')
            const RegLowerCase = RegExp('[a-z]')
            const RegNumber = RegExp('[0-9]')
            const RegSpecialChar = RegExp('[^A-Za-z0-9]')
            if (
                RegUpperCase.test(value) &&
                RegLowerCase.test(value) &&
                RegNumber.test(value) &&
                RegSpecialChar.test(value)
            ) {
                return value
            } else throw Error('password not match')
        })

// VALIDATION NETWORK
const validateNetworks = (validNetworks) =>
    Joi.string()
        .required()
        .custom((value) => {
            for (let i = 0; i < validNetworks.length; i++) {
                if (validNetworks[i] === value.toString().toLowerCase()) {
                    return value
                }
            }
            throw Error('Networks supported are : ' + validNetworks)
        })

// VALIDATION ADDRESS
const validateAddress = (pattern) =>
    Joi.string().required().pattern(new RegExp(pattern))
const validateAddressNoRequried = (pattern) =>
    Joi.string().pattern(new RegExp(pattern))

// VALIDATION VERSION
const validateVersion = (validVersions) =>
    Joi.string()
        .required()
        .custom((value) => {
            for (let i = 0; i < validVersions.length; i++) {
                if (validVersions[i] === value) {
                    return value
                }
            }
            throw Error('Version supported are : ' + validVersions)
        })

// SCHEMAS OBJECT
const schemas = {
    evmApprovalSchema: Joi.object({
        campaignAddress: validateAddress('^0x[a-fA-F0-9]{40}$'),
        tokenAddress: validateAddress('^0x[a-fA-F0-9]{40}$').allow(null),
    }),

    evmAllowSchema: Joi.object({
        campaignAddress: validateAddress('^0x[a-fA-F0-9]{40}$'),
        amount: Joi.number().unsafe().required(),
        pass: Joi.string().required(),
        tokenAddress: validateAddress('^0x[a-fA-F0-9]{40}$').allow(null),
    }),

    tronApprovalSchema: Joi.object({
        version: validateVersion(['v1', 'v2']),
        pass: Joi.string().required(),
        tokenAddress: validateAddress('^T[A-Za-z1-9]{33}$'),
    }),

    tronAllowSchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        pass: Joi.string().required(),
        tokenAddress: validateAddress('^T[A-Za-z1-9]{33}$'),
    }),

    launchCampaignSchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        contract: validateAddress(
            '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
        ),
        currency: Joi.string().required(),
        dataUrl: Joi.string().required(),
        endDate: Joi.number().unsafe().required(),
        network: validateNetworks([
            'erc20',
            'bep20',
            'polygon',
            'tron',
            'bttc',
        ]),
        pass: Joi.string().required(),
        ratios: Joi.array().required(),
        startDate: Joi.number().unsafe().required(),
        tokenAddress: validateAddress(
            '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
        ).allow(null),
        idCampaign: Joi.string().required(),
        limit: Joi.number().allow(null),
    }),

    launchBountySchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        contract: validateAddress(
            '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
        ),
        currency: Joi.string().required(),
        dataUrl: Joi.string().required(),
        endDate: Joi.number().unsafe().required(),
        network: validateNetworks([
            'erc20',
            'bep20',
            'polygon',
            'tron',
            'bttc',
        ]),
        pass: Joi.string().required(),
        bounties: Joi.array(),
        startDate: Joi.number().unsafe().required(),
        tokenAddress: validateAddress(
            '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
        ),
        idCampaign: Joi.string().required(),
        limit: Joi.number().allow(null),
    }),

    idCheckSchema: Joi.object({
        id: Joi.string().required(),
    }),

    campaignPrompSchema: Joi.object({
        influencer: validateAddressNoRequried(
            '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
        ),
    }),

    expandUrlSchema: Joi.object({
        shortUrl: Joi.string().required(),
    }),

    linkNotificationsSchema: Joi.object({
        idCampaign: Joi.string().required(),
        link: Joi.string().allow('').allow(null).required(),
        idProm: Joi.string().required(),
    }),

    gainsSchema: Joi.object({
        idProm: Joi.string().required(),
        pass: Joi.string().required(),
        hash: Joi.string().required(),
    }),

    getFundsSchema: Joi.object({
        hash: Joi.string().required(),
        pass: Joi.string().required(),
        network: validateNetworks([
            'erc20',
            'bep20',
            'polygon',
            'tron',
            'bttc',
        ]),
    }),

    statLinkCampaignSchema: Joi.object({
        hash: Joi.string().required(),
    }),

    rejectLinkSchema: Joi.object({
        idCampaign: Joi.string().required(),
        reason: Joi.array().required(),
        title: Joi.string(),
        email: Joi.string(),
        idUser: Joi.string(),
        link: Joi.string(),
        lang: Joi.string(),
    }),

    coverByCampaignSchema: Joi.object({
        width: Joi.number().required(),
        height: Joi.number().required(),
    }),

    userIdCheckSchema: Joi.object({
        idUser: Joi.number().required(),
    }),

    getLinksSchema: Joi.object({
        searchTerm: Joi.string().allow(''),
        status: Joi.string().allow(''),
        campaign: Joi.string(),
        page: Joi.number().required(),
        limit: Joi.number().required(),
        version: Joi.string().custom((value) => {
            if (value === 'v1' || value === 'v2') {
                return value
            } else throw Error('Version supported are v1 / v2')
        }),
        state: Joi.string(),
        oracles: Joi.alternatives().try(Joi.string(), Joi.array()),
    }),

    validateCampaignSchema: Joi.object({
        idCampaign: Joi.string().required(),
        idLink: Joi.string().required(),
        idProm: Joi.string().allow('').required(),
        lang: Joi.string(),
        link: Joi.string().required(),
        pass: Joi.string().required(),
    }),

    applySchema: Joi.object({
        hash: Joi.string().required(),
        idCampaign: Joi.string().required(),
        idPost: Joi.string().required(),
        idUser: Joi.alternatives().try(
            Joi.string().required(),
            Joi.number().required()
        ),
        pass: Joi.string().required(),
        title: Joi.string().required(),
        typeSN: Joi.number().required(),
        version: validateVersion(['v1', 'v2']),
        linkedinId: Joi.string().allow('').allow(null),
        linkedinUserId: Joi.string().allow('').allow(null),
    }),

    saveCampaignSchema: Joi.object({
        bounties: Joi.array(),
        brand: Joi.string().allow('').required(),
        cost: Joi.number().unsafe().required(),
        cost_usd: Joi.number().unsafe().required(),
        countries: Joi.array().required(),
        description: Joi.string().allow('').required(),
        endDate: Joi.number().unsafe().required(),
        missions: Joi.array().required(),
        ratios: Joi.array().required(),
        reference: Joi.string().allow('').required(),
        remuneration: Joi.string().required(),
        resume: Joi.string().allow('').required(),
        startDate: Joi.number().unsafe().required(),
        tags: Joi.array().required(),
        title: Joi.string().allow('').required(),
        limit: Joi.number().allow(null),
        token: Joi.object({
            name: Joi.string().required(),
            type: validateNetworks([
                'erc20',
                'bep20',
                'polygon',
                'tron',
                'bttc',
            ]),
            addr: validateAddress(
                '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
            ).allow(null),
        }),
    }),

    updateCampaignSchema: Joi.object({
        bounties: Joi.array(),
        brand: Joi.string().allow(''),
        cost: Joi.string().allow(null).allow(''),
        cost_usd: Joi.string(),
        countries: Joi.array(),
        description: Joi.string().allow(''),
        endDate: Joi.number().unsafe(),
        missions: Joi.array(),
        ratios: Joi.array(),
        reference: Joi.string().allow(''),
        remuneration: Joi.string(),
        resume: Joi.string().allow(''),
        startDate: Joi.number().unsafe(),
        tags: Joi.array(),
        title: Joi.string().allow(''),
        token: Joi.object({
            name: Joi.string(),
            type: validateNetworks([
                'erc20',
                'bep20',
                'polygon',
                'tron',
                'bttc',
                'arthera',
            ]),
            addr: validateAddress(
                '^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$'
            ).allow(null),
        }),
        logo: Joi.string().allow(''),
        cover: Joi.string().allow(''),
        coverMobile: Joi.string().allow(''),
        coverSrc: Joi.string().allow(''),
        coverSrcMobile: Joi.string().allow(''),
        limit: Joi.number().allow(null),
    }),

    checkFileSchema: Joi.object({
        file: Joi.custom((value) => {
            if (
                value &&
                value.mimetype &&
                value.mimetype.startsWith('image/')
            ) {
                return value
            } else throw Error('File is required')
        }),
    }),

    addKitsSchema: Joi.object({
        link: Joi.string(),
        campaign: Joi.string().required(),
    }),

    titleCheckSchema: Joi.object({
        title: Joi.string().required(),
    }),
}

/**********
 *
 *  MIDDLEWARE VALIDATION
 *
 *  **********************       */

// MIDDLEWARE FUNCTION
const validationMiddleware = (schema, property) => (req, res, next) => {
    const { error } = schema.validate(req[property])
    if (error) throw Error(error)
    else next()
}

// CUSTOM MIDDLEWARE FOR SEND TOKEN USING BODY AND QUERY
const validationCustomMiddleware =
    (schema1, property1, schema2, property2) => (req, res, next) => {
        const { error } = schema1.validate(req[property1])
        if (error) {
            throw Error(error)
        } else {
            const { error } = schema2.validate(req[property2])
            if (error) throw Error(error)
            else next()
        }
    }

module.exports = {
    evmApprovalValidation: validationMiddleware(
        schemas.evmApprovalSchema,
        'body'
    ),
    evmAllowValidation: validationMiddleware(schemas.evmAllowSchema, 'body'),
    tronApprovalValidation: validationMiddleware(
        schemas.tronApprovalSchema,
        'body'
    ),
    tronAllowValidation: validationMiddleware(schemas.tronAllowSchema, 'body'),
    launchCampaignValidation: validationMiddleware(
        schemas.launchCampaignSchema,
        'body'
    ),
    launchBountyValidation: validationMiddleware(
        schemas.launchBountySchema,
        'body'
    ),
    idCheckValidation: validationMiddleware(schemas.idCheckSchema, 'params'),
    campaignPrompValidation: validationCustomMiddleware(
        schemas.campaignPrompSchema,
        'query',
        schemas.idCheckSchema,
        'params'
    ),
    expandUrlValidation: validationMiddleware(schemas.expandUrlSchema, 'query'),
    linkNotificationsValidation: validationMiddleware(
        schemas.linkNotificationsSchema,
        'body'
    ),
    gainsValidation: validationMiddleware(schemas.gainsSchema, 'body'),
    getFundsValidation: validationMiddleware(schemas.getFundsSchema, 'body'),
    statLinkCampaignValidation: validationMiddleware(
        schemas.statLinkCampaignSchema,
        'params'
    ),
    rejectLinkValidation: validationCustomMiddleware(
        schemas.idCheckSchema,
        'params',
        schemas.rejectLinkSchema,
        'body'
    ),
    coverByCampaignValidation: validationCustomMiddleware(
        schemas.idCheckSchema,
        'params',
        schemas.coverByCampaignSchema,
        'query'
    ),
    getLinksValidation: validationCustomMiddleware(
        schemas.userIdCheckSchema,
        'params',
        schemas.getLinksSchema,
        'query'
    ),
    validateCampaignValidation: validationMiddleware(
        schemas.validateCampaignSchema,
        'body'
    ),
    applyValidation: validationMiddleware(schemas.applySchema, 'body'),
    saveCampaignValidation: validationMiddleware(
        schemas.saveCampaignSchema,
        'body'
    ),
    updateCampaignValidation: validationCustomMiddleware(
        schemas.idCheckSchema,
        'params',
        schemas.updateCampaignSchema,
        'body'
    ),
    addKitsValidation: validationCustomMiddleware(
        schemas.checkFileSchema,
        'file',
        schemas.addKitsSchema,
        'body'
    ),
    titleCheckValidation: validationMiddleware(
        schemas.titleCheckSchema,
        'body'
    ),
}
