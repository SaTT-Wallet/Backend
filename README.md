

<!-- ABOUT THE PROJECT -->
## SaTT Wallet API



Welcome to SaTT Webservice endpoint, this backend provides webservice to SaTT WebWallet and advertising campaign manager : [Wallet](https://satt.atayen.us/)

It provides :
* Masterseed HD Wallet management for SaTT and other main cryptos.
* Transaction management
* Advertising campaign management


### Built With

This projetct is build in JavaScript for NodeJS and these main npm modules :
* [Express](https://expressjs.com/)
* [Mongodb](https://github.com/mongodb/node-mongodb-native)
* [Web3.js](https://web3js.readthedocs.io/en/v1.3.0/)
* [Passport.js](http://www.passportjs.org/)
* [bn.js](https://github.com/indutny/bn.js/)



<!-- GETTING STARTED -->
## Getting Started

To run SaTT API webservice Provider you will need NodeJS 12.0+ and npm Package manager

### Prerequisites


* MongoDB database connection
* Web3 service provider with [Geth](https://geth.ethereum.org/),[openerhereum](https://github.com/openethereum/openethereum) or [Infura](https://infura.io/) SaaS
* PM2 Process Manager, you can install it a described below : 

   ```sh
   npm install pm2 -g
   ```
 

### Installation


1. Clone the repo
   ```sh
   git clone https://github.com/Atayen/node-satt.git
   ```
2. Edit conf/config.js file

3. Register and start PM2 service 
   ```sh
   pm2 start app.js
   ```

<!-- USAGE EXAMPLES -->
## Usage

full webservice list : 

   ```sh
   POST /campaign/create
POST /campaign/create/all
POST /campaign/create/youtube
POST /campaign/modify
POST /campaign/fund
POST /campaign/price/ratio
POST /campaign/apply
POST /campaign/validate
POST /campaign/start
POST /campaign/end
POST /campaign/gains
POST /campaign/gains2
POST /campaign/remaining
POST /campaign/tag
POST /campaign/untag
POST /token/approve
GET /token/allowance/:addr/:spender
POST /campaign/estimate/create/youtube
POST /campaign/estimate/fund
POST /campaign/estimate/apply
POST /campaign/estimate/validate
POST /campaign/estimate/gains
POST /campaign/estimate/remaining
POST /token/estimate/approve

POST /auth/email
GET /auth/fb
GET /auth/google
GET /auth/twitter
GET /auth/telegram
GET /auth/activate/:id/:code
GET /auth/passlost
POST /auth/passchange
POST /auth/passrecover

GET /youtube/:id
GET /facebook
GET /instagram/:id
GET /twitter/:user/:id

GET /campaign/id/:id
GET /campaign/all/:influencer
GET /campaign/owner/:owner
GET /campaign/draft/:token
GET /proms/owner/:owner
GET /campaign/:id/proms
GET /campaign/:id/ratios
GET /campaign/:id/funds
GET /campaign/:id/status
GET /campaign/:id/events
GET /prom/:id/status
GET /prom/:id/results
GET /prom/:id/live
GET /results/:id
GET /isalreadysed/:type/:idpost/:iduser
GET /isalreadysed/:type/:idpost

GET /v2/auth/:token
GET /v2/erc20/:token/balance/:addr
GET /v2/bep20/:token/balance/:addr
GET /v2/mywallet/:token
GET /v2/newallet/:token/:pass
GET /v2/printseed/:token/:pass
POST /v2/newallet2
POST /v2/recover
GET /v2/newalletbtc/:token/:pass
GET /v2/resetpass/:token/:pass/:newpass
GET /v2/export/:pass/:token
GET /v2/exportbtc/:pass/:token
GET /v2/transfer/:token/:pass/:to/:val/:gas/:estimate/:gasprice (passer en POST)
GET /v2/transferether/:token/:pass/:to/:val/:gas/:estimate/:gasprice (passer en POST)
GET /v2/transferbtc/:token/:pass/:to/:val (passer en POST)
GET /v2/transferbyuid/:token/:pass/:uid/:val/:gas/:estimate/:gasprice
GET /v2/transferetherbyuid/:token/:pass/:uid/:val/:gas/:estimate/:gasprice
GET /v2/receivewalleteth/:token
GET /v2/receivewalletbtc/:token
GET /v2/confirmselleth/:token
GET /v2/confirmsellbtc/:token
GET /v2/ethpaylist
GET /v2/btcpaylist
GET /v2/ethreceive/:token/:fbid
GET /v2/btcreceive/:token/:fbid
GET /balance/:addr
GET /gasprice
GET /supply
GET /supply2
GET /checkaccount/:addr
GET /v2/txs/:account
GET /txs/:account/:txtype
GET /supply/total
GET /supply/circulating
GET /factor/:id
GET /factorvrfy/:id/:code
GET /v2/erc20/:token/approval/:addr/:spender
POST /v2/erc20/transfer
POST /v2/erc20/allow
GET /v2/bep20/:token/approval/:addr/:spender
POST /v2/bep20/transfer
POST /v2/bep20/allow
POST /v2/bonus
POST /v2/wrap
POST /v2/unwrap
GET /prices
GET /v2/feebtc
GET /v2/transferbnb/:token/:pass/:to/:val/:gas/:estimate/:gasprice
   ```




<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/Atayen/node-satt/issues) for a list of proposed features (and known issues).



<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

Geoffrey Moya - geoffrey@atayen.us




