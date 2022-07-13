const bip38 = require('bip38')
const wif = require('wif')
const child = require('child_process')
const rp = require('request-promise')
const bitcoinjs = require('bitcoinjs-lib')
const config = require('./config')

module.exports.transferBTC = async function ({
    to,
    amount,
    walletPassword,
    account,
}) {
    var escpass = walletPassword.replace(/'/g, "\\'")

    var priv = bip38.decrypt(account.btc.ek, escpass)

    var encode = wif.encode(0x80, priv.privateKey, priv.compressed)

    var addr = account.btc.addressSegWitCompat

    var utxo = JSON.parse(
        child.execSync(
            config.BTC_CMD + ' listunspent 1 1000000 \'["' + addr + '"]\''
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

    var body = await rp({ uri: config.BTS_FEES, json: true })
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
    var transactionHash = tx.getId()

    var rec = child.execSync(
        config.BTC_CMD + ' sendrawtransaction "' + signed + '"'
    )
    return { transactionHash }
}
