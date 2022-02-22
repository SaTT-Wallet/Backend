exports.mongoConnection = () => {
    let connexion = {}
    if (process.env.NODE_ENV === 'local') {
        connexion.mongoBase = process.env.MONGO_BASE_LOCAL
        connexion.mongoUser = process.env.MONGO_USER_LOCAL
        connexion.mongoPass = process.env.MONGO_PASS_LOCAL
        connexion.mongoHost = process.env.MONGO_HOST_LOCAL
        connexion.mongoPort = process.env.MONGO_PORT_LOCAL

        connexion.mongoURI =
            'mongodb://' +
            connexion.mongoHost +
            ':' +
            connexion.mongoPort +
            '/' +
            connexion.mongoBase
    }
    if (process.env.NODE_ENV === 'testnet') {
        connexion.mongoBase = process.env.MONGO_BASE_TESTNET

        connexion.mongoUser = process.env.MONGO_USER_TESTNET
        connexion.mongoPass = process.env.MONGO_PASS_TESTNET
        connexion.mongoHost = process.env.MONGO_HOST_TESTNET
        connexion.mongoPort = process.env.MONGO_PORT_TESTNET

        connexion.mongoURI =
            'mongodb://' +
            connexion.mongoUser +
            ':' +
            connexion.mongoPass +
            '@' +
            connexion.mongoHost +
            ':' +
            connexion.mongoPort +
            '/' +
            config.mongoBase
    }
    if (process.env.NODE_ENV === 'mainnet') {
        connexion.mongoBase = process.env.MONGO_BASE_MAINNET
        connexion.mongoUser = process.env.MONGO_USER_MAINNET
        connexion.mongoPass = process.env.MONGO_PASS_MAINNET
        connexion.mongoHost = process.env.MONGO_HOST_MAINNET
        connexion.mongoPort = process.env.MONGO_PORT_MAINNET

        connexion.mongoURI =
            'mongodb://' +
            connexion.mongoUser +
            ':' +
            connexion.mongoPass +
            '@' +
            connexion.mongoHost +
            ':' +
            connexion.mongoPort +
            '/' +
            config.mongoBase
    }
    return connexion
}
