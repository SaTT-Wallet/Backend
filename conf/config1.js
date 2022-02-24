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

exports.getToken = () => {
    let Tokens = {}

    if (
        process.env.NODE_ENV === 'testnet' ||
        process.env.NODE_ENV === 'local'
    ) {
        Tokens = {
            SATT: {
                name: process.env.TOKEN_SATT_NAME,
                symbol: process.env.TOKEN_SATT_SYMBOL,
                undername: process.env.TOKEN_SATT_UNDERNAME,
                undername2: process.env.TOKEN_SATT_UNDERNAME2,
                contract: process.env.TOKEN_SATT_CONTRACT,
                dicimal: process.env.TOKEN_SATT_DICIMAL,
                network: process.env.TOKEN_SATT_NETWORK,
            },
            WSATT: {
                name: process.env.TOKEN_WSATT_NAME,
                symbol: process.env.TOKEN_WSATT_SYMBOL,
                undername: process.env.TOKEN_WSATT_UNDERNAME,
                undername2: process.env.TOKEN_WSATT_UNDERNAME2,
                contract: process.env.TOKEN_WSATT_CONTRACT,
                dicimal: process.env.TOKEN_WSATT_DICIMAL,
                network: process.env.TOKEN_WSATT_NETWORK,
            },
            SATT_BEP20: {
                name: process.env.TOKEN_SATT_BEP20_NAME,
                symbol: process.env.TOKEN_SATT_BEP20_SYMBOL,
                undername: process.env.TOKEN_SATT_BEP20_UNDERNAME,
                undername2: process.env.TOKEN_SATT_BEP20_UNDERNAME2,
                contract: process.env.TOKEN_SATT_BEP20_CONTRACT,
                dicimal: process.env.TOKEN_SATT_BEP20_DICIMAL,
                network: process.env.TOKEN_SATT_BEP20_NETWORK,
            },
            OMG: {
                name: process.env.TOKEN_OMG_NAME,
                symbol: process.env.TOKEN_OMG_SYMBOL,
                undername: process.env.TOKEN_OMG_UNDERNAME,
                undername2: process.env.TOKEN_OMG_UNDERNAME2,
                contract: process.env.TOKEN_OMG_CONTRACT,
                dicimal: process.env.TOKEN_OMG_DICIMAL,
                network: process.env.TOKEN_OMG_NETWORK,
            },
            DAI: {
                name: process.env.TOKEN_DAI_NAME,
                symbol: process.env.TOKEN_DAI_SYMBOL,
                undername: process.env.TOKEN_DAI_UNDERNAME,
                undername2: process.env.TOKEN_DAI_UNDERNAME2,
                contract: process.env.TOKEN_DAI_CONTRACT,
                dicimal: process.env.TOKEN_DAI_DICIMAL,
                network: process.env.TOKEN_DAI_NETWORK,
            },
            USDT: {
                name: process.env.TOKEN_USDT_NAME,
                symbol: process.env.TOKEN_USDT_SYMBOL,
                undername: process.env.TOKEN_USDT_UNDERNAME,
                undername2: process.env.TOKEN_SATT_BEP20_NETWORK,
                contract: process.env.TOKEN_USDT_UNDERNAME2,
                dicimal: process.env.TOKEN_USDT_DICIMAL,
                network: process.env.TOKEN_USDT_NETWORK,
            },
            ZRX: {
                name: process.env.TOKEN_ZRX_NAME,
                symbol: process.env.TOKEN_ZRX_SYMBOL,
                undername: process.env.TOKEN_ZRX_UNDERNAME,
                undername2: process.env.TOKEN_ZRX_UNDERNAME2,
                contract: process.env.TOKEN_ZRX_CONTRACT,
                dicimal: process.env.TOKEN_ZRX_DICIMAL,
                network: process.env.TOKEN_ZRX_NETWORK,
            },
            MKR: {
                name: process.env.TOKEN_MKR_NAME,
                symbol: process.env.TOKEN_MKR_SYMBOL,
                undername: process.env.TOKEN_MKR_SYMBOL,
                undername2: process.env.TOKEN_MKR_UNDERNAME,
                contract: process.env.TOKEN_MKR_CONTRACT,
                dicimal: process.env.TOKEN_MKR_DICIMAL,
                network: process.env.TOKEN_MKR_NETWORK,
            },
            BNB: {
                name: process.env.TOKEN_BNB_NAME,
                symbol: process.env.TOKEN_BNB_SYMBOL,
                undername: process.env.TOKEN_BNB_UNDERNAME,
                undername2: process.env.TOKEN_BNB_UNDERNAME2,
                contract: process.env.TOKEN_BNB_CONTRACT,
                dicimal: process.env.TOKEN_BNB_DICIMAL,
                network: process.env.TOKEN_BNB_NETWORK,
            },
            CAKE: {
                name: process.env.TOKEN_CAKE_NAME,
                symbol: process.env.TOKEN_CAKE_SYMBOL,
                undername: process.env.TOKEN_CAKE_UNDERNAME,
                undername2: process.env.TOKEN_CAKE_UNDERNAME2,
                contract: process.env.TOKEN_CAKE_CONTRACT,
                dicimal: process.env.TOKEN_CAKE_DICIMAL,
                network: process.env.TOKEN_CAKE_NETWORK,
            },
            BUSD: {
                name: process.env.TOKEN_BUSD_NAME,
                symbol: process.env.TOKEN_BUSD_SYMBOL,
                undername: process.env.TOKEN_BUSD_UNDERNAME,
                undername2: process.env.TOKEN_BUSD_UNDERNAME2,
                contract: process.env.TOKEN_BUSD_CONTRACT,
                dicimal: process.env.TOKEN_BUSD_DICIMAL,
                network: process.env.TOKEN_BUSD_NETWORK,
            },
        }
        return Tokens
    }
}
