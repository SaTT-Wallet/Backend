

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

#  authentication endpoints

GET /auth/captcha
POST  /auth/verifyCaptcha
POST  /auth/signin/mail
POST  /auth/passlost
POST  /auth/confirmCode
POST  /auth/passrecover
POST  /auth/signup/mail
GET  /auth/signup/facebook
GET  /auth/signin/facebook
GET  /auth/signup/google
GET  /auth/signin/google
GET  /auth/signup/telegram
GET  /auth/signin/telegram
POST  /auth/resend/confirmationToken
POST  /auth/save/firebaseAccessToken
PUT  /auth/updateLastStep
POST  /auth/apple
POST   /auth/socialSignup
POST   /auth/socialSignin

#  campaign endpoints

POST   /campaign/bep20/:token/approval/:spender/:addr
POST   /campaign/bep20/allow
POST   /campaign/erc20/{token}/approval/:spender/:addr
POST   /campaign/erc20/allow
POST   /campaign/launch/performance
POST   /campaign/launchBounty
GET   /campaign/totalEarned
GET   /campaign/campaigns
GET   /campaign/details/{id}
GET   /campaign/totalSpent
GET   /campaign/pendingLink/{id}
GET   /campaign/campaignPrompAll/{id}
POST   /campaign/apply
POST   /campaign/linkNotification
POST   /campaign/validate
POST   /campaign/gains
POST   /campaign/save
GET   /campaign/{idCampaign}/kits
POST  /campaign/addKits
PUT   /campaign/update/{idCampaign}
GET   /campaign/prom/stats/{idProm}
GET   /campaign/filterLinks/{id_wallet}
POST  /campaign/funding
POST   /campaign/remaining

#   profile endpoints

GET /profile/addChannel/facebook
GET  /profile/addChannel/twitter
GET  /profile/addChannel/linkedin
GET  /profile/addChannel/youtube
GET  /profile/account
GET  /profile/picture
PUT  /profile/UpdateProfile
GET  /profile/UserLegal
GET  /profile/UserIntersts
POST  /profile/AddUserIntersts
PUT  /profile/UpdateUserIntersts
DELETE  /profile/RemoveGoogleChannels
DELETE  /profile/RemoveFacebookChannels
DELETE  /profile/RemoveLinkedInChannels
GET  /profile/socialAccounts
GET  /profile/onBoarding
POST  /profile/receiveMoney
POST /profile/add/Legalprofile
GET  /profile/legalUser/:id

#  wallet endpoints

GET  /wallet/mywallet
GET  /wallet/userBalance
GET  /wallet/Bep20GasPrice
GET  /wallet/cryptoDetails
GET  /wallet/totalBalance
GET  /wallet/Erc20GasPrice
POST  /wallet/transferErc20
POST  /wallet/transferBep20
POST  /wallet/checkWalletToken
POST  /wallet/addNewToken
POST  /wallet/transfertBtc
POST  /wallet/transfertBNB
POST  /wallet/transfertEther
POST  /wallet/getQuote
POST  /wallet/payementRequest
POST  /wallet/bridge
POST  /wallet/exportBtc
POST  /wallet/exportETH
GET  /wallet/prices
GET  /wallet/getMnemo
POST  /wallet/verifyMnemo
POST  /wallet/create

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




