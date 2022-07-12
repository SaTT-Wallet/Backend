# Installation

```
npm i @atayen-org/transfer
```

# Methods

## transferTokens

| Properties                | Description                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| fromAddress               | Sender address                                                                              |
| toAddress                 | Receiver address                                                                            |
| amount                    | Amount in wei (make sure it's in wei very important !!)                                     |
| tokenSmartContractAddress | Set to null by default so it will send native tokens                                        |
| tokenSmartContractAbi     | Set to null by default                                                                      |
| provider                  | You network provider object                                                                 |
| walletPassword            | Your secret encryption account password                                                     |
| encryptedPrivateKey       | Will be used to decrypt your account along with your encryption password ( walletPasswrod ) |

## transferBTC

| Properties     | Description                                     |
| -------------- | ----------------------------------------------- |
| to             | the receiver address                            |
| amount         | amount in satochi unit                          |
| walletPassword | Your secret account password                    |
| account        | account that contain your encrypted btc account |

# Usage

```js
const { transferTokens } = require('@atayen-org/transfer');
const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http_provider_url")
const tokenSmartContractAbi = // you need to provider smart contract abi
const encryptedPrivateKey = // An encrypted version of your private key

transferTokens({
  fromAddress: "0x7ccf8e6b1ea2c018ec133299b4d41de4e5b28304",
  toAddress: "0xc8640bc88b5751674e3535ecd398962b69ba9845",
  amount: "10000000000000000000",
  tokenSmartContractAddress:  "0x4CB4473Af06B844d06b5eDeF08983B2C5C61e5af",
  tokenSmartContractAbi
  provider,
  walletPassword: "yourSecretWalletPassword",
  encryptedPrivateKey,
}).then((result) => console.log(result))

// it will return a promise with the below value
/*

 xX Example values on testnet here Xx
{
  blockHash: '0x3e1962d40d9e4d0d44646cf96d4c17159dda6d47eabc6fe24b7ce3c99889c6a4',
  blockNumber: 20990200,
  transactionHash: '0xe48b9d35688fb83065791a93f05249e31256e04309d884b665bbada537d03c46',
  from: '0x7ccf8e6b1ea2c018ec133299b4d41de4e5b28304',
  to: '0xc8640bc88b5751674e3535ecd398962b69ba9845',
  amount: '10000000000000000000'
}

*/

```
