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





// SCHEMAS OBJECT
const schemas = {
    purgeAccountSchema: Joi.object({
        password: validatePassword(),
        reason: Joi.string()
    }),

    changePasswordSchema: Joi.object({
        newpass: validatePassword(),
        oldpass: validatePassword()
    }),

    emailConnectionSchema: Joi.object({
        username: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        password: validatePassword()
    }),

    codeRecoverSchema: Joi.object({
        mail: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        lang: Joi.string()
    }),
    
    confirmCodeSchema: Joi.object({
        code: Joi.number().required(),
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        type: Joi.string().required().custom((value) => {
            if(value === "reset" || value === "validation") return value;
            else throw Error("Type must be 'reset'")
        })
    }),

    passRecoverSchema: Joi.object({
        newpass: validatePassword(),
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        code: Joi.number().required()
    }),

    emailSignupSchema: Joi.object({
        password: validatePassword(),
        username: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        lang: Joi.string(),
        newsLetter: Joi.boolean()
    }),

    resendConfirmationTokenSchema: Joi.object({
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        lang: Joi.string()
    }),

    authAppleSchema: Joi.object({
        id_apple: Joi.string().required(),
        mail: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/),
        idSN: Joi.number().required(),
        name: Joi.string()
    }),

    logoutSchema: Joi.object({
        idUser: Joi.number().required(),
    }),

    setVisitSignUpStepSchema: Joi.object({
        userId: Joi.number().required(),
        visitedStep: Joi.string().required()
    }),

    socialdisconnectSchema: Joi.object({
        social: Joi.string().required(),
    }),

    saveFirebaseAccessTokenSchema: Joi.object({
        fb_accesstoken: Joi.string().required()
    }),

    updateLastStepSchema: Joi.object({
        completed: Joi.boolean().required(),
        email: Joi.string().email({ tlds: { allow: false } }).regex(/^[^@]+@[^@]+\.[^@]+$/).required(),
        firstName: Joi.string(),
        lastName: Joi.string()
    }),

    verifyQrCodeSchema: Joi.object({
        code: Joi.number().required(),
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





module.exports = {
    purgeAccountValidation: validationMiddleware(schemas.purgeAccountSchema, 'body'),
    changePasswordValidation: validationMiddleware(schemas.changePasswordSchema, 'body'),
    emailConnectionValidation: validationMiddleware(schemas.emailConnectionSchema, 'body'),
    codeRecoverValidation: validationMiddleware(schemas.codeRecoverSchema, 'body'),
    confirmCodeValidation: validationMiddleware(schemas.confirmCodeSchema, 'body'),
    passRecovervalidation: validationMiddleware(schemas.passRecoverSchema, 'body'),
    emailSignupValidation: validationMiddleware(schemas.emailSignupSchema, 'body'),
    resendConfirmationTokenValidation: validationMiddleware(schemas.resendConfirmationTokenSchema, 'body'),
    authAppleValidation: validationMiddleware(schemas.authAppleSchema, 'body'),
    logoutValidation: validationMiddleware(schemas.logoutSchema, 'params'),
    setVisitSignUpStepValidation: validationMiddleware(schemas.setVisitSignUpStepSchema, 'body'),
    socialdisconnectValidation: validationMiddleware(schemas.socialdisconnectSchema, 'params'),
    saveFirebaseAccessTokenValidation: validationMiddleware(schemas.saveFirebaseAccessTokenSchema, 'body'),
    updateLastStepValidation: validationMiddleware(schemas.updateLastStepSchema, 'body'),
    verifyQrCodeValidation: validationMiddleware(schemas.verifyQrCodeSchema, 'body')
};