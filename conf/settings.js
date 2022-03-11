const packagejson = require('../package.json')
let environment = {
    local: {
        MONGO_BASE: process.env.MONGO_BASE_LOCAL,
        MONGO_USER: process.env.MONGO_USER_LOCAL,
        MONGO_PASS: process.env.MONGO_PASS_LOCAL,
        MONGO_HOST: process.env.MONGO_HOST_LOCAL,
        MONGO_PORT: process.env.MONGO_PORT_LOCAL,
        MONGOURI:
            'mongodb://' +
            process.env.MONGO_HOST_LOCAL +
            ':' +
            process.env.MONGO_PORT_LOCAL +
            '/' +
            process.env.MONGO_BASE_LOCAL,
    },
    testnet: {
        MONGO_BASE: process.env.MONGO_BASE_TESTNET,
        MONGO_USER: process.env.MONGO_USER_TESTNET,
        MONGO_PASS: process.env.MONGO_PASS_TESTNET,
        MONGO_HOST: process.env.MONGO_HOST_TESTNET,
        MONGO_PORT: process.env.MONGO_PORT_TESTNET,
        MONGOURI:
            'mongodb://' +
            process.env.MONGO_USER_TESTNET +
            ':' +
            process.env.MONGO_PASS_TESTNET +
            '@' +
            process.env.MONGO_HOST_TESTNET +
            ':' +
            process.env.MONGO_PORT_TESTNET +
            '/' +
            process.env.MONGO_BASE_TESTNET,
    },
    mainnet: {
        MONGO_BASE: process.env.MONGO_BASE_MAINNET,
        MONGO_USER: process.env.MONGO_USER_MAINNET,
        MONGO_PASS: process.env.MONGO_PASS_MAINNET,
        MONGO_HOST: process.env.MONGO_HOST_MAINNET,
        MONGO_PORT: process.env.MONGO_PORT_MAINNET,
        MONGOURI: process.env.MONGOURI_MAINNET,
    },
}

module.exports.environment = environment
