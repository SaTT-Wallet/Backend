const { auth } = require('google-auth-library')
const { Token } = require('graphql')
const { environment } = require('./settings')

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
        connexion.mongoBase = environment.testnet.MONGO_BASE

        connexion.mongoUser = environment.testnet.MONGO_USER
        connexion.mongoPass = environment.testnet.MONGO_PASS
        connexion.mongoHost = environment.testnet.MONGO_HOST
        connexion.mongoPort = environment.testnet.MONGO_PORT

        connexion.mongoURI = environment.testnet.MONGOURI
    }
    if (process.env.NODE_ENV === 'mainnet') {
        connexion.mongoBase = environment.mainnet.MONGO_BASE

        connexion.mongoUser = environment.mainnet.MONGO_USER
        connexion.mongoPass = environment.mainnet.MONGO_PASS
        connexion.mongoHost = environment.mainnet.MONGO_HOST
        connexion.mongoPort = environment.mainnet.MONGO_PORT

        connexion.mongoURI = environment.mainnet.MONGOURI
    }
    return connexion
}

exports.payementRequest = async (payment) => {
    return {
        account_details: {
            app_provider_id: 'satt',
            app_version_id: '1.3.1',
            app_end_user_id: payment._id,
            app_install_date: payment.installDate,
            email: payment.email,
            phone: '',
            signup_login: {
                ip: payment.addressIp,
                location: '',
                uaid: process.env.PAYEMENT_REQUEST_UAID,
                accept_language: payment.language,
                http_accept_language: payment.language,
                user_agent: payment.user_agent,
                cookie_session_id: process.env.COOKIE_SESSION_ID,
                timestamp: payment.installDate,
            },
        },
        transaction_details: {
            payment_details: {
                quote_id: payment.quote_id,
                payment_id: payment.uuid,
                order_id: payment.order_id,
                destination_wallet: {
                    currency: payment.currency || 'ETH',
                    address: payment.idWallet,
                    tag: '',
                },
                original_http_ref_url: process.env.BASED_URL,
            },
        },
    }
}

let sattContract, sattBEP20CONTRACT, daiContract, busdContract, usdtContract

if (process.env.NODE_ENV === 'testnet' || process.env.NODE_ENV === 'local') {
    sattContract = process.env.TOKEN_SATT_CONTRACT_TESTNET
    sattBEP20CONTRACT = process.env.TOKEN_SATT_BEP20_CONTRACT_TESTNET
    daiContract = process.env.TOKEN_DAI_CONTRACT_TESTNET
    usdtContract = process.env.TOKEN_USDT_CONTRACT_TESTNET
    busdContract = process.env.TOKEN_BUSD_CONTRACT_TESTNET
} else {
    sattContract = process.env.TOKEN_SATT_CONTRACT
    sattBEP20CONTRACT = process.env.TOKEN_SATT_BEP20_CONTRACT
    daiContract = process.env.TOKEN_DAI_CONTRACT
    usdtContract = process.env.TOKEN_USDT_CONTRACT
    busdContract = process.env.TOKEN_BUSD_CONTRACT
}
let Tokens = {
    SATT: {
        name: process.env.TOKEN_SATT_NAME,
        symbol: process.env.TOKEN_SATT_SYMBOL,
        undername: process.env.TOKEN_SATT_UNDERNAME,
        undername2: process.env.TOKEN_SATT_UNDERNAME2,
        contract: sattContract,
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
        contract: sattBEP20CONTRACT,
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
        contract: daiContract,
        dicimal: process.env.TOKEN_DAI_DICIMAL,
        network: process.env.TOKEN_DAI_NETWORK,
    },
    USDT: {
        name: process.env.TOKEN_USDT_NAME,
        symbol: process.env.TOKEN_USDT_SYMBOL,
        undername: process.env.TOKEN_USDT_UNDERNAME,
        undername2: process.env.TOKEN_SATT_BEP20_NETWORK,
        contract: usdtContract,
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
        contract: busdContract,
        dicimal: process.env.TOKEN_BUSD_DICIMAL,
        network: process.env.TOKEN_BUSD_NETWORK,
    },
}

