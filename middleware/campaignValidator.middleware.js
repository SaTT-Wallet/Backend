const Joi = require('joi');



/**********
 * 
 *  SCHEMA FOR JOI
 * 
 *  **********************       */



// VALIDATION TRANSACTION PASSWORD
const validatePassword = () => Joi.string().min(8).required().custom((value) => {
    const RegUpperCase = RegExp('[A-Z]');
    const RegLowerCase = RegExp('[a-z]');
    const RegNumber = RegExp('[0-9]');
    const RegSpecialChar = RegExp('[^A-Za-z0-9]');
    if(RegUpperCase.test(value) && RegLowerCase.test(value) && RegNumber.test(value) && RegSpecialChar.test(value)) {
        return value;
    } else throw Error('password not match')
});


// VALIDATION NETWORK 
const validateNetworks = (validNetworks) => Joi.string().required().custom((value) => {
    for(let i = 0; i < validNetworks.length ; i++) {
        if(validNetworks[i] === value.toString().toLowerCase()) {
            return value;
        } 
    }
    throw Error('Networks supported are : '+ validNetworks)
    
});


// VALIDATION ADDRESS
const validateAddress = (pattern) => Joi.string().required().pattern(new RegExp(pattern));


// VALIDATION VERSION
const validateVersion = (validVersions) => Joi.string().required().custom((value) => {
    for(let i = 0; i < validVersions.length ; i++) {
        if(validVersions[i] === value) {
            return value;
        } 
    }
    throw Error('Version supported are : '+ validVersions)
    
});


// SCHEMAS OBJECT
const schemas = {
    evmApprovalSchema: Joi.object({
        campaignAddress: validateAddress("^0x[a-fA-F0-9]{40}$"),
        tokenAddress: validateAddress("^0x[a-fA-F0-9]{40}$")
    }),

    evmAllowSchema: Joi.object({
        campaignAddress: validateAddress("^0x[a-fA-F0-9]{40}$"),
        amount: Joi.number().unsafe().required(),
        pass: validatePassword(),
        tokenAddress: validateAddress("^0x[a-fA-F0-9]{40}$"),
    }),

    tronApprovalSchema: Joi.object({
        version: validateVersion(["v1", "v2"]),
        pass: validatePassword(),
        tokenAddress: validateAddress("^T[A-Za-z1-9]{33}$"),
    }),

    tronAllowSchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        pass: validatePassword(),
        tokenAddress: validateAddress("^T[A-Za-z1-9]{33}$"),
    }),


    launchCampaignSchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        contract: validateAddress("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$"),
        currency: Joi.string().required(),
        dataUrl: Joi.string().required(),
        endDate: Joi.number().unsafe().required(),
        network: validateNetworks(["erc20", "bep20", "polygon", "tron", "bttc"]),
        pass: validatePassword(),
        ratios: Joi.array().required(),
        startDate: Joi.number().unsafe().required(),
        tokenAddress: validateAddress("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$"),
        idCampaign: Joi.string().required()
    }),


    launchBountySchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        contract: validateAddress("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$"),
        currency: Joi.string().required(),
        dataUrl: Joi.string().required(),
        endDate: Joi.number().unsafe().required(),
        network: validateNetworks(["erc20", "bep20", "polygon", "tron", "bttc"]),
        pass: validatePassword(),
        bounties: Joi.array(),
        startDate: Joi.number().unsafe().required(),
        tokenAddress: validateAddress("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$"),
        idCampaign: Joi.string().required()
    }),

    idCheckSchema: Joi.object({
        id: Joi.string().required()
    })
}





/**********
 * 
 *  MIDDLEWARE VALIDATION 
 * 
 *  **********************       */


// MIDDLEWARE FUNCTION 
const validationMiddleware = (schema, property) => (req, res, next) => {
    const {error} = schema.validate(req[property]);
    if(error) throw Error(error);
    else next();
}

// CUSTOM MIDDLEWARE FOR SEND TOKEN USING BODY AND QUERY 
const validationCustomMiddleware = (schemaBody, schemaParam) => (req, res, next) => {
    const {error} = schemaParam.validate(req.params);
    if(error) {
        throw Error(error)
    } else {
        const {error} = schemaBody.validate(req.body);
        if(error) throw Error(error);
        else next();
    }
}




module.exports = {
    



    evmApprovalValidation: validationMiddleware(schemas.evmApprovalSchema, 'body'),
    evmAllowValidation: validationMiddleware(schemas.evmAllowSchema, 'body'),
    tronApprovalValidation: validationMiddleware(schemas.tronApprovalSchema, 'body'),
    tronAllowValidation: validationMiddleware(schemas.tronAllowSchema, 'body'),
    launchCampaignValidation: validationMiddleware(schemas.launchCampaignSchema, 'body'),
    launchBountyValidation: validationMiddleware(schemas.launchBountySchema, 'body'),
    idCheckValidation: validationMiddleware(schemas.idCheckSchema, 'params')
};