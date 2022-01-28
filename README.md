

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

After you run the project, you can navigate to [https://localhost:3015/docs](http://localhost:3015/docs) to see the full list of available endpoints.

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




