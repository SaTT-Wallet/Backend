# Installation

```
npm install transfer
```

# Usage

```
const { transferTokens } = require('transfer');
const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http_provider_url")

const result = transferTokens({
                  fromAddress: from,
                  toAddress: to,
                  amount,
                  tokenSmartContractAddress: tokenAddress,
                  tokenSmartContractAbi: ContractAbi, // if you are transferring a custom token
                  provider,
                  walletPassword: pass,
                  publicKey: accountData.keystore,
                })

```
