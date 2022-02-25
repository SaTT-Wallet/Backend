module.exports = async function (app) {
    var ercManager = {}

    ercManager.approve = async function (token, addr, spender, amount) {
        return new Promise(async (resolve, reject) => {
            var contract = new app.web3.eth.Contract(
                app.config.ctrs.token.abi,
                token
            )
            var gasPrice = await app.web3.eth.getGasPrice()
            var gas = await contract.methods
                .approve(spender, amount)
                .estimateGas({ from: addr })

            var receipt = await contract.methods
                .approve(spender, amount)
                .send({ from: addr, gas: gas, gasPrice: gasPrice })
                .once('transactionHash', (transactionHash) => {
                    app.account.log('approve transactionHash', transactionHash)
                })

            resolve({
                transactionHash: receipt.transactionHash,
                address: addr,
                spender: spender,
            })
            console.log('approve', addr, `confirmed approval to ${spender}`)
        })
    }

    ercManager.getApproval = async function (token, addr, spender) {
        return new Promise(async (resolve, reject) => {
            var contract = new app.web3.eth.Contract(
                app.config.ctrs.token.abi,
                token
            )
            var amount = await contract.methods.allowance(addr, spender).call()
            app.account.log('approval', addr, 'for', spender, amount.toString())
            resolve({ amount: amount.toString() })
        })
    }

    ercManager.getBalance = async function (token, addr) {
        return new Promise(async (resolve, reject) => {
            try {
                var contract = new app.web3.eth.Contract(
                    app.config.ctrs.token.abi,
                    token
                )
                var amount = await contract.methods.balanceOf(addr).call()
                resolve({ amount: amount.toString() })
            } catch (e) {
                resolve({ amount: '0' })
            }
        })
    }

    // ercManager.transfer = async function (token, to, amount, credentials) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             var contract = new app.web3.eth.Contract(
    //                 app.config.ctrs.token.abi,
    //                 token
    //             )
    //             var gasPrice = await app.web3.eth.getGasPrice()
    //             var gas = 60000 //await contract.methods.transfer(to,amount).estimateGas({from:credentials.address})

    //             var receipt = await contract.methods.transfer(to, amount).send({
    //                 from: credentials.address,
    //                 gas: gas,
    //                 gasPrice: gasPrice,
    //             })

    //             var tx = await app.web3.eth.getTransaction(
    //                 receipt.transactionHash
    //             )
    //             tx.txtype = token
    //             tx.apiversion = 2
    //             tx.date = Date.now()
    //             tx.networkid = app.config.blockChain
    //             tx.from = credentials.address
    //             tx.to = to.toLowerCase()
    //             tx.from_id = credentials.from_id
    //             tx.value = amount
    //             tx.gasPrice = gasPrice
    //             app.db.txs().insertOne(tx)

    //             resolve({
    //                 transactionHash: receipt.transactionHash,
    //                 address: credentials.address,
    //                 to: to,
    //                 amount,
    //             })
    //             console.log(
    //                 'erManager.transfer',
    //                 credentials.address,
    //                 `transfer confirmed transactionHash :${receipt.transactionHash} ${amount} to ${to}`
    //             )
    //         } catch (err) {
    //             reject(err)
    //         }
    //     })
    // }

    app.erc20 = ercManager
    return app
}