let token200 = [
    {
        id: 8104,
        name: '1inch Network',
        symbol: '1INCH',
        slug: '1inch',
        rank: 118,
        is_active: 1,
        first_historical_data: '2020-12-24T01:05:00.000Z',
        last_historical_data: '2021-10-22T10:10:09.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x111111111117dc0aa78b770fa6a738034120c302',
            decimals: 18,
        },
    },
    {
        id: 7278,
        name: 'Aave',
        symbol: 'AAVE',
        slug: 'aave',
        rank: 45,
        is_active: 1,
        first_historical_data: '2020-10-04T12:56:22.000Z',
        last_historical_data: '2021-10-22T10:06:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
            decimals: 18,
        },
    },
    {
        id: 8766,
        name: 'MyNeighborAlice',
        symbol: 'ALICE',
        slug: 'myneighboralice',
        rank: 188,
        is_active: 1,
        first_historical_data: '2021-03-15T06:20:07.000Z',
        last_historical_data: '2021-10-22T10:10:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xAC51066d7bEC65Dc4589368da368b212745d63E8',
            decimals: 6,
        },
    },
    {
        id: 7232,
        name: 'Alpha Finance Lab',
        symbol: 'ALPHA',
        slug: 'alpha-finance-lab',
        rank: 140,
        is_active: 1,
        first_historical_data: '2020-10-09T05:10:00.000Z',
        last_historical_data: '2021-10-22T10:10:03.000Z',
        platform: {
            network: 'BEP20',
            token_address: '0xa1faa113cbe53436df28ff0aee54275c13b40975',
            decimals: 18,
        },
    },
    {
        id: 6945,
        name: 'Amp',
        symbol: 'AMP',
        slug: 'amp',
        rank: 64,
        is_active: 1,
        first_historical_data: '2020-09-11T04:34:18.000Z',
        last_historical_data: '2021-10-22T10:09:33.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xff20817765cb7f73d4bde2e66e067e58d11095c2',
            decimals: 18,
        },
    },
    {
        id: 6783,
        name: 'Axie Infinity',
        symbol: 'AXS',
        slug: 'axie-infinity',
        rank: 27,
        is_active: 1,
        first_historical_data: '2020-11-03T13:10:00.000Z',
        last_historical_data: '2021-10-22T10:10:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xbb0e17ef65f82ab018d8edd776e8dd940327b28b',
            decimals: 18,
        },
    },
    {
        id: 7064,
        name: 'BakeryToken',
        symbol: 'BAKE',
        slug: 'bakerytoken',
        rank: 157,
        is_active: 1,
        first_historical_data: '2020-09-23T11:10:00.000Z',
        last_historical_data: '2021-10-22T10:05:09.000Z',
        platform: {
            network: 'BEP20',
            token_address: '0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5',
            decimals: 18,
        },
    },
    {
        id: 4679,
        name: 'Band Protocol',
        symbol: 'BAND',
        slug: 'band-protocol',
        rank: 175,
        is_active: 1,
        first_historical_data: '2019-09-18T12:34:06.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xba11d00c5f74255f56a5e366f4f77f5a186d7f55',
            decimals: 18,
        },
    },
    {
        id: 1697,
        name: 'Basic Attention Token',
        symbol: 'BAT',
        slug: 'basic-attention-token',
        rank: 100,
        is_active: 1,
        first_historical_data: '2017-06-01T05:14:54.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x0d8775f648430679a709e98d2b0cb6250d2887ef',
            decimals: 18,
        },
    },
    {
        id: 1727,
        name: 'Bancor',
        symbol: 'BNT',
        slug: 'bancor',
        rank: 102,
        is_active: 1,
        first_historical_data: '2017-06-18T15:15:00.000Z',
        last_historical_data: '2021-10-22T10:09:14.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c',
            decimals: 18,
        },
    },
    {
        id: 2700,
        name: 'Celsius',
        symbol: 'CEL',
        slug: 'celsius',
        rank: 88,
        is_active: 1,
        first_historical_data: '2018-05-03T17:44:25.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d',
            decimals: 4,
        },
    },
    {
        id: 3814,
        name: 'Celer Network',
        symbol: 'CELR',
        slug: 'celer-network',
        rank: 111,
        is_active: 1,
        first_historical_data: '2019-03-25T04:04:04.000Z',
        last_historical_data: '2021-10-22T10:09:23.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x4f9254c83eb525f9fcf346490bbb3ed28a81c667',
            decimals: 18,
        },
    },
    {
        id: 2499,
        name: 'SwissBorg',
        symbol: 'CHSB',
        slug: 'swissborg',
        rank: 122,
        is_active: 1,
        first_historical_data: '2018-02-03T19:04:30.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xba9d4199fab4f26efe3551d490e3821486f135ba',
            decimals: 8,
        },
    },
    {
        id: 5692,
        name: 'Compound',
        symbol: 'COMP',
        slug: 'compound',
        rank: 67,
        is_active: 1,
        first_historical_data: '2020-06-16T21:29:17.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xc00e94cb662c3520282e6f5717214004a7f26888',
            decimals: 18,
        },
    },
    {
        id: 3635,
        name: 'Crypto.com Coin',
        symbol: 'CRO',
        slug: 'crypto-com-coin',
        rank: 38,
        is_active: 1,
        first_historical_data: '2018-12-14T17:39:38.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
            decimals: 8,
        },
    },
    {
        id: 6538,
        name: 'Curve DAO Token',
        symbol: 'CRV',
        slug: 'curve-dao-token',
        rank: 84,
        is_active: 1,
        first_historical_data: '2020-08-14T02:14:16.000Z',
        last_historical_data: '2021-10-22T10:09:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xD533a949740bb3306d119CC777fa900bA034cd52',
            decimals: 18,
        },
    },
    {
        id: 1886,
        name: 'Dent',
        symbol: 'DENT',
        slug: 'dent',
        rank: 125,
        is_active: 1,
        first_historical_data: '2017-08-12T23:39:23.000Z',
        last_historical_data: '2021-10-22T10:09:33.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x3597bfd533a99c9aa083587b074434e61eb0a258',
            decimals: 188,
        },
    },
    {
        id: 7224,
        name: 'DODO',
        symbol: 'DODO',
        slug: 'dodo',
        rank: 320,
        is_active: 1,
        first_historical_data: '2020-09-29T05:30:00.000Z',
        last_historical_data: '2021-10-22T10:10:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd',
            decimals: 18,
        },
    },
    {
        id: 11156,
        name: 'dYdX',
        symbol: 'DYDX',
        slug: 'dydx',
        rank: 98,
        is_active: 1,
        first_historical_data: '2021-09-08T09:27:08.000Z',
        last_historical_data: '2021-10-22T10:07:10.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x92d6c1e31e14520e676a687f0a93788b716beff5',
            decimals: 18,
        },
    },
    {
        id: 2299,
        name: 'aelf',
        symbol: 'ELF',
        slug: 'aelf',
        rank: 168,
        is_active: 1,
        first_historical_data: '2017-12-21T19:04:48.000Z',
        last_historical_data: '2021-10-22T10:09:04.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e',
            decimals: 18,
        },
    },
    {
        id: 2130,
        name: 'Enjin Coin',
        symbol: 'ENJ',
        slug: 'enjin-coin',
        rank: 75,
        is_active: 1,
        first_historical_data: '2017-11-01T05:49:25.000Z',
        last_historical_data: '2021-10-22T10:09:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c',
            decimals: 18,
        },
    },
    {
        id: 8642,
        name: 'Fei Protocol',
        symbol: 'FEI',
        slug: 'fei-protocol',
        rank: 150,
        is_active: 1,
        first_historical_data: '2021-04-03T19:52:05.000Z',
        last_historical_data: '2021-10-22T10:07:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x956F47F50A910163D8BF957Cf5846D573E7f87CA',
            decimals: 18,
        },
    },
    {
        id: 3773,
        name: 'Fetch.ai',
        symbol: 'FET',
        slug: 'fetch',
        rank: 131,
        is_active: 1,
        first_historical_data: '2019-03-02T23:54:09.000Z',
        last_historical_data: '2021-10-22T10:09:18.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85',
            decimals: 18,
        },
    },
    {
        id: 3884,
        name: 'Function X',
        symbol: 'FX',
        slug: 'function-x',
        rank: 126,
        is_active: 1,
        first_historical_data: '2019-04-25T20:34:05.000Z',
        last_historical_data: '2021-10-22T10:09:31.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x8c15ef5b4b21951d50e53e4fbda8298ffad25057',
            decimals: 18,
        },
    },
    {
        id: 1455,
        name: 'Golem',
        symbol: 'GLM',
        slug: 'golem-network-tokens',
        rank: 133,
        is_active: 1,
        first_historical_data: '2016-11-18T07:34:31.000Z',
        last_historical_data: '2021-10-22T10:09:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429',
            decimals: 18,
        },
    },
    {
        id: 1659,
        name: 'Gnosis',
        symbol: 'GNO',
        slug: 'gnosis-gno',
        rank: 132,
        is_active: 1,
        first_historical_data: '2017-05-01T20:09:54.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x6810e776880c02933d47db1b9fc05908e5386b96',
            decimals: 18,
        },
    },
    {
        id: 6719,
        name: 'The Graph',
        symbol: 'GRT',
        slug: 'the-graph',
        rank: 44,
        is_active: 1,
        first_historical_data: '2020-12-17T18:00:07.000Z',
        last_historical_data: '2021-10-22T10:10:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xc944e90c64b2c07662a292be6244bdf05cda44a7',
            decimals: 18,
        },
    },
    {
        id: 2682,
        name: 'Holo',
        symbol: 'HOT',
        slug: 'holo',
        rank: 71,
        is_active: 1,
        first_historical_data: '2018-04-30T22:14:25.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x6c6ee5e31d828de241282b9606c8e98ea48526e2',
            decimals: 18,
        },
    },
    {
        id: 4779,
        name: 'HUSD',
        symbol: 'HUSD',
        slug: 'husd',
        rank: 141,
        is_active: 1,
        first_historical_data: '2019-10-15T02:49:08.000Z',
        last_historical_data: '2021-10-22T10:09:09.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xdf574c24545e5ffecb9a659c229253d4111d87e1',
            decimals: 8,
        },
    },
    {
        id: 7226,
        name: 'Injective Protocol',
        symbol: 'INJ',
        slug: 'injective-protocol',
        rank: 152,
        is_active: 1,
        first_historical_data: '2020-10-20T04:10:00.000Z',
        last_historical_data: '2021-10-22T10:10:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xe28b3b32b6c345a34ff64674606124dd5aceca30',
            decimals: 18,
        },
    },
    {
        id: 3957,
        name: 'UNUS SED LEO',
        symbol: 'LEO',
        slug: 'unus-sed-leo',
        rank: 53,
        is_active: 1,
        first_historical_data: '2019-05-21T18:39:12.000Z',
        last_historical_data: '2021-10-22T10:09:35.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
            decimals: 18,
        },
    },
    {
        id: 1975,
        name: 'Chainlink',
        symbol: 'LINK',
        slug: 'chainlink',
        rank: 16,
        is_active: 1,
        first_historical_data: '2017-09-20T20:54:59.000Z',
        last_historical_data: '2021-10-22T10:09:35.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x514910771af9ca656af840dff83e8264ecf986ca',
            decimals: 18,
        },
    },
    {
        id: 1934,
        name: 'Loopring',
        symbol: 'LRC',
        slug: 'loopring',
        rank: 130,
        is_active: 1,
        first_historical_data: '2017-08-30T02:15:10.000Z',
        last_historical_data: '2021-10-22T10:09:35.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xbbbbca6a901c926f240b89eacb641d8aec7aeafd',
            decimals: 18,
        },
    },
    {
        id: 1966,
        name: 'Decentraland',
        symbol: 'MANA',
        slug: 'decentraland',
        rank: 78,
        is_active: 1,
        first_historical_data: '2017-09-17T00:41:16.000Z',
        last_historical_data: '2021-10-22T10:09:36.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
            decimals: 18,
        },
    },
    {
        id: 1732,
        name: 'Numeraire',
        symbol: 'NMR',
        slug: 'numeraire',
        rank: 145,
        is_active: 1,
        first_historical_data: '2017-06-23T04:50:03.000Z',
        last_historical_data: '2021-10-22T10:09:09.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671',
            decimals: 18,
        },
    },
    {
        id: 3911,
        name: 'Ocean Protocol',
        symbol: 'OCEAN',
        slug: 'ocean-protocol',
        rank: 127,
        is_active: 1,
        first_historical_data: '2019-05-06T19:04:05.000Z',
        last_historical_data: '2021-10-22T10:09:34.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x967da4048cd07ab37855c090aaf366e4ce1b9f48',
            decimals: 18,
        },
    },
    {
        id: 3835,
        name: 'Orbs',
        symbol: 'ORBS',
        slug: 'orbs',
        rank: 187,
        is_active: 1,
        first_historical_data: '2019-04-03T00:29:11.000Z',
        last_historical_data: '2021-10-22T10:09:30.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa',
            decimals: 18,
        },
    },
    {
        id: 5026,
        name: 'Orchid',
        symbol: 'OXT',
        slug: 'orchid',
        rank: 172,
        is_active: 1,
        first_historical_data: '2019-12-17T01:44:04.000Z',
        last_historical_data: '2021-10-22T10:09:35.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x4575f41308EC1483f3d399aa9a2826d74Da13Deb',
            decimals: 18,
        },
    },
    {
        id: 2496,
        name: 'Polymath',
        symbol: 'POLY',
        slug: 'polymath-network',
        rank: 149,
        is_active: 1,
        first_historical_data: '2018-02-02T03:14:29.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec',
            decimals: 18,
        },
    },
    {
        id: 4120,
        name: 'Prometeus',
        symbol: 'PROM',
        slug: 'prometeus',
        rank: 165,
        is_active: 1,
        first_historical_data: '2019-07-17T19:14:09.000Z',
        last_historical_data: '2021-10-22T10:09:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xfc82bb4ba86045af6f327323a46e80412b91b27d',
            decimals: 18,
        },
    },
    {
        id: 3155,
        name: 'Quant',
        symbol: 'QNT',
        slug: 'quant',
        rank: 49,
        is_active: 1,
        first_historical_data: '2018-08-10T20:29:27.000Z',
        last_historical_data: '2021-10-22T10:09:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x4a220e6096b25eadb88358cb44068a3248254675',
            decimals: 18,
        },
    },
    {
        id: 2539,
        name: 'Ren',
        symbol: 'REN',
        slug: 'ren',
        rank: 92,
        is_active: 1,
        first_historical_data: '2018-02-21T16:19:21.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x408e41876cccdc0f92210600ef50372656052a38',
            decimals: 18,
        },
    },
    {
        id: 1637,
        name: 'iExec RLC',
        symbol: 'RLC',
        slug: 'rlc',
        rank: 164,
        is_active: 1,
        first_historical_data: '2017-04-20T21:49:49.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x607f4c5bb672230e8672085532f7e901544a7375',
            decimals: 9,
        },
    },
    {
        id: 6210,
        name: 'The Sandbox',
        symbol: 'SAND',
        slug: 'the-sandbox',
        rank: 121,
        is_active: 1,
        first_historical_data: '2020-08-14T13:14:17.000Z',
        last_historical_data: '2021-10-22T10:09:03.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x3845badAde8e6dFF049820680d1F14bD3903a5d0',
            decimals: 18,
        },
    },
    {
        id: 1759,
        name: 'Status',
        symbol: 'SNT',
        slug: 'status',
        rank: 176,
        is_active: 1,
        first_historical_data: '2017-06-28T21:19:15.000Z',
        last_historical_data: '2021-10-22T10:09:23.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x744d70fdbe2ba4cf95131626614a1763df805b9e',
            decimals: 18,
        },
    },
    {
        id: 2586,
        name: 'Synthetix',
        symbol: 'SNX',
        slug: 'synthetix-network-token',
        rank: 94,
        is_active: 1,
        first_historical_data: '2018-03-14T16:54:21.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f',
            decimals: 18,
        },
    },
    {
        id: 2297,
        name: 'StormX',
        symbol: 'STMX',
        slug: 'stormx',
        rank: 167,
        is_active: 1,
        first_historical_data: '2017-12-20T20:14:48.000Z',
        last_historical_data: '2021-10-22T10:09:04.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xbE9375C6a420D2eEB258962efB95551A5b722803',
            decimals: 18,
        },
    },
    {
        id: 1772,
        name: 'Storj',
        symbol: 'STORJ',
        slug: 'storj',
        rank: 147,
        is_active: 1,
        first_historical_data: '2017-07-02T00:54:14.000Z',
        last_historical_data: '2021-10-22T10:09:27.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac',
            decimals: 8,
        },
    },
    {
        id: 6758,
        name: 'SushiSwap',
        symbol: 'SUSHI',
        slug: 'sushiswap',
        rank: 80,
        is_active: 1,
        first_historical_data: '2020-08-28T16:34:16.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
            decimals: 18,
        },
    },
    {
        id: 4279,
        name: 'Swipe',
        symbol: 'SXP',
        slug: 'swipe',
        rank: 148,
        is_active: 1,
        first_historical_data: '2019-08-26T14:49:06.000Z',
        last_historical_data: '2021-10-22T10:09:04.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9',
            decimals: 18,
        },
    },
    {
        id: 2394,
        name: 'Telcoin',
        symbol: 'TEL',
        slug: 'telcoin',
        rank: 96,
        is_active: 1,
        first_historical_data: '2018-01-15T00:19:18.000Z',
        last_historical_data: '2021-10-22T10:09:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x467bccd9d29f223bce8043b84e8c8b282827790f',
            decimals: 2,
        },
    },
    {
        id: 2467,
        name: 'OriginTrail',
        symbol: 'TRAC',
        slug: 'origintrail',
        rank: 174,
        is_active: 1,
        first_historical_data: '2018-01-25T03:39:27.000Z',
        last_historical_data: '2021-10-22T10:09:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f',
            decimals: 18,
        },
    },
    {
        id: 2758,
        name: 'Unibright',
        symbol: 'UBT',
        slug: 'unibright',
        rank: 160,
        is_active: 1,
        first_historical_data: '2018-05-21T14:34:25.000Z',
        last_historical_data: '2021-10-22T10:09:15.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x8400d94a5cb0fa0d041a3788e395285d61c9ee5e',
            decimals: 8,
        },
    },
    {
        id: 5617,
        name: 'UMA',
        symbol: 'UMA',
        slug: 'uma',
        rank: 114,
        is_active: 1,
        first_historical_data: '2020-05-25T16:44:12.000Z',
        last_historical_data: '2021-10-22T10:09:06.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828',
            decimals: 18,
        },
    },
    {
        id: 7083,
        name: 'Uniswap',
        symbol: 'UNI',
        slug: 'uniswap',
        rank: 12,
        is_active: 1,
        first_historical_data: '2020-09-17T01:14:14.000Z',
        last_historical_data: '2021-10-22T10:09:34.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            decimals: 18,
        },
    },
    {
        id: 3408,
        name: 'USD Coin',
        symbol: 'USDC',
        slug: 'usd-coin',
        rank: 10,
        is_active: 1,
        first_historical_data: '2018-10-08T18:49:28.000Z',
        last_historical_data: '2021-10-22T10:09:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            decimals: 6,
        },
    },
    {
        id: 3330,
        name: 'Pax Dollar',
        symbol: 'USDP',
        slug: 'paxos-standard',
        rank: 103,
        is_active: 1,
        first_historical_data: '2018-09-27T20:54:23.000Z',
        last_historical_data: '2021-10-22T10:09:04.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
            decimals: 18,
        },
    },
    {
        id: 3717,
        name: 'Wrapped Bitcoin',
        symbol: 'WBTC',
        slug: 'wrapped-bitcoin',
        rank: 14,
        is_active: 1,
        first_historical_data: '2019-01-30T18:19:09.000Z',
        last_historical_data: '2021-10-22T10:09:07.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
            decimals: 8,
        },
    },
    {
        id: 7501,
        name: 'WOO Network',
        symbol: 'WOO',
        slug: 'wootrade',
        rank: 120,
        is_active: 1,
        first_historical_data: '2020-10-28T08:55:00.000Z',
        last_historical_data: '2021-10-22T10:10:05.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x4691937a7508860f876c9c0a2a617e7d9e945d4b',
            decimals: 18,
        },
    },
    {
        id: 7288,
        name: 'Venus',
        symbol: 'XVS',
        slug: 'venus',
        rank: 161,
        is_active: 1,
        first_historical_data: '2020-10-05T05:10:00.000Z',
        last_historical_data: '2021-10-22T10:10:03.000Z',
        platform: {
            network: 'BEP20',
            token_address: '0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63',
            decimals: 18,
        },
    },
    {
        id: 2765,
        name: 'XYO',
        symbol: 'XYO',
        slug: 'xyo',
        rank: 154,
        is_active: 1,
        first_historical_data: '2018-05-22T17:04:27.000Z',
        last_historical_data: '2021-10-22T10:09:19.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x55296f69f40ea6d20e478533c15a6b08b654e758',
            decimals: 18,
        },
    },
    {
        id: 5864,
        name: 'yearn.finance',
        symbol: 'YFI',
        slug: 'yearn-finance',
        rank: 86,
        is_active: 1,
        first_historical_data: '2020-07-20T21:44:15.000Z',
        last_historical_data: '2021-10-22T10:09:30.000Z',
        platform: {
            network: 'ERC20',
            token_address: '0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e',
            decimals: 18,
        },
    },
]
let basicAtt = {
    logo: 0,
    resume: 0,
    description: 0,
    countries: 0,
    tags: 0,
    cover: 0,
    coverSrc: 0,
    coverMobile: 0,
    coverSrcMobile: 0,
}
let booltestnet = true
let config = {
    symfonySalt: process.env.SYMPHONY_SATT,
    linkedinActivityUrl: (activityURN) =>
        `${process.env.LINKEDIN_FIRST_URL_ADRR_FIRST}${activityURN}${process.env.LINKEDIN_FIRST_URL_ADRR_SECOND}`,
    linkedinStatsUrl: (type, idPost, organization) =>
        `${process.env.LINKEDIN_START_URL_FIRST}${type}${process.env.LINKEDIN_START_URL_SECOND}${type}:${idPost}${process.env.LINKEDIN_START_URL_THIRD}${organization}`,
    linkedinUgcPostStats: (idPost) =>
        `${process.env.LINKEDIN_UGC_POST_FIRST}${idPost}${process.env.LINKEDIN_UGC_POST_SECOND}`,
    linkedinPages: (accessToken) => {
        return {
            url: 'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&projection=(elements*(*, organization~(localizedName,logoV2(original~:playableStreams))))',
            method: 'GET',
            headers: {
                Authorization: 'Bearer ' + accessToken,
                'X-Restli-Protocol-Version': '2.0.0',
            },
            json: true,
        }
    },
    bridgeKeystore: {
        version: 3,
        id: '4dc797da-5601-4a6f-bc49-a5c2f2236467',
        address: '359b39b916bb4df416dbea5a2de266dfa9b3bcbf',
        crypto: {
            ciphertext:
                '2dba72cd6b838d3a2f28b8f3f41a456be5242de1970aeda4fa61a68a042e6352',
            cipherparams: {
                iv: 'e443f8ad2b0c58e55ef38d1c8e999cd8',
            },
            cipher: 'aes-128-ctr',
            kdf: 'scrypt',
            kdfparams: {
                dklen: 32,
                salt: 'a6b7ffa902f4e1b061401d5667f34de81693c59d38295a07a7da96a51897abf2',
                n: 8192,
                r: 8,
                p: 1,
            },
            mac: 'a2597a2ab7ce0b365a8ccb9a87caebd32b9d03636dad3b50532b77683135a1c5',
        },
    },
}

