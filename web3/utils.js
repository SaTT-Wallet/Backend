const { web3 } = require('./web3-connection')
const { Constants } = require('../conf/const')

const isValidAddress = function (address) {
    return web3.eth.isValidAddress(address)
}

const getGasPrice = function () {}

const getBalanceOf = function () {}

const estimateGas = function () {}

const getWallet = function () {}

const getContractByTokenAddress = function (web3, contractAddress) {
    return new web3.eth.Contract(Constants.token.abi, contractAddress)
}

module.exports = {
    getContractByTokenAddress,
    isValidAddress,
}
