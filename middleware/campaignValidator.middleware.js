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
    approveCampaignSchema: Joi.object({
        amount: Joi.number().unsafe().required(),
        campaignAddress: validateAddress(),
        tokenAddress: validateAddress(),
        pass: validatePassword()
    }),

    approveCampaignNetworkSchema: Joi.object({
        network: validateNetworks(["erc20", "bep20", "polygon", "tron", "bttc"]),
    }),

    campaignAllowanceSchema: Joi.object({
        campaignAddress: validateAddress(),
        tokenAddress: validateAddress(),
    }),

    campaignAllowanceNetworkSchema: Joi.object({
        network: validateNetworks(["erc20", "bep20", "polygon", "tron", "bttc"]),
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
    approveCampaignValidation: validationCustomMiddleware(schemas.approveCampaignNetworkSchema,schemas.approveCampaignSchema),
    campaignAllowanceValidation: validationCustomMiddleware(schemas.campaignAllowanceNetworkSchema, schemas.campaignAllowanceSchema)
};