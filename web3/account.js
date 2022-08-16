const { web3 } = require('./web3-connection')
const isAddress = require('./utils')

const getBalanceOf = function (address) {
    return web3.eth.getBalance(address)
}

const getBalanceByContract = function (accountAddress, contractAddress) {
    const contract = web3.eth.Contract(accountAddress, contractAddress)
}

const getWeb3Account = function () {}

const unlockAccount = async function ({ web3, keyStore, walletPassword }) {
    return web3.eth.accounts.wallet.decrypt([keyStore], walletPassword)
}

module.exports = {
    getBalanceOf,
    unlockAccount,
}
