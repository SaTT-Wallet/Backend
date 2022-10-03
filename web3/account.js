const { web3 } = require('./web3-connection')

const getBalanceOf = function (address) {
    return web3.eth.getBalance(address)
}

const unlockAccount = async function ({ web3, keyStore, walletPassword }) {
    return web3.eth.accounts.wallet.decrypt([keyStore], walletPassword)
}

module.exports = {
    getBalanceOf,
    unlockAccount,
}
