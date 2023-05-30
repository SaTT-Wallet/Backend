const Joi = require('joi');

/** SCHEMAAAAA */
const getCodeKeyStoreSchema = Joi.object({
    network:Joi.string().required().custom((value, helpers) => {
        if(value.toString().toLowerCase() === "eth" || value.toString().toLowerCase() === "btc" || value.toString().toLowerCase() === "tron") {
            return value;
        } else throw Error('Invalid network')
    }),
    version:Joi.string().length(1).required().custom((value, helpers) => {
        if(value === '1' || value === '2') {
            return value;
        } else throw Error('Invalid version')
    })
})

const exportKeyStoreSchema = Joi.object({
    code:Joi.number().required(),
    network:Joi.string().required().custom((value, helpers) => {
        if(value.toString().toLowerCase() === "eth" || value.toString().toLowerCase() === "btc" || value.toString().toLowerCase() === "tron") {
            return value;
        } else throw Error('Invalid network')
    }),
    version:Joi.string().length(1).required().custom((value, helpers) => {
        if(value === '1' || value === '2') {
            return value;
        } else throw Error('Invalid version')
    })
})

const walletVersionSchema = Joi.object({
    version: Joi.string().required().custom((value, helpers) => {
        if(value === "v1" || value === "v2") {
            return value;
        } else throw Error('Invalid version')
    })
})

const networkSchema = Joi.object({
    network: Joi.string().required().custom((value, helpers) => {
        if(value.toString().toLowerCase() === "erc20" || value.toString().toLowerCase() === "bep20" || value.toString().toLowerCase() === "polygon" || value.toString().toLowerCase() === "bttc" || value.toString().toLowerCase() === "tron") {
            return value;
        } else throw Error('Invalid network')
    })
})

const checkTokenSchema = Joi.object({
    network: Joi.string().required().custom((value, helpers) => {
        if(value.toString().toLowerCase() === "erc20" || value.toString().toLowerCase() === "bep20" || value.toString().toLowerCase() === "polygon") {
            return value;
        } else throw Error('Network not supported')
    }),
    tokenAdress: Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$")),
})

const checkEVMAddressSchema = Joi.object({
    address: Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$")),
})


const tokenSchema = Joi.object({
    tokenAdress: Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$")),
    decimal: Joi.number().required(),
    symbol: Joi.string().required(),
    network: Joi.string().required().custom((value, helpers) => {
        if(value.toString().toLowerCase() === "erc20" || value.toString().toLowerCase() === "bep20" || value.toString().toLowerCase() === "polygon") {
            return value;
        } else throw Error('Network not supported')
    }),
    tokenName: Joi.string().required()
})

const passwordCheckSchema = Joi.object({
    pass: Joi.string().min(8).required().custom((value, helpers) => {
        const RegUpperCase = RegExp('[A-Z]');
        const RegLowerCase = RegExp('[a-z]');
        const RegNumber = RegExp('[0-9]');
        const RegSpecialChar = RegExp('[^A-Za-z0-9]');
        if(RegUpperCase.test(value) && RegLowerCase.test(value) && RegNumber.test(value) && RegSpecialChar.test(value)) {
            return value;
        } else throw Error('password not match')
    }),
})


const paymentRequestSchema = Joi.object({
    currency: Joi.string().required(),
    idWallet: Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$")),
    quote_id: Joi.string().required(),
    
})


const getQuoteSchema = Joi.object({
    digital_currency: Joi.string().required(),
    requested_amount: Joi.number().required(),
    fiat_currency: Joi.string().required(),
    requested_currency : Joi.string().required(),
})


const sendTokenSchema = Joi.object({
    amount: Joi.number().required(),
    from: Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$")),
    network: Joi.string().required(),
    pass: Joi.string().min(8).required().custom((value, helpers) => {
        const RegUpperCase = RegExp('[A-Z]');
        const RegLowerCase = RegExp('[a-z]');
        const RegNumber = RegExp('[0-9]');
        const RegSpecialChar = RegExp('[^A-Za-z0-9]');
        if(RegUpperCase.test(value) && RegLowerCase.test(value) && RegNumber.test(value) && RegSpecialChar.test(value)) {
            return value;
        } else throw Error('password not match')
    }),
    to : Joi.string().required().pattern(new RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$")),
    tokenAddress : Joi.string().required().custom((value, helpers) => {
        if(value === null || RegExp("^0x[a-fA-F0-9]{40}$|^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$|T[A-Za-z1-9]{33}$").test(value)) {
            return value;
        } else throw Error('Invalid smart contract')
    }),
    tokenSymbol :  Joi.string().required(),
})







/**  MIDDLEWARE  */
const walletVersionValidation = (req, res, next) => {
    const { error, value } = walletVersionSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}

const getCodeKeyStoreValidation = (req, res, next) => {
    const {error, value} = getCodeKeyStoreSchema.validate(req.body);
    if(error) {
        throw Error(error)
    } else next();
}
const exportKeyStoreValidation = (req, res, next) => {
    const {error, value} = exportKeyStoreSchema.validate(req.body);
    if(error) {
        throw Error(error)
    } else next();
}
const networkValidation = (req, res, next) => {
    const { error, value } = networkSchema.validate(req.params)
    if(error) {
        throw Error(error)
    } else next();
}

const checkTokenValidation = (req, res, next) => {
    const { error, value } = checkTokenSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}


const checkEVMValidation = (req, res, next) => {
    const { error, value } = checkEVMAddressSchema.validate(req.params)
    if(error) {
        throw Error(error)
    } else next();
}

const addNewTokenValidation = (req, res, next) => {
    const { error, value } = tokenSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}


const passwordCheckValidation = (req, res, next) => {
    const { error, value } = passwordCheckSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}

const paymentRequestValidation = (req, res, next) => {
    const { error, value } = paymentRequestSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}

const getQuoteValidation = (req, res, next) => {
    const { error, value } = getQuoteSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}


const sendTokenValidation = (req, res, next) => {
    const { error, value } = sendTokenSchema.validate(req.body)
    if(error) {
        throw Error(error)
    } else next();
}


module.exports = {
    getCodeKeyStoreValidation, 
    exportKeyStoreValidation,
    walletVersionValidation,
    networkValidation,
    checkTokenValidation,
    checkEVMValidation,
    addNewTokenValidation,
    passwordCheckValidation,
    paymentRequestValidation,
    getQuoteValidation,
    sendTokenValidation
};