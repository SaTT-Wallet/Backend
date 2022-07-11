# Installation

```
npm install transfer
```

# Usage

```
const { transferV2 } = require('transfer');
const Web3 = require('web3')

const provider = new Web3.providers.HttpProvider("http_provider_url")

const result = transferV2({
                  fromAddress: from,
                  toAddress: to,
                  amount,
                  tokenSmartContractAddress: tokenAddress,
                  tokenSmartContractAbi: ContractAbi, // if you are transferring a non native token
                  provider,
                  walletPassword: pass,
                  publicKey: accountData.keystore,
                })

```
