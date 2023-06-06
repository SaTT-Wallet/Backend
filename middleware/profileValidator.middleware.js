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


// VALIDATION ADDRESS
const validateAddress = (pattern) => Joi.string().required().pattern(new RegExp(pattern));




// SCHEMAS OBJECT
const schemas = {
    checkFileSchema: Joi.object({
        mimetype: Joi.string().custom((value, helpers) => {
            if (value && value.startsWith('image/')) {
                return value;
            } else {
                throw new Error('File mimetype must start with "image/"');
            }
        }).required()
    }).unknown(true),

    UpdateInterstsSchema: Joi.object({
        interests: Joi.array().items(Joi.string()).required(),
    }),

    idCheckSchema: Joi.object({
        id: Joi.string().required()
    }),

    confrimChangeMailSchema: Joi.object({
        code: Joi.number().required()
    }),

    supportSchema: Joi.object({
        name: Joi.string().allow(''),
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        subject: Joi.string().allow(''),
        message: Joi.string().allow('')
    }),

    changeEmailSchema: Joi.object({
        pass: validatePassword(),
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
    }),

    requestMoneySchema: Joi.object({
        cryptoCurrency: Joi.string().required(),
        from: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        message: Joi.string().allow(''),
        name: Joi.string().allow(''),
        price: Joi.number().unsafe().required(),
        to: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        wallet: validateAddress("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$"),
    }),

    idUserCheckSchema: Joi.object({
        idUser: Joi.string().required()
    }),

    updateProfileSchema: Joi.alternatives().try(
        Joi.object({
            address: Joi.string().allow('').required(),
            birthday: Joi.string().allow('').required(),
            city: Joi.string().allow('').required(),
            country: Joi.string().allow('').required(),
            email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
            firstName: Joi.string().allow('').required(),
            gender: Joi.string().allow('').required(),
            lastName: Joi.string().allow('').required(),
            locale: Joi.string().allow('').required(),
            phone: Joi.object({
                number: Joi.string().required(),
                internationalNumber: Joi.string().required(),
                nationalNumber: Joi.string().required(),
                e164Number: Joi.string().required(),
                countryCode: Joi.string().length(2).required(),
                dialCode: Joi.string().required()
            }).allow(null).required()
        }),
        Joi.object({
            photoUpdated: Joi.boolean().required()
        })
    ),
    
    


    deleteLinkedinChannelSchema: Joi.object({
        linkedinId: Joi.string().required(),
        organization: Joi.string().required(),
    }),

    verifyLinkSchema: Joi.object({
        typeSN: Joi.number().required(),
        idUser: Joi.string().required(),
        idPost: Joi.string().required()
    }),

    ShareByActivitySchema: Joi.object({
        activity: Joi.string().required(),
    }),

    uploadFileLegalKycSchema: Joi.object({
        mimetype: Joi.string().custom((value) => {
            if (value && (value.startsWith('image/') || value === 'application/pdf')) {
                return value;
            } else {
                throw new Error('File mimetype must start with "image/"');
            }
        }).required()
    }).unknown(true),

    addUserLegalProfileSchema: Joi.object({
        type: Joi.string().required(),
        typeProof: Joi.string().allow('').required()
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
const validationCustomMiddleware = (schema1, property1, schema2, property2) => (req, res, next) => {
    const {error} = schema1.validate(req[property1]);
    if(error) {
        throw Error(error)
    } else {
        const {error} = schema2.validate(req[property2]);
        if(error) throw Error(error);
        else next();
    }
}





module.exports = {
    addProfilePictureValidation: validationMiddleware(schemas.checkFileSchema, 'file'),
    UpdateInterstsValidation: validationMiddleware(schemas.UpdateInterstsSchema, 'body'),
    idCheckValidation: validationMiddleware(schemas.idCheckSchema, 'params'),
    confrimChangeMailValidation: validationMiddleware(schemas.confrimChangeMailSchema, 'body'),
    supportValidation: validationMiddleware(schemas.supportSchema, 'body'),
    changeEmailValidation: validationMiddleware(schemas.changeEmailSchema, 'body'),
    requestMoneyValidation: validationMiddleware(schemas.requestMoneySchema, 'body'),
    idUserCheckValidation: validationMiddleware(schemas.idUserCheckSchema, 'params'),
    updateProfileValidation: validationMiddleware(schemas.updateProfileSchema, 'body'),
    deleteLinkedinChannelValidation: validationMiddleware(schemas.deleteLinkedinChannelSchema, 'params'),
    verifyLinkValidation: validationMiddleware(schemas.verifyLinkSchema, 'params'),
    ShareByActivityValidation: validationMiddleware(schemas.ShareByActivitySchema, 'params'),
    addUserLegalProfileValidation: validationCustomMiddleware(schemas.uploadFileLegalKycSchema, 'file', schemas.addUserLegalProfileSchema, 'body')
};