let oauth = {
    google: {
        googleClientId: process.env.GOOGLE_CLIENTID,
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
        gdataApiKey: process.env.GDA_TAP_API_KEY,
    },
    twitter: {
        consumer_key_alt: process.env.TWITTER_CONSUMER_KEY_ALT,
        consumer_secret_alt: process.env.TWILTTER_CONSUMER_SECRET_ALT,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
        access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    },
    facebook: {
        appId: process.env.APPID,
        appSecret: process.env.APP_SECRET,
        fbGraphVersion: process.env.FB_GRAPH_VERSION,
    },
}

let loginSettings = {
    lockedPeriod: process.env.lockedPeriod,
}

let configSendBox = {}

configSendBox = booltestnet
    ? 'https://sandbox.test-simplexcc.com'
    : 'https://backend-wallet-api.simplexcc.com'

let networkSegWitCompat = {
    baseNetwork: 'bitcoin',
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
}

let networkSegWit = {
    baseNetwork: 'bitcoin',
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
        public: 0x04b24746,
        private: 0x04b2430c,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
}
let pathBtcSegwitCompat = "m/49'/0'/0'/0/0"

let pathBtcSegwit = "m/84'/0'/0'/0/0"
let pathEth = "m/44'/60'/0'/0/0'"

let persmissionsObjFb = { scope: ['public_profile', 'email'] }

