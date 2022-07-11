const Web3 = require('web3')
const Big = require('big.js')

const transferBTC = async function ({ to, amount, walletPassword, account }) {
    var account = await Wallet.findOne({ UserId: parseInt(id) })

    var escpass = walletPassword.replace(/'/g, "\\'")

    var priv = bip38.decrypt(account.btc.ek, escpass)

    var encode = wif.encode(0x80, priv.privateKey, priv.compressed)

    var addr = account.btc.addressSegWitCompat

    var utxo = JSON.parse(
        child.execSync(
            process.env.BTC_CMD + ' listunspent 1 1000000 \'["' + addr + '"]\''
        )
    )

    if (!utxo.length) {
        return { error: 'insufficient funds ' }
    }

    var max = 0.0
    for (var i = 0; i < utxo.length; i++) {
        max += parseFloat(utxo[i].amount)
    }
    max = Math.floor(parseFloat(max) * 100000000)

    var body = await rp({ uri: process.env.BTS_FEES, json: true })
    var feeRate = 15 // parseInt(body.fastestFee);

    var maxFee = 20000

    const keyPair = bitcoinjs.ECPair.fromWIF(encode)
    const txb = new bitcoinjs.TransactionBuilder()

    var input_sum = 0
    var fee = (45 + utxo.length * 93) * feeRate
    for (var i = 0; i < utxo.length; i++) {
        txb.addInput(utxo[i].txid, parseInt(utxo[i].vout))
        input_sum += Math.round(parseFloat(utxo[i].amount) * 100000000)
    }
    var change = input_sum - parseInt(amount) - (fee + 34 * feeRate)
    txb.addOutput(to, parseInt(amount))

    if (change > fee) {
        txb.addOutput(addr, parseInt(change))
        fee += 34 * feeRate
    }

    if (parseInt(amount) + parseInt(fee) > max) {
        return {
            error: 'insufficient funds for gas',
        }
    }

    const p2wpkh = bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey })
    const p2sh = bitcoinjs.payments.p2sh({ redeem: p2wpkh })

    for (var i = 0; i < utxo.length; i++) {
        txb.sign(
            i,
            keyPair,
            p2sh.redeem.output,
            null,
            Math.round(parseFloat(utxo[i].amount) * 100000000)
        )
    }
    var tx = txb.build()

    var signed = tx.toHex()
    var hash = tx.getId()

    var rec = child.execSync(
        process.env.BTC_CMD + ' sendrawtransaction "' + signed + '"'
    )
    return hash
}

const transferTokens = async function ({
    fromAddress,
    toAddress,
    amount,
    tokenSmartContractAddress = null,
    tokenSmartContractAbi = null,
    provider,
    walletPassword,
    publicKey,
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

    if (new Big(amount).gt(new Big(senderBalance))) {
        throw Error('No enough balance to perform withdraw !!')
    }

    const gasPrice = await web3.eth.getGasPrice()

    const gasLimit =
        tokenSmartContractAddress === null
            ? await web3.eth.estimateGas({ to: toAddress })
            : await tokenSmartContract.methods
                  .transfer(toAddress, amount)
                  .estimateGas({ from: fromAddress })

    web3.eth.accounts.wallet.decrypt([publicKey], walletPassword)

    try {
        let result

        if (tokenSmartContractAddress === null) {
            result = await web3.eth.sendTransaction({
                from: fromAddress,
                to: toAddress,
                value: amount,
                gas: gasLimit,
                gasPrice,
            })
        } else {
            result = await tokenSmartContract.methods
                .transfer(toAddress, amount)
                .send({
                    from: fromAddress,
                    gas: gasLimit,
                    gasPrice,
                })
        }

        return {
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

module.exports = {
    transferTokens,
    transferBTC,
}
