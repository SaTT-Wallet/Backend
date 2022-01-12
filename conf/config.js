module.exports = async function (app) {
  return new Promise((resolve, reject) => {
    var config = {};

    config.testnet = true;
    config.appId = "2097234380575759";
    config.appSecret = "8689f701323c2fb6a4286b3eeba4e964";
    config.fbGraphVersion = "v10.0";

    config.mailerOptions = {
      host: "mail.gandi.net",
      port: 25,
      secure: false,
      auth: {
        user: "satt@iframe-apps.com",
        pass: "SaTT24092020",
      },
      tls: {
        rejectUnauthorized: false,
      },
    };

    /*config.mailerOptions =  {
			host:"mailer.gandi.net",
			port:25,
			secure:false,
			auth: {
				user: 'satt@iframe-apps.com',
				pass: 'SaTT24092020'
			},
                      tls: {
                        rejectUnauthorized: false
                     }
		}*/

    config.mailSender = "SaTT Token <activation@atayen.us>";
    config.resetpassword_Email = "SaTT-Token@atayen.us";

    config.SupportMail = "support@satt-token.freshdesk.com";

    config.notificationMail = "notification@atayen.us";
    config.contactMail = "contact@satt-token.com";

    config.googleClientId =
      "867479742068-s5btemgej3kg2uohmj48ppphhqnrl864.apps.googleusercontent.com";
    config.googleClientSecret = "Pzgw9sQFPitOLj9l1fWLjhPG";

    config.twitterClientId = "k6GITu1lFse8MyuUEEmWLVbK3";
    config.twitterClientSecret =
      "KzNTkDbHhUMdgC12NPQ6zWgaHsDGCzUYDMB2dJf8UIOkKgQmXb";

    config.telegramClientId = "1880392";
    config.telegramClientSecret = "feac97528976f7d0352fa3154fce178c";

    //	config.telegramBotToken = "1789068164:AAF5LyvdqRWdguHxfXDsWeSMPTdm9DIsyJI"
    config.telegramBotToken = "1805340684:AAEmn71oE0QtlaUEW8GEhxgtleZ7pEnSemY";
    //config.gdataApiKey = "AIzaSyD0Xvh043gUboAfz0KqvHL0Dw2fHIYPnt0";
    config.gdataApiKey = "AIzaSyA_mPd_Ocjzvoi4btNDZs98hs0B7IRnt9w";

    config.linkedin_key = "78x1218wadtuc9";
    config.linkedin_secret = "PvqC4QK36nEuToNy";

    //	config.twitter = {
    //		consumer_key:"tH7AnhdvgOndxvZOyeeyfHOVG",
    //		consumer_secret:"14mR3PZn3osH1OBPjtJWJT7IycQB5kOF4PmIuDjHvFHuEZppk0",
    //		access_token_key:"2616201013-Bow3klvUxQbYXuO22nCm4tdH4Wxvsr6OE8PGXPT",
    //		access_token_secret:"2iAs1oM1dhVoUX4gnRR9dGCPI4Ayc8ZbfJJymbqfm5otP"
    //	};

    config.twitter = {
      consumer_key_alt: "tH7AnhdvgOndxvZOyeeyfHOVG",
      consumer_secret_alt: "14mR3PZn3osH1OBPjtJWJT7IycQB5kOF4PmIuDjHvFHuEZppk0",
      consumer_key_dev: "TrfQX9N6dfggk9xWu4ZrsrvPw",
      consumer_secret_dev: "xgTxm6Fg0ZdITmL3HPW7TfklvJ6bxejZ4UwPJChgsWWTnpy43Y",
      consumer_key: "zHzptTVP3IPoPoCPnt1h7xuSK",
      consumer_secret: "cueHbbIK2IVYt7bloW3qqWaTT75A8b2FKcQ1H1QjKn1PAH8UJI",
      access_token_key: "2616201013-Bow3klvUxQbYXuO22nCm4tdH4Wxvsr6OE8PGXPT",
      access_token_secret: "2iAs1oM1dhVoUX4gnRR9dGCPI4Ayc8ZbfJJymbqfm5otP",
    };

    config.Satt_faq = "https://satt-token.com/#faq";
    config.baseUrl = "https://wallet-preprod.iframe-apps.com:3014/";

    //TO be added
    //   var appUrl = 'http://localhost:4200/#';
    config.baseEmailImgURl = "https://satt.atayen.us/assets/Images/mail";
    config.basedURl = "https://testnet.satt.atayen.us/#";
    //	 config.basedURl="http://localhost:4200/#"
    config.v1Url = "https://old.satt.atayen.us/#";

    config.symfonySalt = "dgppd1mbo80k440scskw4c08k8kk880";

    config.web3Url =
      "wss://ropsten.infura.io/ws/v3/557c0cefcd1b4ba5b1418d56a699f705";
    config.web3UrlInf =
      "wss://ropsten.infura.io/ws/v3/557c0cefcd1b4ba5b1418d56a699f705";
    config.web3UrlBep20 = "https://data-seed-prebsc-1-s1.binance.org:8545";
    config.web3UrlBep20Websocket =
      "wss://apis.ankr.com/wss/80d0e787da70488c9698dd798667785c/b7c61a14f570c697e65cb693a683cda4/binance/full/test";
    config.oracleOwner = "0x3f31cbacfec98b29eeb35566fd630c04e706ac46";
    config.oracleOwnerPass = "12345678";
    config.campaignOwner = "0x3f31cbacfec98b29eeb35566fd630c04e706ac46";
    config.campaignOwnerPass = "12345678";
    config.tokenOwner = "0x3f31cbacfec98b29eeb35566fd630c04e706ac46";
    config.tokenOwnerPass = "12345678";

    config.mysqlHost = "127.0.0.1"
    config.mysqlUser = "root";
    config.mysqlPass = "root";
    config.mysqlDb = "super_app";

    config.mongoBase = "ether";
    config.mongoBaseCrm = "atayen";

    config.mongoUser = "atayen";
    config.mongoPass = "atayen";
    config.mongoHost = "127.0.0.1";
    config.mongoPort = "27017";

    // config.mongoUser = "oracles";
    // config.mongoPass = "SattToken216";
    //        config.mongoHost ="155.133.130.205";
    // config.mongoPort = "27017";

    config.mongoURI =
      "mongodb://" +
      config.mongoHost +
      ":" +
      config.mongoPort +
      "/" +
      config.mongoBaseCrm;

    config.walletCollection = "wallet";
    config.contractCollection = "contracts";
    config.requestCollection = "request";
    config.eventCollection = "event";
    config.campaignCollection = "campaign";
    config.rateCollection = "rate";
    config.txCollection = "txs";
    config.passWalletCollection = "temp";
    config.oracleBanCollection = "oracleban";
    config.applyCollection = "apply";
    config.sattBuyCollection = "sattbuy";
    config.bep20Collection = "bep20";

    config.appAdminV2 = 0;

    config.listenPort = 3014;

    config.AddrBtcVrfy = "";
    config.campaignWalletPath = "./conf/wallets/campaign.json";
    config.SattReservePath = "./conf/wallets/campaign.json";
    config.SattReserve = "0x3f31cbacfec98b29eeb35566fd630c04e706ac46";
    //	config.SattReservePass = "12345678";
    //	config.SattReservePass="gemoya05"
    config.SattReservePass = "Haythem12@";
    config.AddrBtcExchange = "3GxshMUQqK4wzueFkd7jj7DFaQFhaRxLfm";
    config.atayenSubscriptionAddress =
      "0xcbbd153423b6fbe45bdca07bc933c59f2eda0cef";

    config.CrmAuthUrl = "https://web.iframe-apps.com/access/user/";
    config.PaidSatt = "";
    config.gasPrice = 1000000000;
    config.gasEth = 21000;
    config.EtherWei = 1000000000000000000;

    config.sattBep20 = {
      version: 3,
      id: "4dc797da-5601-4a6f-bc49-a5c2f2236467",
      address: "359b39b916bb4df416dbea5a2de266dfa9b3bcbf",
      crypto: {
        ciphertext:
          "2dba72cd6b838d3a2f28b8f3f41a456be5242de1970aeda4fa61a68a042e6352",
        cipherparams: {
          iv: "e443f8ad2b0c58e55ef38d1c8e999cd8",
        },
        cipher: "aes-128-ctr",
        kdf: "scrypt",
        kdfparams: {
          dklen: 32,
          salt: "a6b7ffa902f4e1b061401d5667f34de81693c59d38295a07a7da96a51897abf2",
          n: 8192,
          r: 8,
          p: 1,
        },
        mac: "a2597a2ab7ce0b365a8ccb9a87caebd32b9d03636dad3b50532b77683135a1c5",
      },
    };

    //bridge bep20;

    config.SattBep20Addr = "0x359B39B916Bb4df416dbeA5a2De266dfa9B3bcBf";
    config.bridge = "0x359B39B916Bb4df416dbeA5a2De266dfa9B3bcBf";
    config.sattReserveKs = {};
    config.sattReserveKs34 = {};

    config.tokenContract = ""; //mainnet

    config.campaignContract = ""; //mainnet
    config.campaignContractAdvFee = ""; //mainnet

    //config.icoFactor = 1.3;
    config.icoFactor = 1;
    config.masterSeed = "";
    config.derivePathEth = "m/44'/60'/0'/0";
    config.derivePathBtc = "m/44'/0'/0'/0";
    config.derivePathLtc = "m/44'/2'/0'/0";
    config.ledgerAddress = "0xAB8199eba802e7e6634d4389Bf23999b7Ae6b253";
    config.btcFee = 0.0003;
    config.masterSeed = "";

    config.confirmUrl = "";

    config.SSLCertFile = "./conf/fullchain.pem";
    config.SSLKeyFile = "./conf/privkey.pem";

    config.cmcApiKey = "091586f4-11fe-4c6a-8c2b-059f5e75f7a7";
    //config.cmcApiKey = "b3ccb1c6-0a17-45a6-b6aa-9de628659858";

    config.BtcFees = "https://bitcoinfees.earn.com/api/v1/fees/recommended";

    config.bxCommand = "/home/oracles/node-satt/bin/bx";
    config.bxCommandEnd = " -f json";
    config.proc_opts = {};

    config.btcCmd =
      "./bin/bitcoin-cli -rpcconnect=192.168.0.23 -rpcuser=btcuser -rpcpassword=BtcUs3R**-a ";
    config.pathBtcSegwitCompat = "m/49'/0'/0'/0/0";
    config.pathBtcSegwit = "m/84'/0'/0'/0/0";
    config.pathEth = "m/44'/60'/0'/0/0'";

    config.networkSegWitCompat = {
      baseNetwork: "bitcoin",
      messagePrefix: "\x18Bitcoin Signed Message:\n",
      bech32: "bc",
      bip32: {
        public: 0x049d7cb2,
        private: 0x049d7878,
      },
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
    };

    config.networkSegWit = {
      baseNetwork: "bitcoin",
      messagePrefix: "\x18Bitcoin Signed Message:\n",
      bech32: "bc",
      bip32: {
        public: 0x04b24746,
        private: 0x04b2430c,
      },
      pubKeyHash: 0x00,
      scriptHash: 0x05,
      wif: 0x80,
    };

    config.accountType = {
      0: "Email",
      1: "Facebook",
      2: "google",
      3: "Telegram",
    };
    config.etherscanApiUrl =
      "https://api.etherscan.io/api?module=account&action=tokentx&startblock=0&endblock=999999999&sort=asc&apikey=ZNDG1UK6FVQ1VJKGDEHQWGSBS1GUHMAPX5&address=";
    config.etherscanApiUrlTx =
      "https://api.etherscan.io/api?module=account&action=txlist&startblock=0&endblock=999999999&sort=asc&apikey=ZNDG1UK6FVQ1VJKGDEHQWGSBS1GUHMAPX5&address=";
    config.etherscanApiUrl_ =
      "https://api.etherscan.io/api?module=account&startblock=0&endblock=999999999&sort=asc&apikey=ZNDG1UK6FVQ1VJKGDEHQWGSBS1GUHMAPX5&address=";
    config.bscscanApi =
    "https://api.bscscan.com/api?module=account&startblock=0&endblock=999999999&sort=desc&apikey=TVXGRBVQAMDI6BC6663YCHPJ67YH2VD4CP&address=";
    config.deploy = false;

    config.SattBep20Addr = "0x359B39B916Bb4df416dbeA5a2De266dfa9B3bcBf";
    config.SattStep3 = "0xcCbE89144A9C44ea40A988028f44e4597375F5eF";
    config.SattStep4 = "0x66290B22DF130468f08BfFFED04252f3b0cF4E40";

    //config.SattStep3 = "";
    //config.SattStep4 = "";

    config.Tokens = {
      SATT: {
        name: "SaTT",
        symbol: "SATT",
        undername: "SATT",
        undername2: "SATT",
        contract: "0xdf49c9f599a0a9049d97cff34d0c30e468987389",
        dicimal: 18,
        network: "ERC20",
      },
      WSATT: {
        name: "WSaTT",
        symbol: "WSATT",
        undername: "WSATT",
        undername2: "WSATT",
        contract: "0x70A6395650b47D94A77dE4cFEDF9629f6922e645",
        dicimal: 18,
        network: "ERC20",
      },
      SATT_BEP20: {
        name: "SaTT",
        symbol: "SATTBEP20",
        undername: "(BEP20)",
        undername2: "SATT",
        contract: "0x6fAc729f346A46fC0093126f237b4A520c40eb89",
        dicimal: 18,
        network: "BEP20",
      },
      OMG: {
        name: "Omise Go",
        symbol: "OMG",
        undername: "OMG",
        undername2: "OMG",
        contract: "0xd26114cd6EE289AccF82350c8d8487fedB8A0C07",
        dicimal: 18,
        network: "ERC20",
      },
      DAI: {
        name: "DAI",
        symbol: "DAI",
        undername: "DAI",
        undername2: "DAI",
        contract: "0x7d6550Bb3946c0BB0701c75baBE2f679E01F3f3E",
        dicimal: 18,
        network: "ERC20",
      },
      USDT: {
        name: "Tether",
        symbol: "USDT",
        undername: "USDT",
        undername2: "USDT",
        contract: "0xdac17f958d2ee523a2206206994597c13d831ec7",
        dicimal: 6,
        network: "ERC20",
      },
      //	USDC:{name:"USD Coin",symbol:"USDC",undername:"USDC",undername2:"USDC",
      //	contract:"0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",dicimal:18,network:'ERC20'},
      ZRX: {
        name: "0x",
        symbol: "ZRX",
        undername: "ZRX",
        undername2: "ZRX",
        contract: "0xe41d2489571d322189246dafa5ebde1f4699f498",
        dicimal: 18,
        network: "ERC20",
      },
      MKR: {
        name: "Maker",
        symbol: "MKR",
        undername: "MKR",
        undername2: "MKR",
        contract: "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2",
        dicimal: 18,
        network: "ERC20",
      },
      BNB: {
        name: "BNB",
        symbol: "BNB",
        undername: "(SMART CHAINE)",
        undername2: "BNB",
        contract: "0xB8c77482e45F1F44dE1745F52C74426C631bDD52",
        dicimal: 18,
        network: "BEP20",
      },
      CAKE: {
        name: "CAKE",
        symbol: "CAKE",
        undername: "CAKE",
        undername2: "CAKE",
        contract: "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        dicimal: 18,
        network: "BEP20",
      },
      BUSD: {
        name: "Binance-Peg BUSD Token",
        symbol: "BUSD",
        undername: "BUSD",
        undername2: "BUSD",
        contract: "0x4CB4473Af06B844d06b5eDeF08983B2C5C61e5af",
        dicimal: 18,
        network: "BEP20",
      },
    };

     config.xChangePricesUrl = "https://3xchange.io/prices";
    // config.xChangePricesUrl = "https://api.satt-token.com:3014/prices";

    config.auth_tokens = ["7wek8rZbmT52Q0cMnGLhDdfVyWJ1a4pvK3xgHBNAi6YOXq"];
    config.APIURLBEP20 =
      "https://api.thegraph.com/subgraphs/name/geoffreymoya/satt-campaigns-bsc";
    config.APIURLERC20 =
      "https://api.thegraph.com/subgraphs/name/geoffreymoya/satt-campaigns-ropsten";
    config.token200 = [
      {
        id: 8104,
        name: "1inch Network",
        symbol: "1INCH",
        slug: "1inch",
        rank: 118,
        is_active: 1,
        first_historical_data: "2020-12-24T01:05:00.000Z",
        last_historical_data: "2021-10-22T10:10:09.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x111111111117dc0aa78b770fa6a738034120c302",
          decimals: 18,
        },
      },
      {
        id: 7278,
        name: "Aave",
        symbol: "AAVE",
        slug: "aave",
        rank: 45,
        is_active: 1,
        first_historical_data: "2020-10-04T12:56:22.000Z",
        last_historical_data: "2021-10-22T10:06:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
          decimals: 18,
        },
      },
      {
        id: 8766,
        name: "MyNeighborAlice",
        symbol: "ALICE",
        slug: "myneighboralice",
        rank: 188,
        is_active: 1,
        first_historical_data: "2021-03-15T06:20:07.000Z",
        last_historical_data: "2021-10-22T10:10:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xAC51066d7bEC65Dc4589368da368b212745d63E8",
          decimals: 6,
        },
      },
      {
        id: 7232,
        name: "Alpha Finance Lab",
        symbol: "ALPHA",
        slug: "alpha-finance-lab",
        rank: 140,
        is_active: 1,
        first_historical_data: "2020-10-09T05:10:00.000Z",
        last_historical_data: "2021-10-22T10:10:03.000Z",
        platform: {
          network: "BEP20",
          token_address: "0xa1faa113cbe53436df28ff0aee54275c13b40975",
          decimals: 18,
        },
      },
      {
        id: 6945,
        name: "Amp",
        symbol: "AMP",
        slug: "amp",
        rank: 64,
        is_active: 1,
        first_historical_data: "2020-09-11T04:34:18.000Z",
        last_historical_data: "2021-10-22T10:09:33.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xff20817765cb7f73d4bde2e66e067e58d11095c2",
          decimals: 18,
        },
      },
      {
        id: 6783,
        name: "Axie Infinity",
        symbol: "AXS",
        slug: "axie-infinity",
        rank: 27,
        is_active: 1,
        first_historical_data: "2020-11-03T13:10:00.000Z",
        last_historical_data: "2021-10-22T10:10:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xbb0e17ef65f82ab018d8edd776e8dd940327b28b",
          decimals: 18,
        },
      },
      {
        id: 7064,
        name: "BakeryToken",
        symbol: "BAKE",
        slug: "bakerytoken",
        rank: 157,
        is_active: 1,
        first_historical_data: "2020-09-23T11:10:00.000Z",
        last_historical_data: "2021-10-22T10:05:09.000Z",
        platform: {
          network: "BEP20",
          token_address: "0xE02dF9e3e622DeBdD69fb838bB799E3F168902c5",
          decimals: 18,
        },
      },
      {
        id: 4679,
        name: "Band Protocol",
        symbol: "BAND",
        slug: "band-protocol",
        rank: 175,
        is_active: 1,
        first_historical_data: "2019-09-18T12:34:06.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xba11d00c5f74255f56a5e366f4f77f5a186d7f55",
          decimals: 18,
        },
      },
      {
        id: 1697,
        name: "Basic Attention Token",
        symbol: "BAT",
        slug: "basic-attention-token",
        rank: 100,
        is_active: 1,
        first_historical_data: "2017-06-01T05:14:54.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x0d8775f648430679a709e98d2b0cb6250d2887ef",
          decimals: 18,
        },
      },
      {
        id: 1727,
        name: "Bancor",
        symbol: "BNT",
        slug: "bancor",
        rank: 102,
        is_active: 1,
        first_historical_data: "2017-06-18T15:15:00.000Z",
        last_historical_data: "2021-10-22T10:09:14.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x1f573d6fb3f13d689ff844b4ce37794d79a7ff1c",
          decimals: 18,
        },
      },
      {
        id: 2700,
        name: "Celsius",
        symbol: "CEL",
        slug: "celsius",
        rank: 88,
        is_active: 1,
        first_historical_data: "2018-05-03T17:44:25.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d",
          decimals: 4,
        },
      },
      {
        id: 3814,
        name: "Celer Network",
        symbol: "CELR",
        slug: "celer-network",
        rank: 111,
        is_active: 1,
        first_historical_data: "2019-03-25T04:04:04.000Z",
        last_historical_data: "2021-10-22T10:09:23.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x4f9254c83eb525f9fcf346490bbb3ed28a81c667",
          decimals: 18,
        },
      },
      {
        id: 2499,
        name: "SwissBorg",
        symbol: "CHSB",
        slug: "swissborg",
        rank: 122,
        is_active: 1,
        first_historical_data: "2018-02-03T19:04:30.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xba9d4199fab4f26efe3551d490e3821486f135ba",
          decimals: 8,
        },
      },
      {
        id: 5692,
        name: "Compound",
        symbol: "COMP",
        slug: "compound",
        rank: 67,
        is_active: 1,
        first_historical_data: "2020-06-16T21:29:17.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xc00e94cb662c3520282e6f5717214004a7f26888",
          decimals: 18,
        },
      },
      {
        id: 3635,
        name: "Crypto.com Coin",
        symbol: "CRO",
        slug: "crypto-com-coin",
        rank: 38,
        is_active: 1,
        first_historical_data: "2018-12-14T17:39:38.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
          decimals: 8,
        },
      },
      {
        id: 6538,
        name: "Curve DAO Token",
        symbol: "CRV",
        slug: "curve-dao-token",
        rank: 84,
        is_active: 1,
        first_historical_data: "2020-08-14T02:14:16.000Z",
        last_historical_data: "2021-10-22T10:09:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xD533a949740bb3306d119CC777fa900bA034cd52",
          decimals: 18,
        },
      },
      {
        id: 1886,
        name: "Dent",
        symbol: "DENT",
        slug: "dent",
        rank: 125,
        is_active: 1,
        first_historical_data: "2017-08-12T23:39:23.000Z",
        last_historical_data: "2021-10-22T10:09:33.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x3597bfd533a99c9aa083587b074434e61eb0a258",
          decimals: 188,
        },
      },
      {
        id: 7224,
        name: "DODO",
        symbol: "DODO",
        slug: "dodo",
        rank: 320,
        is_active: 1,
        first_historical_data: "2020-09-29T05:30:00.000Z",
        last_historical_data: "2021-10-22T10:10:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x43dfc4159d86f3a37a5a4b3d4580b888ad7d4ddd",
          decimals: 18,
        },
      },
      {
        id: 11156,
        name: "dYdX",
        symbol: "DYDX",
        slug: "dydx",
        rank: 98,
        is_active: 1,
        first_historical_data: "2021-09-08T09:27:08.000Z",
        last_historical_data: "2021-10-22T10:07:10.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x92d6c1e31e14520e676a687f0a93788b716beff5",
          decimals: 18,
        },
      },
      {
        id: 2299,
        name: "aelf",
        symbol: "ELF",
        slug: "aelf",
        rank: 168,
        is_active: 1,
        first_historical_data: "2017-12-21T19:04:48.000Z",
        last_historical_data: "2021-10-22T10:09:04.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xbf2179859fc6D5BEE9Bf9158632Dc51678a4100e",
          decimals: 18,
        },
      },
      {
        id: 2130,
        name: "Enjin Coin",
        symbol: "ENJ",
        slug: "enjin-coin",
        rank: 75,
        is_active: 1,
        first_historical_data: "2017-11-01T05:49:25.000Z",
        last_historical_data: "2021-10-22T10:09:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xf629cbd94d3791c9250152bd8dfbdf380e2a3b9c",
          decimals: 18,
        },
      },
      {
        id: 8642,
        name: "Fei Protocol",
        symbol: "FEI",
        slug: "fei-protocol",
        rank: 150,
        is_active: 1,
        first_historical_data: "2021-04-03T19:52:05.000Z",
        last_historical_data: "2021-10-22T10:07:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x956F47F50A910163D8BF957Cf5846D573E7f87CA",
          decimals: 18,
        },
      },
      {
        id: 3773,
        name: "Fetch.ai",
        symbol: "FET",
        slug: "fetch",
        rank: 131,
        is_active: 1,
        first_historical_data: "2019-03-02T23:54:09.000Z",
        last_historical_data: "2021-10-22T10:09:18.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xaea46A60368A7bD060eec7DF8CBa43b7EF41Ad85",
          decimals: 18,
        },
      },
      {
        id: 3884,
        name: "Function X",
        symbol: "FX",
        slug: "function-x",
        rank: 126,
        is_active: 1,
        first_historical_data: "2019-04-25T20:34:05.000Z",
        last_historical_data: "2021-10-22T10:09:31.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x8c15ef5b4b21951d50e53e4fbda8298ffad25057",
          decimals: 18,
        },
      },
      {
        id: 1455,
        name: "Golem",
        symbol: "GLM",
        slug: "golem-network-tokens",
        rank: 133,
        is_active: 1,
        first_historical_data: "2016-11-18T07:34:31.000Z",
        last_historical_data: "2021-10-22T10:09:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x7DD9c5Cba05E151C895FDe1CF355C9A1D5DA6429",
          decimals: 18,
        },
      },
      {
        id: 1659,
        name: "Gnosis",
        symbol: "GNO",
        slug: "gnosis-gno",
        rank: 132,
        is_active: 1,
        first_historical_data: "2017-05-01T20:09:54.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x6810e776880c02933d47db1b9fc05908e5386b96",
          decimals: 18,
        },
      },
      {
        id: 6719,
        name: "The Graph",
        symbol: "GRT",
        slug: "the-graph",
        rank: 44,
        is_active: 1,
        first_historical_data: "2020-12-17T18:00:07.000Z",
        last_historical_data: "2021-10-22T10:10:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xc944e90c64b2c07662a292be6244bdf05cda44a7",
          decimals: 18,
        },
      },
      {
        id: 2682,
        name: "Holo",
        symbol: "HOT",
        slug: "holo",
        rank: 71,
        is_active: 1,
        first_historical_data: "2018-04-30T22:14:25.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x6c6ee5e31d828de241282b9606c8e98ea48526e2",
          decimals: 18,
        },
      },
      {
        id: 4779,
        name: "HUSD",
        symbol: "HUSD",
        slug: "husd",
        rank: 141,
        is_active: 1,
        first_historical_data: "2019-10-15T02:49:08.000Z",
        last_historical_data: "2021-10-22T10:09:09.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xdf574c24545e5ffecb9a659c229253d4111d87e1",
          decimals: 8,
        },
      },
      {
        id: 7226,
        name: "Injective Protocol",
        symbol: "INJ",
        slug: "injective-protocol",
        rank: 152,
        is_active: 1,
        first_historical_data: "2020-10-20T04:10:00.000Z",
        last_historical_data: "2021-10-22T10:10:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xe28b3b32b6c345a34ff64674606124dd5aceca30",
          decimals: 18,
        },
      },
      {
        id: 3957,
        name: "UNUS SED LEO",
        symbol: "LEO",
        slug: "unus-sed-leo",
        rank: 53,
        is_active: 1,
        first_historical_data: "2019-05-21T18:39:12.000Z",
        last_historical_data: "2021-10-22T10:09:35.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3",
          decimals: 18,
        },
      },
      {
        id: 1975,
        name: "Chainlink",
        symbol: "LINK",
        slug: "chainlink",
        rank: 16,
        is_active: 1,
        first_historical_data: "2017-09-20T20:54:59.000Z",
        last_historical_data: "2021-10-22T10:09:35.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x514910771af9ca656af840dff83e8264ecf986ca",
          decimals: 18,
        },
      },
      {
        id: 1934,
        name: "Loopring",
        symbol: "LRC",
        slug: "loopring",
        rank: 130,
        is_active: 1,
        first_historical_data: "2017-08-30T02:15:10.000Z",
        last_historical_data: "2021-10-22T10:09:35.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xbbbbca6a901c926f240b89eacb641d8aec7aeafd",
          decimals: 18,
        },
      },
      {
        id: 1966,
        name: "Decentraland",
        symbol: "MANA",
        slug: "decentraland",
        rank: 78,
        is_active: 1,
        first_historical_data: "2017-09-17T00:41:16.000Z",
        last_historical_data: "2021-10-22T10:09:36.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
          decimals: 18,
        },
      },
      {
        id: 1732,
        name: "Numeraire",
        symbol: "NMR",
        slug: "numeraire",
        rank: 145,
        is_active: 1,
        first_historical_data: "2017-06-23T04:50:03.000Z",
        last_historical_data: "2021-10-22T10:09:09.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x1776e1F26f98b1A5dF9cD347953a26dd3Cb46671",
          decimals: 18,
        },
      },
      {
        id: 3911,
        name: "Ocean Protocol",
        symbol: "OCEAN",
        slug: "ocean-protocol",
        rank: 127,
        is_active: 1,
        first_historical_data: "2019-05-06T19:04:05.000Z",
        last_historical_data: "2021-10-22T10:09:34.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x967da4048cd07ab37855c090aaf366e4ce1b9f48",
          decimals: 18,
        },
      },
      {
        id: 3835,
        name: "Orbs",
        symbol: "ORBS",
        slug: "orbs",
        rank: 187,
        is_active: 1,
        first_historical_data: "2019-04-03T00:29:11.000Z",
        last_historical_data: "2021-10-22T10:09:30.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xff56cc6b1e6ded347aa0b7676c85ab0b3d08b0fa",
          decimals: 18,
        },
      },
      {
        id: 5026,
        name: "Orchid",
        symbol: "OXT",
        slug: "orchid",
        rank: 172,
        is_active: 1,
        first_historical_data: "2019-12-17T01:44:04.000Z",
        last_historical_data: "2021-10-22T10:09:35.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x4575f41308EC1483f3d399aa9a2826d74Da13Deb",
          decimals: 18,
        },
      },
      {
        id: 2496,
        name: "Polymath",
        symbol: "POLY",
        slug: "polymath-network",
        rank: 149,
        is_active: 1,
        first_historical_data: "2018-02-02T03:14:29.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x9992ec3cf6a55b00978cddf2b27bc6882d88d1ec",
          decimals: 18,
        },
      },
      {
        id: 4120,
        name: "Prometeus",
        symbol: "PROM",
        slug: "prometeus",
        rank: 165,
        is_active: 1,
        first_historical_data: "2019-07-17T19:14:09.000Z",
        last_historical_data: "2021-10-22T10:09:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xfc82bb4ba86045af6f327323a46e80412b91b27d",
          decimals: 18,
        },
      },
      {
        id: 3155,
        name: "Quant",
        symbol: "QNT",
        slug: "quant",
        rank: 49,
        is_active: 1,
        first_historical_data: "2018-08-10T20:29:27.000Z",
        last_historical_data: "2021-10-22T10:09:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x4a220e6096b25eadb88358cb44068a3248254675",
          decimals: 18,
        },
      },
      {
        id: 2539,
        name: "Ren",
        symbol: "REN",
        slug: "ren",
        rank: 92,
        is_active: 1,
        first_historical_data: "2018-02-21T16:19:21.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x408e41876cccdc0f92210600ef50372656052a38",
          decimals: 18,
        },
      },
      {
        id: 1637,
        name: "iExec RLC",
        symbol: "RLC",
        slug: "rlc",
        rank: 164,
        is_active: 1,
        first_historical_data: "2017-04-20T21:49:49.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x607f4c5bb672230e8672085532f7e901544a7375",
          decimals: 9,
        },
      },
      {
        id: 6210,
        name: "The Sandbox",
        symbol: "SAND",
        slug: "the-sandbox",
        rank: 121,
        is_active: 1,
        first_historical_data: "2020-08-14T13:14:17.000Z",
        last_historical_data: "2021-10-22T10:09:03.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x3845badAde8e6dFF049820680d1F14bD3903a5d0",
          decimals: 18,
        },
      },
      {
        id: 1759,
        name: "Status",
        symbol: "SNT",
        slug: "status",
        rank: 176,
        is_active: 1,
        first_historical_data: "2017-06-28T21:19:15.000Z",
        last_historical_data: "2021-10-22T10:09:23.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x744d70fdbe2ba4cf95131626614a1763df805b9e",
          decimals: 18,
        },
      },
      {
        id: 2586,
        name: "Synthetix",
        symbol: "SNX",
        slug: "synthetix-network-token",
        rank: 94,
        is_active: 1,
        first_historical_data: "2018-03-14T16:54:21.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f",
          decimals: 18,
        },
      },
      {
        id: 2297,
        name: "StormX",
        symbol: "STMX",
        slug: "stormx",
        rank: 167,
        is_active: 1,
        first_historical_data: "2017-12-20T20:14:48.000Z",
        last_historical_data: "2021-10-22T10:09:04.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xbE9375C6a420D2eEB258962efB95551A5b722803",
          decimals: 18,
        },
      },
      {
        id: 1772,
        name: "Storj",
        symbol: "STORJ",
        slug: "storj",
        rank: 147,
        is_active: 1,
        first_historical_data: "2017-07-02T00:54:14.000Z",
        last_historical_data: "2021-10-22T10:09:27.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xb64ef51c888972c908cfacf59b47c1afbc0ab8ac",
          decimals: 8,
        },
      },
      {
        id: 6758,
        name: "SushiSwap",
        symbol: "SUSHI",
        slug: "sushiswap",
        rank: 80,
        is_active: 1,
        first_historical_data: "2020-08-28T16:34:16.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2",
          decimals: 18,
        },
      },
      {
        id: 4279,
        name: "Swipe",
        symbol: "SXP",
        slug: "swipe",
        rank: 148,
        is_active: 1,
        first_historical_data: "2019-08-26T14:49:06.000Z",
        last_historical_data: "2021-10-22T10:09:04.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x8ce9137d39326ad0cd6491fb5cc0cba0e089b6a9",
          decimals: 18,
        },
      },
      {
        id: 2394,
        name: "Telcoin",
        symbol: "TEL",
        slug: "telcoin",
        rank: 96,
        is_active: 1,
        first_historical_data: "2018-01-15T00:19:18.000Z",
        last_historical_data: "2021-10-22T10:09:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x467bccd9d29f223bce8043b84e8c8b282827790f",
          decimals: 2,
        },
      },
      {
        id: 2467,
        name: "OriginTrail",
        symbol: "TRAC",
        slug: "origintrail",
        rank: 174,
        is_active: 1,
        first_historical_data: "2018-01-25T03:39:27.000Z",
        last_historical_data: "2021-10-22T10:09:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xaa7a9ca87d3694b5755f213b5d04094b8d0f0a6f",
          decimals: 18,
        },
      },
      {
        id: 2758,
        name: "Unibright",
        symbol: "UBT",
        slug: "unibright",
        rank: 160,
        is_active: 1,
        first_historical_data: "2018-05-21T14:34:25.000Z",
        last_historical_data: "2021-10-22T10:09:15.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x8400d94a5cb0fa0d041a3788e395285d61c9ee5e",
          decimals: 8,
        },
      },
      {
        id: 5617,
        name: "UMA",
        symbol: "UMA",
        slug: "uma",
        rank: 114,
        is_active: 1,
        first_historical_data: "2020-05-25T16:44:12.000Z",
        last_historical_data: "2021-10-22T10:09:06.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x04Fa0d235C4abf4BcF4787aF4CF447DE572eF828",
          decimals: 18,
        },
      },
      {
        id: 7083,
        name: "Uniswap",
        symbol: "UNI",
        slug: "uniswap",
        rank: 12,
        is_active: 1,
        first_historical_data: "2020-09-17T01:14:14.000Z",
        last_historical_data: "2021-10-22T10:09:34.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
          decimals: 18,
        },
      },
      {
        id: 3408,
        name: "USD Coin",
        symbol: "USDC",
        slug: "usd-coin",
        rank: 10,
        is_active: 1,
        first_historical_data: "2018-10-08T18:49:28.000Z",
        last_historical_data: "2021-10-22T10:09:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          decimals: 6,
        },
      },
      {
        id: 3330,
        name: "Pax Dollar",
        symbol: "USDP",
        slug: "paxos-standard",
        rank: 103,
        is_active: 1,
        first_historical_data: "2018-09-27T20:54:23.000Z",
        last_historical_data: "2021-10-22T10:09:04.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x8e870d67f660d95d5be530380d0ec0bd388289e1",
          decimals: 18,
        },
      },
      {
        id: 3717,
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        slug: "wrapped-bitcoin",
        rank: 14,
        is_active: 1,
        first_historical_data: "2019-01-30T18:19:09.000Z",
        last_historical_data: "2021-10-22T10:09:07.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
          decimals: 8,
        },
      },
      {
        id: 7501,
        name: "WOO Network",
        symbol: "WOO",
        slug: "wootrade",
        rank: 120,
        is_active: 1,
        first_historical_data: "2020-10-28T08:55:00.000Z",
        last_historical_data: "2021-10-22T10:10:05.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x4691937a7508860f876c9c0a2a617e7d9e945d4b",
          decimals: 18,
        },
      },
      {
        id: 7288,
        name: "Venus",
        symbol: "XVS",
        slug: "venus",
        rank: 161,
        is_active: 1,
        first_historical_data: "2020-10-05T05:10:00.000Z",
        last_historical_data: "2021-10-22T10:10:03.000Z",
        platform: {
          network: "BEP20",
          token_address: "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
          decimals: 18,
        },
      },
      {
        id: 2765,
        name: "XYO",
        symbol: "XYO",
        slug: "xyo",
        rank: 154,
        is_active: 1,
        first_historical_data: "2018-05-22T17:04:27.000Z",
        last_historical_data: "2021-10-22T10:09:19.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x55296f69f40ea6d20e478533c15a6b08b654e758",
          decimals: 18,
        },
      },
      {
        id: 5864,
        name: "yearn.finance",
        symbol: "YFI",
        slug: "yearn-finance",
        rank: 86,
        is_active: 1,
        first_historical_data: "2020-07-20T21:44:15.000Z",
        last_historical_data: "2021-10-22T10:09:30.000Z",
        platform: {
          network: "ERC20",
          token_address: "0x0bc529c00c6401aef6d220be8c6ea1667f6ad93e",
          decimals: 18,
        },
      },
    ];

    config.linkedinActivityUrl = (activityURN) =>
      `https://api.linkedin.com/v2/activities?ids=urn:li:activity:${activityURN}&projection=(results(*(domainEntity~)))`;
    config.linkedinStatsUrl = (type, idPost, organization) =>
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&${type}s[0]=urn:li:${type}:${idPost}&organizationalEntity=${organization}`;
    config.linkedinUgcPostStats = (idPost) =>
      `https://api.linkedin.com/v2/videoAnalytics?q=entity&entity=urn:li:ugcPost:${idPost}&type=VIDEO_VIEW`;
    app.config = config;
    resolve(app);
  });
};
