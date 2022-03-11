<!-- ABOUT THE PROJECT -->

## Node-SaTT <img align="left" width="50" height="50" src="docs/img/logo-s.png">

### Introduction

Welcome to SaTT Webservice endpoint, this backend provides webservice to SaTT WebWallet and advertising campaign manager : [Wallet](https://satt.atayen.us/)

It provides :

-   Masterseed HD Wallet management for SaTT and other main cryptos.
-   Transaction management
-   Advertising campaign management

### Built With

This projetct is build in `JavaScript` for `NodeJS` and these main `npm` modules :

-   [Express](https://expressjs.com/)
-   [Mongodb](https://github.com/mongodb/node-mongodb-native)
-   [Web3.js](https://web3js.readthedocs.io/en/v1.3.0/)
-   [Passport.js](http://www.passportjs.org/)

<!-- GETTING STARTED -->

## Getting Started

To run SaTT API webservice Provider you will need `NodeJS 12.0+` and `npm` Package manager.

### Prerequisites

-   MongoDB database connection

    1. Install the driver as a dependency:

        ```sh
         npm install mongodb
        ```

        For complete MongoDB installation instructions, see [the manual](https://docs.mongodb.com/manual/installation/).

    2. Connect to MongoDB via URI
       The standard MongoDB URI connection scheme has the form:
        ```sh
        mongodb://[username:password@]host1[:port1][,...hostN[:portN]]][/[database][?options]]
        ```
        Update your database connection details in the .env file.

-   Web3 service provider with [Geth](https://geth.ethereum.org/),[openerhereum](https://github.com/openethereum/openethereum) or [Infura](https://infura.io/) SaaS
-   PM2 Process Manager, you can install it a described below:

```sh
 npm install pm2 -g
```

### To run the project

1. Clone the repository:
    ```sh
    git clone https://github.com/Atayen/node-satt.git
    ```
2. Edit conf/config.js file

3. Register and start PM2 service:
    ```sh
    pm2 start app.js
    ```

### Testing

To launch the test part please run the following command line:

```sh
  npm run test
```

## Usage

After you run the project, you can navigate to [https://localhost:3015/docs](http://localhost:3015/docs) to see the full list of available endpoints.

<!-- Project Structure -->

## Project Structure

The folder structure of this app is explained below:

| Name             | Description                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **node_modules** | Contains all npm dependencies                                                                   |
| **helpers**      | Contains all requirements and the cron job actions                                              |
| **manager**      | Contains all the definitions of oracles                                                         |
| **conf**         | Contains all configuration for the blockChain part                                              |
| **controllers**  | Controllers define functions to serve various express routes                                    |
| **routes**       | Contain all express routes, separated by module/area of application                             |
| **middlewares**  | Express middlewares which process the incoming requests before handling them down to the routes |
| **routes**       | Contain all express routes, separated by module/area of application                             |
| **test**         | Contain all unit test cases                                                                     |
| app.js           | Entry point to express app                                                                      |
| package.json     | Contains npm dependencies as well as the scripts                                                |

Please read [the documentaion](/docs) for more information.

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/Atayen/node-satt/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contribute to earn Rewards

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**. :v::tada:

Valuable contributions will be :moneybag: **rewarded** :moneybag:. We are able to offer an important and well studied amount converted in our cryptocrruency SaTT according to the complexity of the issue. Rewards are released within one week of the pull request being merged. All rewards are at editorial discretion.

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for more information on what we're looking for and how to get started.

<!-- LICENSE -->

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.

<!-- CONTACT -->

## Support

Please do not hesitate to contact us at dev@atayen.us if you have any further questions or observations. :pray: :pencil2:
