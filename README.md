# SaTT Wallet 🚀💼

Welcome to SaTT Wallet, a cutting-edge project in the realm of smart advertising. Our wallet leverages blockchain technology to offer a unique approach to managing and transacting with the Smart Advertising Transaction Token (SaTT). 🌐💰

## Project Overview 📚

Our project is composed of two main repositories:

1. **Backend** 🖥️: This part of the project provides the webservice for the SaTT Token WebWallet and the advertising campaign manager. It's primarily written in JavaScript.

2. **Frontend** 🎨: The frontend of the SaTT wallet is built using Angular, a robust framework in the TypeScript ecosystem.

## How to Contribute 💪🔧

We welcome developers who are passionate about decentralized technology, advertising, and improving user experience.

To contribute:

1. Fork the repository you wish to contribute to (Backend or Frontend). 🍴
2. Create a new branch for your feature. 🌿
3. Make your changes and commit them with clear, concise messages. 📝
4. Push your changes to your branch. 🚀
5. Create a pull request. 🙏

We strongly encourage contributors to adhere to best coding practices, which include:

- Write clean, readable, and maintainable code. 🧹✨
- Use meaningful naming for variables, functions, classes, and modules. 🏷️
- Comment your code where necessary but strive to make your code as self-explanatory as possible. 🗂️
- Avoid large commits that make the code review process more difficult. Break your work into small, individual commits each with a specific purpose. 🧩
- Update and write tests when contributing to code. 🧪

## Get in Touch 📞📧

