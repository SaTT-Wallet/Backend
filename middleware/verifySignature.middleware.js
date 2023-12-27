const verifySignature = require('./../web3/verifySignature');
const Joi = require('joi');

const verifySignatureMiddleware = (req, res, next) => {
    const signature = req.header('X-Signature');
    const address = req.header('X-Address');
    const message = req.header('X-Message');

    if (verifySignature(message, signature, address)) {
        req.address = address;
        return next();
    } else {
        return res.status(401).json({ message: 'Invalid signature' });
    }
};

const validationMiddleware = (schema, property) => (req, res, next) => {
    const { error } = schema.validate(req[property]);
    if (error) {
        return res.status(400).json({ message: 'Validation error', error: error.details });
    } else {
        next();
    }
};

const schemas = {
    userIdCheckSchema: Joi.object({
        idUser: Joi.number().required(),
    }),
    idCheckSchema: Joi.object({
        id: Joi.string().required(),
    }),
    checkFileSchema: Joi.object({
        file: Joi.custom((value) => {
            if (value && value.mimetype && value.mimetype.startsWith('image/')) {
              return value;
            } else throw Error('File is required'); 
          }),
    }),
    addKitsSchema: Joi.object({
        link: Joi.string(),
        campaign: Joi.string().required()
    }),
};

module.exports = {
    verifySignatureMiddleware,
    validationMiddleware,
    idCheckValidation: validationMiddleware(schemas.idCheckSchema, 'params'),
    addKitsValidation: validationMiddleware(schemas.checkFileSchema, 'file', schemas.addKitsSchema, 'body'),

};
