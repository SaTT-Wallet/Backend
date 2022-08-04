const Big = require('big.js')
const { webTronInstance } = require('../../blockchainConnexion')

module.exports.transferTronTokens = async function ({
    tronAddress,
    toAddress,
    amount,
    walletPassword,
}) {
    let privateKey = walletPassword //TODO generate private key from password
    let tronWeb = await webTronInstance()
    tronWeb.setPrivateKey(privateKey)
    let walletAddr = tronWeb.address.fromPrivateKey(privateKey)
    tronWeb.setAddress(walletAddr)
    if (!tronAddress) throw Error("The account doesn't have a tron address !")
    if (!tronWeb.isAddress(tronAddress))
        throw Error('The sender address is not a valid tron address !!')
    if (!tronWeb.isAddress(toAddress))
        throw Error('The recipient address is not a valid tron address !!')
    let balance = await tronWeb.trx.getBalance(tronAddress)
    if (balance === 0) throw Error('No enough balance to perform withdraw !!')
    if (new Big(amount).gt(new Big(balance)))
        throw Error('No enough balance to perform withdraw !!')
    try {
        let result = await tronWeb.trx.sendTransaction(toAddress, amount)
        return {
            blockHash: result.transaction?.raw_data?.ref_block_hash,
            blockNumber: result.transaction?.raw_data?.ref_block_bytes,
            transactionHash: result.transaction?.txID,
            from: tronAddress,
            to: toAddress,
            amount: amount,
        }
    } catch (error) {
        return { error: error.message }
    }
}
