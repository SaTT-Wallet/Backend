const Big = require('big.js')
const { webTronInstance } = require('../../blockchainConnexion')

module.exports.transferTronTokens = async function ({
    tronAddress,
    toAddress,
    amount,
    privateKey,
    max = false,
}) {
    console.log(arguments)
    let tronWeb = await webTronInstance()
    tronWeb.setPrivateKey(privateKey)
    let walletAddr = tronWeb.address.fromPrivateKey(privateKey)
    console.log(walletAddr)
    tronWeb.setAddress(walletAddr)
    if (!tronAddress) throw Error("The account doesn't have a tron address !")
    if (!tronWeb.isAddress(tronAddress))
        throw Error('The sender address is not a valid tron address !!')
        console.log(tronWeb.isAddress(toAddress))
    if (!tronWeb.isAddress(toAddress))
        throw Error('The recipient address is not a valid tron address !!')
    if (tronAddress === toAddress)
        throw Error('you cant send to your own wallet address !!')
    let balance = await tronWeb.trx.getBalance(tronAddress)
    console.log({balance})
   /* JSON.parse(max) && (amount = balance)
    if (balance === 0) throw Error('No enough balance to perform withdraw !!')
    if (new Big(amount).gt(new Big(balance)))
        throw Error('No enough balance to perform withdraw !!')*/
    try {
        let result = await tronWeb.trx.sendTransaction(toAddress, amount)
        console.log(6666666666666)
        console.log(result)
        return {
            blockHash: result.transaction?.raw_data?.ref_block_hash,
            blockNumber: result.transaction?.raw_data?.ref_block_bytes,
            transactionHash: result.transaction?.txID,
            from: tronAddress,
            to: toAddress,
            amount: amount,
        }
    } catch (error) {
        console.error(error)
        return { error: error.message }
    }
}
