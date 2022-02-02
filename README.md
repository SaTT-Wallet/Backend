

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

To run SaTT API webservice Provider you will need NodeJS 14.0+ and npm Package manager

### Prerequisites


For development, you will only need Node.js and a node global package.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

   node --version
      up to  v14.x.x

   npm --version
      up to  6.x.x



If the installation was successful, you should be able to run the following command.
* MongoDB database connection
* Web3 service provider with [Geth](https://geth.ethereum.org/),[openerhereum](https://github.com/openethereum/openethereum) or [Infura](https://infura.io/) SaaS
* deployed smart contracts (token,campaign and oracle) in contract folder
* on campaign contract call modToken(<token_address>,true)
* on campaign contract call setOracle(<oracle_address>)
* on oracle contract call changeAsk(<campaign_address>,true)
* PM2 Process Manager, you can install it a described below : 

   ```sh
   npm install pm2 -g
   ```
 

### Installation


1. Clone the repo
   ```sh
   git clone https://github.com/Atayen/node-satt.git
   ```
2.  ```sh
   cd <project_name>
   npm install
   ```
   
3. Edit .env file with the right properties


4. Register and start PM2 service or install nodemon
   ```sh
   pm2 start app.js
   ```
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


| Name                     | Description                                                                                   |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **node_modules**         | Contains all  npm dependencies                                                                |
| **helpers**              | Contains all requirements and the cron job actions                                            |
| **manager**              | Contains all the definitions of oracles                                                       |
| **/conf/**               | Contains all configuration for the blockChain part.                                           |
| **/controllers**         | Controllers define functions to serve various express routes.                                 |
| **/routes**              | Contain all express routes, separated by module/area of application .                         |
| **/middlewares**         | Express middlewares which process the incoming requests before handling them down to the routes
| **src/routes**           | Contain all express routes, separated by module/area of application                           |
|  /app.js                 | Entry point to express app                                                                    |
| package.json             | Contains npm dependencies as well as the scripts  
                                                                                                                           |


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

- /hello:
  
  Specifies how users should be routed when they make a request to this endpoint.
- x-swagger-router-controller: helloWorldRoute

  Specifies  which code file acts as the controller for this endpoint.
- get:

  Specifies the method being requested (GET, PUT, POST, etc.).
- operationId: hello
  
  Specifies the direct method to invoke for this endpoint within the controller/router 
- parameters:
  
   This section defines the parameters of your endpoint. They can be defined as path, query, header, formData, or body.
- definitions:
   
   This section defines the structure of objects used in responses or as parameters.
## Swagger Middleware
The project is using npm module `swagger-tools` that provides middleware functions for metadata, security, validation and routing, and bundles Swagger UI into Express.

<!-- Project Structure -->

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




### Social networks


- #### Facebook configuration


  To create a Facebook app you should visit [official developer.facebook.com website](https://developers.facebook.com/apps/) and respect the following steps:

  # Create an app

![alt text](/public/1.png)


  # Confirm app creation


![alt text](/public/2.png)



  # Get Facebook cridentials

![alt text](/public/3.png)



  # Get Facebook version


![alt text](/public/4.png)


PS: 
All this cridentials refers to APPID,APP_SECRET,FB_GRAPH_VERSION in .env file

```sh
APPID=process.env.APPID
APP_SECRET=process.env.APP_SECRET
FB_GRAPH_VERSION=process.env.FB_GRAPH_VERSION
```

- #### Google configuration

  To create a google app you should visit [official console.developers.google.com website](https://console.developers.google.com/) and respect the following steps:

  # Create Cridentialds

![alt text](/public/11.png)


  # Fill out the form

![alt text](/public/22.png)



  # Get Client cridedentials

![alt text](/public/33.png)


PS: 
All this cridentials refers to GOOGLE_CLIENTID,GOOGLE_CLIENT_SECRET in .env file

```sh
GOOGLE_CLIENTID=process.env.GOOGLE_CLIENTID
GOOGLE_CLIENT_SECRET=process.env.GOOGLE_CLIENT_SECRET
```


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.



<!-- CONTACT -->
## Contact

For more information don't hesitate to contact us by email to dev@atayen.us




