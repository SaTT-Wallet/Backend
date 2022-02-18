module.exports = async function (app) {
    var cron = require('node-cron')
    var fs = require('fs')

    var campaignKeystore = fs.readFileSync(
        app.config.campaignWalletPath,
        'utf8'
    )
    app.campaignWallet = JSON.parse(campaignKeystore)

    var BN = require('bn.js')

    var eventWatcher = {}

    // eventWatcher.campaignCreated = async function (error, evt) {
    //     var ev = {
    //         id: evt.returnValues.id,
    //         type: 'modified',
    //         date: Math.floor(Date.now() / 1000),
    //         txhash: evt.transactionHash,
    //         contract: evt.address.toLowerCase(),
    //     }

    //     Event.create(ev)
    // }

    eventWatcher.campaignFundsSpent = function (error, evt) {
        var idCampaign = evt.returnValues.id

        var evt = {
            id: idCampaign,
            type: 'spent',
            date: Math.floor(Date.now() / 1000),
            txhash: evt.transactionHash,
            contract: evt.address.toLowerCase(),
        }

        app.db.event().insertOne(evt)
    }
    /*
	eventWatcher.campaignApplied = function (error, evt){

		var idCampaign = evt.returnValues.id;
		var idProm = evt.returnValues.prom;

		var evt = {
			id : idCampaign,
			prom : idProm,
			type : "applied",
			date :Math.floor(Date.now()/1000),
			txhash:evt.transactionHash,
			contract:evt.address.toLowerCase(),
			owner:evt.address.toLowerCase()
		}

		app.db.event().insertOne(evt);

	}
*/

    app.campaign.contract.events.CampaignCreated(
        /*{fromBlock:9467559},*/ eventWatcher.campaignCreated
    )
    app.campaign.contract.events.CampaignFundsSpent(
        /*{fromBlock:0},*/ eventWatcher.campaignFundsSpent
    )
    //	app.campaign.contract.events.CampaignApplied ( /*{fromBlock:0},*/eventWatcher.campaignApplied);

    app.campaign.contractBep20WS.events.allEvents(async function (err, evt) {
        // if (evt.event == 'CampaignCreated') {
        //     await eventWatcher.campaignCreated(err, evt)
        // }

        if (evt.event == 'CampaignFundsSpent') {
            await eventWatcher.campaignFundsSpent(err, evt)
        }
        /*	if(evt.event == "CampaignApplied") {
				await eventWatcher.campaignApplied(err,evt)
			}
*/
    })

    eventWatcher.paySattHourly = async function () {
        var gasPrice = await app.web3.eth.getGasPrice()
        var bngasPrice = new BN('' + gasPrice)
        var bngasPlus = new BN(10000000000)
        var cred = {
            address: app.config.SattReserve,
            gasPrice: bngasPrice.add(bngasPlus),
        }
        var buys = await app.db.sattbuy().find({ new: true }).toArray()
        console.log('cron pay satt start', buys.length, 'elements')
        await app.cryptoManager.unlockReserve()
        for (var i = 0; i < buys.length; i++) {
            var buy = buys[i]
            await app.token.transfer(buy.to, buy.amount, cred)

            await app.db
                .sattbuy()
                .updateOne({ _id: buy._id }, { $set: { new: false } })
        }
        console.log('cron pay satt end')
    }

    eventWatcher.paySattHourlyByInf = async function () {
        var gasPrice = await app.web3.eth.getGasPrice()
        var bngasPrice = new BN('' + gasPrice)
        var bngasPlus = new BN(10000000000)

        var buys = await app.db.sattbuy().find({ new: true }).toArray()
        console.log('cron pay satt start', buys.length, 'elements')
        //await app.cryptoManager.unlockReserve();
        for (var i = 0; i < buys.length; i++) {
            var buy = buys[i]
            var data = await app.token.contract.methods
                .transfer(buy.to, buy.amount)
                .encodeABI()
            var tx = {
                from: app.config.SattReserve,
                to: app.config.tokenContract,
                value: 0,
                gas: 60000,
                gasPrice: bngasPrice.add(bngasPlus).toString(),
                data: data,
            }
            console.log('satt payment to', buy.to)
            var pv = app.web3.eth.accounts.decrypt(
                app.config.sattReserveKs34,
                app.config.SattReservePass
            )
            var signed = await app.web3Inf.eth.accounts.signTransaction(
                tx,
                pv.privateKey
            )
            var receipt = await app.web3Inf.eth.sendSignedTransaction(
                signed.rawTransaction
            )
            console.log(
                receipt.transactionHash,
                'confirmed transfer from',
                app.config.SattReserve,
                'to',
                buy.to,
                'amount',
                buy.amount
            )

            await app.db
                .sattbuy()
                .updateOne({ _id: buy._id }, { $set: { new: false } })
        }
        console.log('cron pay satt end')
    }

    app.events = eventWatcher
    return app
}
