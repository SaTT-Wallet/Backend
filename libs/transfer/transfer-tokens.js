const Web3 = require('web3')
const Big = require('big.js')
const fromExponential = require('from-exponential')

module.exports.transferTokens = async function ({
    fromAddress,
    toAddress,
    amount,
    tokenSmartContractAddress = null,
    tokenSmartContractAbi = null,
    provider,
    walletPassword,
    encryptedPrivateKey,
    max = false,
    token = false,
    network = null,
}) {
    const web3 = new Web3(provider)
    if (!web3.utils.isAddress(fromAddress)) {
        throw Error('The sender address is not a valid ethereum address !!')
    }

    if (!web3.utils.isAddress(toAddress)) {
        throw Error('The recipient address is not a valid ethereum address !!')
    }

    let tokenSmartContract = null

    if (tokenSmartContractAddress !== null) {
        tokenSmartContract = new web3.eth.Contract(
            tokenSmartContractAbi,
            tokenSmartContractAddress
        )
    }

    const senderBalance =
        tokenSmartContractAddress === null
            ? await web3.eth.getBalance(fromAddress)
            : await tokenSmartContract.methods.balanceOf(fromAddress).call()

    if (new Big(amount).gt(new Big(senderBalance)) && max === 'flase') {
        throw Error('No enough balance to perform withdraw !!')
    }

    const gasPrice = await web3.eth.getGasPrice()
    if (max === 'true') amount = senderBalance

    let gasLimit =
        tokenSmartContractAddress === null
            ? await web3.eth.estimateGas({ to: toAddress })
            : await tokenSmartContract.methods
                  .transfer(toAddress, amount)
                  .estimateGas({ from: fromAddress })

    web3.eth.accounts.wallet.decrypt([encryptedPrivateKey], walletPassword)

    try {
        let result
        if (
            tokenSmartContractAddress === null ||
            tokenSmartContractAddress === process.env.TOKEN_BTT_CONTRACT
        ) {
            token && (gasLimit = 21000)
            if (max == 'true')
                amount = new Big(senderBalance).minus(
                    new Big(gasLimit).times(new Big(gasPrice))
                )

            result = await web3.eth.sendTransaction({
                from: fromAddress,
                to: toAddress,
                value: fromExponential(amount),
                gas: gasLimit,
                gasPrice,
            })
        } else {
            gasLimit = network === 'BEP20' ? 21000 : 65000
            result = await tokenSmartContract.methods
                .transfer(toAddress, fromExponential(amount))
                .send({
                    from: fromAddress,
                    gas: gasLimit,
                    gasPrice,
                })
        }

        return {
            blockHash: result.blockHash,
            blockNumber: result.blockNumber,
            transactionHash: result.transactionHash,
            from: fromAddress,
            to: toAddress,
            amount: amount,
        }
    } catch (error) {
        return { error: error.message }
    } finally {
        web3.eth.accounts.wallet.remove(fromAddress)
    }
}