exports.facebookCredentials = (callback) => {
    return {
        clientID: oauth.facebook.appId,
        clientSecret: oauth.facebook.appSecret,
        callbackURL: process.env.BASEURL + callback,
        profileFields: [
            'id',
            'displayName',
            'email',
            'picture.type(large)',
            'token_for_business',
        ],
        passReqToCallback: true,
    }
}

exports.googleCredentials = (callback) => {
    return {
        clientID: oauth.google.googleClientId,
        clientSecret: oauth.google.googleClientSecret,
        callbackURL: process.env.BASEURL + callback,
        passReqToCallback: true,
    }
}

exports.twitterCredentials = (callback) => {
    return {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: process.env.BASEURL + callback,
        passReqToCallback: true,
    }
}

exports.linkedinCredentials = (callback) => {
    return {
        clientID: process.env.LINKEDIN_KEY,
        clientSecret: process.env.LINKEDIN_SECRET,
        callbackURL: process.env.BASEURL + callback, // "callback/link/linkedin",
        scope: [
            'r_basicprofile',
            'r_organization_social',
            'rw_organization_admin',
        ],
        passReqToCallback: true,
    }
}
module.exports.basicAtt = basicAtt
module.exports.persmissionsObjFb = persmissionsObjFb
module.exports.pathBtcSegwit = pathBtcSegwit

module.exports.pathEth = pathEth

module.exports.networkSegWitCompat = networkSegWitCompat
module.exports.networkSegWit = networkSegWit
module.exports.token200 = token200
module.exports.Tokens = Tokens
module.exports.config = config
module.exports.oauth = oauth
module.exports.loginSettings = loginSettings
module.exports.configSendBox = configSendBox
module.exports.booltestnet = booltestnet
module.exports.pathBtcSegwitCompat = pathBtcSegwitCompat