If you have any questions or suggestions, please reach out to us at contact@satt-token.com. You can also follow our updates on Twitter at [@SaTT_Token](https://twitter.com/SaTT_Token).

Happy coding! 🎉👩‍💻👨‍💻

### Built With

This project is build in JavaScript for NodeJS and these main npm modules :

-   [Express](https://expressjs.com/)
-   [Mongodb](https://github.com/mongodb/node-mongodb-native)
-   [Web3.js](https://web3js.readthedocs.io/en/v1.3.0/)
-   [Passport.js](http://www.passportjs.org/)
-   [bn.js](https://github.com/indutny/bn.js/)

<!-- GETTING STARTED -->

### Blockchain deployment

1. You can check all our different smart contracts in contract folder:

![alt text](/public/contracts.png)

2. To Deploy smart contracts (token, campaign and oracle) in contract folder with [Remix](https://remix.ethereum.org) and [Metamask](https://metamask.io/) or [MEW](https://www.myetherwallet.com/):

\*\*create your file on Remix and paste your code there

![alt text](/public/remix.png)

\*\*Compile your file.sol and check

![alt text](/public/compile.png)

\*\*To deploy your smart contract you should connect with your metamask account

![alt text](/public/deploy.png)

3. To create node, Web3 service provider with [Geth](https://geth.ethereum.org/),[openethereum](https://github.com/openethereum/openethereum) or [Infura](https://infura.io/) SaaS

\*\*Create new Ethereum app

![alt text](/public/createinfura.png)

\*\*Get node credentials from infura such as PROJECTID, PROJECT SECRET, and the endpoints that we can use to connect to infura node(https, wss)

![alt text](/public/keysinfura.png)

```sh
WEB3_URL=process.env.WEB3_URL
```

You can also install Geth Node you can follow this [Guide](https://geth.ethereum.org/docs/getting-started) or [Parity](https://openethereum.github.io/Setup)

4. on campaign contract call modToken(<token_address>,true)
5. on campaign contract call setOracle(<oracle_address>)
6. on oracle contract call changeAsk(<campaign_address>,true)

## Getting Started

To run SaTT API webservice Provider you will need NodeJS 14.0+ and npm Package manager

### Prerequisites

For development, you will only need Node.js and a node global package.

### Node

-   #### Node installation on Windows

    Just go on [official Node.js website](https://nodejs.org/) and download the installer.
    Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

-   #### Node installation on Ubuntu

    You can install nodejs and npm easily with apt install, just run the following commands.

        $ sudo apt install nodejs
        $ sudo apt install npm

    node --version
    up to v14.x.x

    npm --version
    up to 6.x.x

    If the installation was successful, you should be able to run the following command.
    PM2 Process Manager, you can install it as described below :

    ```sh
    npm install pm2 -g
    ```

### Installation

1. Clone the repo
    ```sh
    git clone https://github.com/Atayen/node-satt.git
    ```
2. ```sh
   cd <project_name>
   npm install
   ```

````

3. Edit .env file with the right properties


4. Register and start PM2 service or install nodemon
```sh
pm2 start app.js
````

or

```sh
npm start
```

or

```sh
nodemon
```

<!-- USAGE EXAMPLES -->

## Usage

After you run the project, you can navigate to [https://localhost:3015/docs](http://localhost:3015/docs) to see the full list of available endpoints.

## Project Structure

The folder structure of this app is explained below:

| Name             | Description                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **node_modules** | Contains all npm dependencies                                                                   |
| **helpers**      | Contains all requirements and the cron job actions                                              |
| **manager**      | Contains all the definitions of oracles                                                         |
| **conf**         | Contains all configuration for the blockChain part.                                             |
| **controllers**  | Controllers define functions to serve various express routes.                                   |
| **routes**       | Contain all express routes, separated by module/area of application .                           |
| **middlewares**  | Express middlewares which process the incoming requests before handling them down to the routes |
| **routes**       | Contain all express routes, separated by module/area of application                             |
| app.js           | Entry point to express app                                                                      |
| package.json     | Contains npm dependencies as well as the scripts                                                |
|                  |

# Swagger

## Specification

The swagger specification file is named as swagger.yaml. The file is located under definition folder.
Example:

```
paths:
  /hello:
    get:
      x-swagger-router-controller: helloWorldRoute
      operationId: helloWorldGet
      tags:
        - /hello
      description: >-
        Returns the current weather for the requested location using the
        requested unit.
      parameters:
        - name: greeting
          in: query
          description: Name of greeting
          required: true
          type: string
      responses:
        '200':
          description: Successful request.
          schema:
            $ref: '#/definitions/Hello'
        default:
          description: Invalid request.
          schema:
            $ref: '#/definitions/Error'
definitions:
  Hello:
    properties:
      msg:
        type: string
    required:
      - msg
  Error:
    properties:
      message:
        type: string
    required:
      - message
```

### Highlights of the swagger.yaml File

-   /hello:

    Specifies how users should be routed when they make a request to this endpoint.

-   x-swagger-router-controller: helloWorldRoute

    Specifies which code file acts as the controller for this endpoint.

-   get:

    Specifies the method being requested (GET, PUT, POST, etc.).

-   operationId: hello

    Specifies the direct method to invoke for this endpoint within the controller/router

-   parameters:

    This section defines the parameters of your endpoint. They can be defined as path, query, header, formData, or body.

-   definitions:
    This section defines the structure of objects used in responses or as parameters.

## Swagger Middleware

The project is using npm module `swagger-tools` that provides middleware functions for metadata, security, validation and routing, and bundles Swagger UI into Express.

<!-- Project Structure -->

<!-- ROADMAP -->

## Roadmap

See the [open issues](https://github.com/Atayen/node-satt/issues) for a list of proposed features (and known issues).

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Social networks

-   #### Facebook configuration

    To create a Facebook app you should visit [official developer.facebook.com website](https://developers.facebook.com/apps/) and respect the following steps:

    # Create an app

![alt text](/public/1.png)

# Confirm app creation

![alt text](/public/2.png)

# Get Facebook credentials

![alt text](/public/3.png)

# Get Facebook version

![alt text](/public/4.png)

PS:
All these credentials refer to APPID,APP_SECRET,FB_GRAPH_VERSION in .env file

```sh
APPID=process.env.APPID
APP_SECRET=process.env.APP_SECRET
FB_GRAPH_VERSION=process.env.FB_GRAPH_VERSION
```

-   #### Google configuration

    To create a google app you should visit [official console.developers.google.com website](https://console.developers.google.com/) and respect the following steps:

    # Create Credentials

![alt text](/public/11.png)

# Fill out the form

![alt text](/public/22.png)

# Get Client credentials

![alt text](/public/33.png)

# Create Youtube configuration

![alt text](/public/111.png)

# Get Youtube configuration

![alt text](/public/222.png)

PS:
All this credentials refers to GOOGLE_CLIENTID,GOOGLE_CLIENT_SECRET and GDA_TAP_API_KEY in .env file

```sh
GOOGLE_CLIENTID=process.env.GOOGLE_CLIENTID
GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET
GDA_TAP_API_KEY= process.env.GDA_TAP_API_KEY
```

-   #### LinkedIn configuration

    To create a linkedin app you should visit [official developer.linkedin.com website](https://developer.linkedin.com/) and respect the following steps:

    # Create a new app

![alt text](/public/333.png)

# Get linkedin crededentials

![alt text](/public/444.png)

PS:
All these credentials refer to LINKEDIN_KEY and LINKEDIN_SECRET in .env file

```sh
LINKEDIN_KEY=process.env.LINKEDIN_KEY
LINKEDIN_SECRET=process.env.LINKEDIN_SECRET
```

-   #### Twitter configuration

    To create a linkedin app you should visit [official developers.twitter.com website](https://developer.twitter.com/) and respect the following steps:

    # Create a new app

![alt text](/public/1t.png)

# Set params for your app

![alt text](/public/2t.png)

# Get your twitter credentials

![alt text](/public/3t.png)

# Get your twitter credentials

you can regenerate again your credentials with more options

![alt text](/public/4t.png)

PS:
All this credentials refers to TWITTER_CONSUMER_KEY_ALT, TWILTTER_CONSUMER_SECRET_ALT,TWITTER_CONSUMER_SECRET_DEV,TWITTER_CONSUMER_KEY
TWITTER_CONSUMER_SECRET,TWITTER_ACCESS_TOKEN_KEY and TWITTER_ACCESS_TOKEN_SECRET in .env file

```sh
TWITTER_CONSUMER_KEY_ALT=process.env.TWITTER_CONSUMER_KEY_ALT
TWILTTER_CONSUMER_SECRET_ALT=process.env.TWILTTER_CONSUMER_SECRET_ALT
TWITTER_CONSUMER_SECRET_DEV=process.env.TWITTER_CONSUMER_SECRET_DEV
TWITTER_CONSUMER_KEY=process.env.TWITTER_CONSUMER_KEY
TWITTER_CONSUMER_SECRET=process.env.TWITTER_CONSUMER_SECRET
TWITTER_ACCESS_TOKEN_KEY=process.env.TWITTER_ACCESS_TOKEN_KEY
TWITTER_ACCESS_TOKEN_SECRET=process.env.TWITTER_ACCESS_TOKEN_SECRET
```

-   #### Telegram configuration

    To create a Telegram bot you should set it via mobile Telegram application:

    # BotFather

![alt text](/public/bot1.png)

# Get your confirmation

![alt text](/public/bot2.png)

PS:
This credential refers to TELEGRAM_BOT_TOKEN in .env file

```sh
TELEGRAM_BOT_TOKEN=process.env.TELEGRAM_BOT_TOKEN

```

-   #### CoinMarketCap

We get data referred to Satt token from [official coinmarketcap.com/api website](https://coinmarketcap.com/api/) and respect the following steps:

# Create your account

![alt text](/public/marketcap0.png)

# Get your credentials

![alt text](/public/marketcap1.png)

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE` for more information.

<!-- CONTACT -->

## Contact

For more information don't hesitate to contact us by email to dev@atayen.us
