module.exports = async function (app) {
    var child = require('child_process')

    const bitcoinCore = require('bitcoin-core')
    var bip32 = require('bip32')
    var bip38 = require('bip38')
    var bip39 = require('bip39')
    var bitcoinjs = require('bitcoinjs-lib')
    const ethUtil = require('ethereumjs-util')
    var speakeasy = require('speakeasy')
    var QRCode = require('qrcode')
    var Big = require('big.js')
    var Long = require('mongodb').Long
    var rp = require('request-promise')
    const bad_login_limit = app.config.bad_login_limit
    const { createLogger, format, transports } = require('winston')
    const { responseHandler } = require('../helpers/response-handler')

    const {
        Notification,
        Wallet,
        CustomToken,
        User,
        PassWallet,
        FbPage,
    } = require('../model/index')

    var accountManager = {}

    app.prices = false

    accountManager.createSeed = async function (req, res) {
        var UserId = req.user._id
        var pass = req.body.pass

        var escpass = pass.replace(/'/g, "\\'")

        const mnemonic = bip39.generateMnemonic(256)
        const seed = bip39.mnemonicToSeedSync(mnemonic, pass)
        const rootBtc = bip32.fromSeed(seed, app.config.networkSegWitCompat)
        const rootBtcBc1 = bip32.fromSeed(seed, app.config.networkSegWit)
        const rootEth = bip32.fromSeed(seed)
        const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat)
        const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit)
        const childEth = rootEth.derivePath(app.config.pathEth)

        const address = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({
                pubkey: childBtc.publicKey,
                network: app.config.networkSegWitCompat,
            }),
            network: app.config.networkSegWitCompat,
        }).address

        const addressbc1 = bitcoinjs.payments.p2wpkh({
            pubkey: childBtcBc1.publicKey,
            network: app.config.networkSegWit,
        }).address

        var addressBuffer = ethUtil.privateToAddress(childEth.privateKey)
        var checksumAddress = ethUtil.toChecksumAddress(
            '0x' + addressBuffer.toString('hex')
        )
        // var addressEth = ethUtil.addHexPrefix(checksumAddress);
        var privkey = ethUtil.addHexPrefix(childEth.privateKey.toString('hex'))
        var pubBtc = childBtc.publicKey.toString('hex')
        var account = app.web3.eth.accounts
            .privateKeyToAccount(privkey)
            .encrypt(pass)
        if (!app.config.testnet) {
            child.execSync(
                app.config.btcCmd +
                    ' importpubkey ' +
                    pubBtc +
                    " 'default' false"
            )

            const client = new bitcoinCore({
                host: app.config.btcHost,
                username: app.config.btcUser,
                password: app.config.btcPassword,
            })
            await new Client().importPubKey('default', false)
        }

        var ek = bip38.encrypt(childBtc.privateKey, true, escpass)
        var btcWallet = {
            publicKey: pubBtc,
            addressSegWitCompat: address,
            addressSegWit: addressbc1,
            publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
            ek: ek,
        }
        var count = await accountManager.getCount()

        Wallet.create({
            UserId: parseInt(UserId),
            keystore: account,
            num: count,
            btc: btcWallet,
            mnemo: mnemonic,
        })
        return {
            address: '0x' + account.address,
            btcAddress: btcWallet.addressSegWitCompat,
        }
    }

    accountManager.recover = async function (userId, wordlist, oldpass, pass) {
        return new Promise(async (resolve, reject) => {
            try {
                var account = await Wallets.find({
                    UserId: parseInt(userId),
                }).sort({ _id: 1 })

                account = account[0]
                app.web3.eth.accounts.wallet.decrypt(
                    [account.keystore],
                    oldpass
                )
            } catch (e) {
                reject({ error: 'Wrong password' })
                return
            } finally {
                app.web3.eth.accounts.wallet.remove(
                    '0x' + account.keystore.address
                )
            }

            var escpass = pass.replace(/'/g, "\\'")
            var mnemonic = wordlist.join(' ')

            const seed = await bip39.mnemonicToSeed(mnemonic, pass)
            const rootBtc = bip32.fromSeed(seed, app.config.networkSegWitCompat)
            const rootBtcBc1 = bip32.fromSeed(seed, app.config.networkSegWit)
            const rootEth = bip32.fromSeed(seed)
            const childBtc = rootBtc.derivePath(app.config.pathBtcSegwitCompat)
            const childBtcBc1 = rootBtcBc1.derivePath(app.config.pathBtcSegwit)
            const childEth = rootEth.derivePath(app.config.pathEth)

            const address = bitcoinjs.payments.p2sh({
                redeem: bitcoinjs.payments.p2wpkh({
                    pubkey: childBtc.publicKey,
                    network: app.config.networkSegWitCompat,
                }),
                network: app.config.networkSegWitCompat,
            }).address

            const addressbc1 = bitcoinjs.payments.p2wpkh({
                pubkey: childBtcBc1.publicKey,
                network: app.config.networkSegWit,
            }).address

            var addressBuffer = ethUtil.privateToAddress(childEth.privateKey)
            var checksumAddress = ethUtil.toChecksumAddress(
                addressBuffer.toString('hex')
            )
            var addressEth = ethUtil.addHexPrefix(checksumAddress)
            var privkey = ethUtil.addHexPrefix(
                childEth.privateKey.toString('hex')
            )
            var pubBtc = childBtc.publicKey.toString('hex')
            var account = app.web3.eth.accounts
                .privateKeyToAccount(privkey)
                .encrypt(pass)
            if (!app.config.testnet) {
                //child.execSync(app.config.btcCmd+" importpubkey "+pubBtc+" 'default' false");
                const client = new bitcoinCore({
                    host: app.config.btcHost,
                    username: app.config.btcUser,
                    password: app.config.btcPassword,
                })
                await new Client().importPubKey('default', false)
            }
            //await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});

            var ek = child
                .execSync(
                    app.config.bxCommand +
                        " ec-to-ek '" +
                        escpass +
                        "' " +
                        childBtc.privateKey.toString('hex'),
                    app.config.proc_opts
                )
                .toString()
                .replace('\n', '')
            var btcWallet = {
                publicKey: pubBtc,
                addressSegWitCompat: address,
                addressSegWit: addressbc1,
                publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
                ek: ek,
            }
            var count = await accountManager.getCount()

            var result = await Wallets.updateOne(
                { UserId: parseInt(userId) },
                {
                    $set: {
                        keystore: account,
                        num: count,
                        btc: btcWallet,
                        mnemo: mnemonic,
                    },
                }
            )
        })
    }

    accountManager.printSeed = async function (userId, pass) {
        return new Promise(async (resolve, reject) => {
            try {
                var account = await Wallets.find({
                    UserId: parseInt(userId),
                }).sort({ _id: 1 })
                account = account[0]

                app.web3.eth.accounts.wallet.decrypt([account.keystore], pass)

                if (account.mnemo && !account.btc.addressSegWitCompat) {
                    var escpass = pass.replace(/'/g, "\\'")
                    const seed = await bip39.mnemonicToSeed(account.mnemo, pass)
                    const rootBtc = bip32.fromSeed(
                        seed,
                        app.config.networkSegWitCompat
                    )
                    const rootBtcBc1 = bip32.fromSeed(
                        seed,
                        app.config.networkSegWit
                    )
                    const childBtc = rootBtc.derivePath(
                        app.config.pathBtcSegwitCompat
                    )
                    const childBtcBc1 = rootBtcBc1.derivePath(
                        app.config.pathBtcSegwit
                    )
                    const address = bitcoinjs.payments.p2sh({
                        redeem: bitcoinjs.payments.p2wpkh({
                            pubkey: childBtc.publicKey,
                            network: app.config.networkSegWitCompat,
                        }),
                        network: app.config.networkSegWitCompat,
                    }).address

                    const addressbc1 = bitcoinjs.payments.p2wpkh({
                        pubkey: childBtcBc1.publicKey,
                        network: app.config.networkSegWit,
                    }).address
                    var pubBtc = childBtc.publicKey.toString('hex')
                    //await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});
                    var ek = child
                        .execSync(
                            app.config.bxCommand +
                                " ec-to-ek '" +
                                escpass +
                                "' " +
                                childBtc.privateKey.toString('hex'),
                            app.config.proc_opts
                        )
                        .toString()
                        .replace('\n', '')
                    var btcWallet = {
                        publicKey: pubBtc,
                        addressSegWitCompat: address,
                        addressSegWit: addressbc1,
                        publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
                        ek: ek,
                    }

                    var result = await Wallets.updateOne(
                        { UserId: parseInt(userId) },
                        { $set: { btc: btcWallet } }
                    )
                }

                if (account.mnemo) resolve(account.mnemo.split(' '))
                else reject({ error: 'no seed' })
            } catch (e) {
                reject({ error: 'Wrong password' })
            } finally {
                app.web3.eth.accounts.wallet.remove(
                    '0x' + account.keystore.address
                )
            }
        })
    }

    accountManager.recoverBtc = async function (userId, pass) {
        return new Promise(async (resolve, reject) => {
            try {
                var account = await Wallets.find({
                    UserId: parseInt(userId),
                }).sort({ _id: 1 })
                account = account[0]

                app.web3.eth.accounts.wallet.decrypt([account.keystore], pass)
                var address = false

                if (account.mnemo && !account.btc.addressSegWitCompat) {
                    var escpass = pass.replace(/'/g, "\\'")
                    const seed = await bip39.mnemonicToSeed(account.mnemo, pass)
                    const rootBtc = bip32.fromSeed(
                        seed,
                        app.config.networkSegWitCompat
                    )
                    const rootBtcBc1 = bip32.fromSeed(
                        seed,
                        app.config.networkSegWit
                    )
                    const childBtc = rootBtc.derivePath(
                        app.config.pathBtcSegwitCompat
                    )
                    const childBtcBc1 = rootBtcBc1.derivePath(
                        app.config.pathBtcSegwit
                    )
                    address = bitcoinjs.payments.p2sh({
                        redeem: bitcoinjs.payments.p2wpkh({
                            pubkey: childBtc.publicKey,
                            network: app.config.networkSegWitCompat,
                        }),
                        network: app.config.networkSegWitCompat,
                    }).address

                    const addressbc1 = bitcoinjs.payments.p2wpkh({
                        pubkey: childBtcBc1.publicKey,
                        network: app.config.networkSegWit,
                    }).address
                    var pubBtc = childBtc.publicKey.toString('hex')
                    //await rp({uri:app.config.btcElectrumUrl+"pubkey/",method: 'POST',body:{pubkey:pubBtc},json: true});
                    var ek = child
                        .execSync(
                            app.config.bxCommand +
                                " ec-to-ek '" +
                                escpass +
                                "' " +
                                childBtc.privateKey.toString('hex'),
                            app.config.proc_opts
                        )
                        .toString()
                        .replace('\n', '')
                    var btcWallet = {
                        publicKey: pubBtc,
                        addressSegWitCompat: address,
                        addressSegWit: addressbc1,
                        publicKeySegWit: childBtcBc1.publicKey.toString('hex'),
                        ek: ek,
                    }

                    var result = await Wallets.updateOne(
                        { UserId: parseInt(userId) },
                        { $set: { btc: btcWallet } }
                    )
                }

                if (address) resolve(address)
                else reject({ error: 'no seed' })
            } catch (e) {
                reject({ error: 'Wrong password' })
            } finally {
                app.web3.eth.accounts.wallet.remove(
                    '0x' + account.keystore.address
                )
            }
        })
    }

    accountManager.unlock = async function (req, res) {
        try {
            let id = req.user._id
            let pass = req.body.pass

            let account = await Wallets.findOne({ UserId: parseInt(id) })

            app.web3.eth.accounts.wallet.decrypt([account.keystore], pass)
            app.web3Bep20.eth.accounts.wallet.decrypt([account.keystore], pass)

            return { address: '0x' + account.keystore.address }
        } catch (err) {
            console.log(err)
            return responseHandler.makeResponseError(
                res,
                500,
                err.message ? err.message : err.error
            )
        }
    }

    accountManager.unlockBSC = async function (req, res) {
        let UserId = req.user._id
        let pass = req.body.pass
        let account = await Wallets.findOne({ UserId })
        try {
            app.web3Bep20.eth.accounts.wallet.decrypt([account.keystore], pass)
            return { address: '0x' + account.keystore.address }
        } catch (e) {
            return responseHandler.makeResponseError(res, 401, 'Wrong password')
        }
    }

    accountManager.lock = function (addr) {
        app.web3.eth.accounts.wallet.remove(addr)
        app.web3Bep20.eth.accounts.wallet.remove(addr)
    }

    accountManager.lockBSC = function (addr) {
        app.web3Bep20.eth.accounts.wallet.remove(addr)
    }

    accountManager.getCount = async function () {
        return new Promise(async (resolve, reject) => {
            var count = await Wallet.countDocuments()
            resolve(count + 1)
        })
    }

    accountManager.genBtcWallet = async function (pass) {
        var escpass = pass.replace(/'/g, "\\'")

        var priv = child
            .execSync(
                app.config.bxCommand +
                    ' seed -b 256 | ' +
                    app.config.bxCommand +
                    ' ec-new ',
                app.config.proc_opts
            )
            .toString()
            .replace('\n', '')
        var wif = child
            .execSync(
                app.config.bxCommand + ' ec-to-wif ' + priv,
                app.config.proc_opts
            )
            .toString()
            .replace('\n', '')
        var ek = child
            .execSync(
                app.config.bxCommand + " ec-to-ek '" + escpass + "' " + priv,
                app.config.proc_opts
            )
            .toString()
            .replace('\n', '')
        var pub = child
            .execSync(
                app.config.bxCommand + ' ec-to-public ' + priv,
                app.config.proc_opts
            )
            .toString()
            .replace('\n', '')

        const keyPair = bitcoinjs.ECPair.fromWIF(wif)

        const address1 = bitcoinjs.payments.p2pkh({
            pubkey: keyPair.publicKey,
        }).address
        const addressbc1 = bitcoinjs.payments.p2wpkh({
            pubkey: keyPair.publicKey,
        }).address
        const address3 = bitcoinjs.payments.p2sh({
            redeem: bitcoinjs.payments.p2wpkh({ pubkey: keyPair.publicKey }),
        }).address

        if (!app.config.testnet) {
            child.execSync(
                app.config.btcCmd + ' importpubkey ' + pub + " 'default' false"
            )
        }

        return {
            publicKey: pub,
            address: address1,
            addressSegWit: addressbc1,
            addressSegWitCompat: address3,
            ek: ek,
        }
    }

    accountManager.hasAccount = async (req, res) => {
        let userId = req.user._id

        let account = await Wallets.findOne({ UserId: parseInt(userId) })

        return account && !account.unclaimed
    }

    accountManager.getAccount = async function (req, res) {
        let userId = req.user._id

        let account = await Wallet.findOne({ UserId: parseInt(userId) })

        if (account) {
            var address = '0x' + account.keystore.address

            var ether_balance = await app.web3.eth.getBalance(address)

            var bnb_balance = await app.web3Bep20.eth.getBalance(address)
            var satt_balance = await app.token.contract.methods
                .balanceOf(address)
                .call()

            var result = {
                address: '0x' + account.keystore.address,
                ether_balance: ether_balance,
                bnb_balance: bnb_balance,
                satt_balance: satt_balance ? satt_balance.toString() : 0,
                version: account.mnemo ? 2 : 1,
            }
            result.btc_balance = 0
            if (
                !app.config.testnet &&
                account.btc &&
                account.btc.addressSegWitCompat
            ) {
                result.btc = account.btc.addressSegWitCompat

                try {
                    var utxo = JSON.parse(
                        child.execSync(
                            app.config.btcCmd +
                                ' listunspent 1 1000000 \'["' +
                                account.btc.addressSegWitCompat +
                                '"]\''
                        )
                    )

                    if (!utxo.length) result.btc_balance = '0'
                    else {
                        var red = utxo.reduce(function (r, cur) {
                            r.amount += parseFloat(cur.amount)
                            return r
                        })
                        result.btc_balance = Math.floor(red.amount * 100000000)
                    }
                } catch (e) {
                    result.btc_balance = 0
                }
            }

            return result
        } else {
            return res.status(401).end('Account not found')
        }
    }

    accountManager.createBtcAccount = async function (userId, pass) {
        return new Promise(async (resolve, reject) => {
            var account = await Wallets.findOne({ UserId: parseInt(userId) })

            if (account && account.mnemo) {
                reject({ error: 'Wrong wallet type' })
                return
            }

            try {
                app.web3.eth.accounts.decrypt(account.keystore, pass)

                var btcWallet = await accountManager.genBtcWallet(pass)

                var result = await Wallets.updateOne(
                    { UserId: parseInt(userId) },
                    { $set: { btc: btcWallet } }
                )
                resolve({ result: 'OK' })
            } catch (e) {
                reject({ error: 'Wrong password' })
            }
        })
    }

    accountManager.changePass = async function (userId, oldPass, newPass) {
        return new Promise(async (resolve, reject) => {
            try {
                var account = await Wallets.findOne({
                    UserId: parseInt(userId),
                })
                var newAccount = app.web3.eth.accounts
                    .decrypt(account.keystore, oldPass)
                    .encrypt(newPass)
            } catch (e) {
                reject({ error: 'Wrong password' })
                return
            }
            var update = { keystore: newAccount }
            if (account.mnemo) {
                reject({ error: 'Wrong wallet type' })
                return
            }
            if (account.btc) {
                var escpassold = oldPass.replace(/'/g, "\\'")
                var escpass = newPass.replace(/'/g, "\\'")
                var ek = account.btc.ek
                var addr = account.btc.address
                var priv = child
                    .execSync(
                        app.config.bxCommand +
                            " ek-to-ec '" +
                            escpassold +
                            "' " +
                            ek,
                        app.config.proc_opts
                    )
                    .toString()
                    .replace('\n', '')
                var new_ek = child
                    .execSync(
                        app.config.bxCommand +
                            " ec-to-ek '" +
                            escpass +
                            "' " +
                            priv,
                        app.config.proc_opts
                    )
                    .toString()
                    .replace('\n', '')
                update['btc.ek'] = new_ek
            }

            var result = await Wallet.updateOne(
                { UserId: parseInt(userId) },
                { $set: update }
            )
            resolve({ changed: true })
        })
    }

    accountManager.exportkeyBtc = async function (req, res) {
        let id = req.user._id
        let pass = req.body.pass
        let account = await Wallet.findOne({ UserId: parseInt(id) })

        if (account) {
            try {
                app.web3.eth.accounts.wallet.decrypt([account.keystore], pass)
                return account.btc.ek
            } catch (e) {
                return responseHandler.makeResponseError(
                    res,
                    401,
                    'Wrong password'
                )
            } finally {
                app.web3.eth.accounts.wallet.remove(
                    '0x' + account.keystore.address
                )
            }
        } else {
            return responseHandler.makeResponseError(
                res,
                404,
                'Account not found'
            )
        }
    }

    accountManager.getAddrByUid = async function (userId) {
        return new Promise(async (resolve, reject) => {
            var count = await Wallet.count({ UserId: parseInt(userId) })
            if (count) {
                var account = await Wallet.findOne({ UserId: parseInt(userId) })
                resolve('0x' + account.keystore.address)
            } else {
                var pass = app.web3.utils.randomHex(6)
                var account = app.web3.eth.accounts.create().encrypt(pass)

                var count = await accountManager.getCount()
                var btcWallet = accountManager.genBtcWallet(pass)

                Wallet.create({
                    UserId: parseInt(userId),
                    keystore: account,
                    num: count,
                    unclaimed: true,
                    btc: btcWallet,
                })
                PassWallet.create({ UserId: parseInt(userId), value: pass })
                resolve('0x' + account.address)
            }
        })
    }

    accountManager.create2FA = async function (userId) {
        return new Promise(async (resolve, reject) => {
            try {
                var res = await Wallet.find({ UserId: parseInt(userId) })
                if (res[0].G2FA) {
                    reject({ message: '2FA already set' })
                }
                var secret = speakeasy.generateSecret({
                    length: 20,
                    name: 'satt.atayen.us',
                })
                await Wallet.updateOne(
                    { UserId: parseInt(userId) },
                    { $set: { G2FA: secret.base32 } }
                )

                QRCode.toDataURL(secret.otpauth_url, function (err, data_url) {
                    resolve(data_url)
                })
            } catch (e) {
                reject({ message: e.message })
            }
        })
    }

    accountManager.verify2FA = async function (userId, code) {
        return new Promise(async (resolve, reject) => {
            try {
                var res = await Wallet.find({ UserId: parseInt(userId) })
                if (!res[0].G2FA) {
                    reject({ message: '2FA not set' })
                }
                var verified = speakeasy.totp.verify({
                    secret: res.G2FA,
                    encoding: 'base32',
                    token: code,
                })
                resolve(verified)
            } catch (e) {
                reject({ message: e.message })
            }
        })
    }
    accountManager.getWalletBydIdUser = async function (userId) {
        return new Promise(async (resolve, reject) => {
            try {
                var res = await Wallet.findOne({ UserId: parseInt(userId) })
                var wallet = '0x' + res.keystore.address
                resolve(wallet)
            } catch (e) {
                reject({ message: e.message })
            }
        })
    }

    accountManager.getBalanceByUid = async (req, res) => {
        try {
            var userId = req.user._id
            let crypto = app.account.getPrices()
            var [Total_balance, CryptoPrices] = [0, crypto]
            var token_info = Object.assign({}, app.config.Tokens)
            delete token_info['SATT']
            delete token_info['BNB']

            let ret = await accountManager.getAccount(req, res)
            delete ret.btc
            delete ret.version

            let userTokens = await CustomToken.find({
                sn_users: { $in: [userId] },
            })

            if (userTokens.length) {
                for (let i = 0; i < userTokens.length; i++) {
                    let symbol = userTokens[i].symbol
                    if (token_info[symbol])
                        symbol = `${symbol}_${userTokens[i].network}`
                    token_info[symbol] = {
                        dicimal: Number(userTokens[i].decimal),
                        symbol: userTokens[i].symbol,
                        network: userTokens[i].network,
                        contract: userTokens[i].tokenAdress,
                        name: userTokens[i].tokenName,
                        picUrl: userTokens[i].picUrl,
                        addedToken: true,
                    }
                }
            }

            for (const T_name in token_info) {
                var network = token_info[T_name].network
                let networkToken = network == 'ERC20' ? app.erc20 : app.bep20
                let balance = await networkToken.getBalance(
                    token_info[T_name].contract,
                    ret.address
                )
                let key = T_name.split('_')[0]
                if (
                    token_info[T_name].contract ==
                        token_info['SATT_BEP20'].contract ||
                    token_info[T_name].contract == token_info['WSATT'].contract
                ) {
                    key = 'SATT'
                }
                if (CryptoPrices.hasOwnProperty(key))
                    Total_balance +=
                        app.token.filterAmount(
                            new Big(balance['amount'] * 1)
                                .div(
                                    (
                                        10 ** +token_info[T_name].dicimal
                                    ).toString()
                                )
                                .toNumber() + ''
                        ) * CryptoPrices[key].price
            }

            delete ret.address
            for (const Amount in ret) {
                let tokenSymbol = Amount.split('_')[0].toUpperCase()
                tokenSymbol = tokenSymbol === 'ETHER' ? 'ETH' : tokenSymbol
                let decimal = tokenSymbol === 'BTC' ? 8 : 18
                Total_balance +=
                    app.token.filterAmount(
                        new Big(ret[Amount] * 1)
                            .div(new Big(10).pow(decimal))
                            .toNumber() + ''
                    ) * CryptoPrices[tokenSymbol].price
            }

            Total_balance = Total_balance.toFixed(2)

            return { Total_balance }
        } catch (err) {
            console.log(err)
            //    return responseHandler.makeResponseError(
            // 		 res,
            // 		 500,
            // 		 err.message ? err.message : err.error
            // 		 )
        }
    }

    accountManager.notificationManager = async (id, NotifType, label) => {
        let notification = {
            idNode: '0' + id,
            type: NotifType,
            status: 'done',
            label,
            isSeen: false,
            isSend: false,
            attachedEls: {
                id: id,
            },
            created: new Date(),
        }

        await Notification.create(notification)

        let user = await User.findOne({ _id: +id }).select(
            'fireBaseAccessToken '
        )

        if (user.fireBaseAccessToken) {
            let data = {
                message: {
                    token: user.fireBaseAccessToken,
                    data: {
                        obj: JSON.stringify(notification),
                    },
                },
            }
            await app.notification.sendNotification(data)
        }
    }

    accountManager.isBlocked = async (user, auth = false) => {
        let dateNow = Math.floor(Date.now() / 1000)
        var res = false
        let logBlock = {}
        if (auth) {
            if (user.account_locked) {
                if (
                    accountManager.differenceBetweenDates(
                        user.date_locked,
                        dateNow
                    ) < app.config.lockedPeriod
                ) {
                    logBlock.date_locked = dateNow
                    logBlock.failed_count = 0
                    res = true
                } else {
                    logBlock.failed_count = 0
                    logBlock.account_locked = false
                    res = false
                }
            }
        } else {
            let failed_count = user.failed_count ? user.failed_count + 1 : 1
            logBlock.failed_count = failed_count
            if (failed_count == 1) logBlock.dateFirstAttempt = dateNow
            if (user.account_locked) {
                logBlock.date_locked = dateNow
                logBlock.failed_count = 0
                res = true
            } else if (
                !user.account_locked &&
                failed_count >= bad_login_limit &&
                accountManager.differenceBetweenDates(
                    user.dateFirstAttempt,
                    dateNow
                ) < app.config.failInterval
            ) {
                logBlock.account_locked = true
                logBlock.failed_count = 0
                logBlock.date_locked = dateNow
                res = true
            } else if (failed_count >= bad_login_limit)
                logBlock.failed_count = 1
        }
        if (Object.keys(logBlock).length)
            await User.updateOne({ _id: user._id }, { $set: logBlock })

        return { res, blockedDate: dateNow, auth }
    }

    accountManager.differenceBetweenDates = (authDate, dateNow) => {
        return Math.ceil(Math.abs(dateNow * 1000 - authDate * 1000) / 60000)
    }

    accountManager.manageTime = () => {
        var d = new Date()
        var date = d.getDate()
        var month = d.getMonth() + 1
        var year = d.getFullYear()
        var seconds = d.getSeconds()
        var minutes = d.getMinutes()
        var hour = d.getHours()
        return (
            year +
            '-' +
            month +
            '-' +
            ' ' +
            hour +
            ':' +
            minutes +
            ':' +
            seconds
        )
    }

    accountManager.getFacebookPages = (
        UserId,
        accessToken,
        isInsta = false
    ) => {
        return new Promise(async (resolve, reject) => {
            try {
                let message = 'account_linked_with_success'
                var instagram_id = false
                var accountsUrl =
                    'https://graph.facebook.com/' +
                    app.config.fbGraphVersion +
                    '/me/accounts?fields=instagram_business_account,access_token,username,name,picture,fan_count&access_token=' +
                    accessToken

                var res = await rp({ uri: accountsUrl, json: true })

                while (true) {
                    for (var i = 0; i < res.data.length; i++) {
                        let page = {
                            UserId: UserId,
                            username: res.data[i].username,
                            token: res.data[i].access_token,
                            picture: res.data[i].picture.data.url,
                            name: res.data[i].name,
                            subscribers: res.data[i].fan_count,
                        }

                        if (res.data[i].instagram_business_account) {
                            if (!isInsta) {
                                message += '_instagram_facebook'
                                isInsta = true
                            }
                            instagram_id =
                                res.data[i].instagram_business_account.id
                            page.instagram_id = instagram_id
                            var media =
                                'https://graph.facebook.com/' +
                                app.config.fbGraphVersion +
                                '/' +
                                instagram_id +
                                '?fields=username&access_token=' +
                                accessToken
                            var resMedia = await rp({ uri: media, json: true })
                            page.instagram_username = resMedia.username
                        }
                        await FbPage.updateOne(
                            { id: res.data[i].id, UserId },
                            { $set: page },
                            { upsert: true }
                        )
                    }
                    if (!res.paging || !res.paging.next) {
                        break
                    }
                    res = await rp({ uri: res.paging.next, json: true })
                }

                if (!isInsta && res.data.length > 0) message += '_facebook'
                resolve(message)
            } catch (e) {
                reject({ message: e.message })
            }
        })
    }
    accountManager.updateAndGenerateCode = async (_id, type) => {
        try {
            const code = Math.floor(100000 + Math.random() * 900000)
            let secureCode = {}
            ;(secureCode.code = code),
                (secureCode.expiring = Date.now() + 3600 * 20 * 5),
                (secureCode.type = type)
            await User.updateOne({ _id }, { $set: { secureCode } })
            return code
        } catch (e) {
            reject({ message: e.message })
        }
    }

    // accountManager.getPrices = () => {
    //     if (
    //         app.prices.status &&
    //         Date.now() - new Date(app.prices.status.timestamp).getTime() <
    //             1200000
    //     ) {
    //         return app.prices.data
    //     } else {
    //         var r = child.execSync(
    //             'curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=200&convert=USD&CMC_PRO_API_KEY=' +
    //                 app.config.cmcApiKey +
    //                 '"'
    //         )
    //         var response = JSON.parse(r)
    //         var r2 = child.execSync(
    //             'curl "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=SATT%2CJET&convert=USD&CMC_PRO_API_KEY=' +
    //                 app.config.cmcApiKey +
    //                 '"'
    //         )
    //         var responseSattJet = JSON.parse(r2)
    //         response.data.push(responseSattJet.data.SATT)
    //         response.data.push(responseSattJet.data.JET)

    //         var priceMap = response.data.map((elem) => {
    //             var obj = {}
    //             obj = {
    //                 symbol: elem.symbol,
    //                 name: elem.name,
    //                 price: elem.quote.USD.price,
    //                 percent_change_24h: elem.quote.USD.percent_change_24h,
    //                 market_cap: elem.quote.USD.market_cap,
    //                 volume_24h: elem.quote.USD.volume_24h,
    //                 circulating_supply: elem.circulating_supply,
    //                 total_supply: elem.total_supply,
    //                 max_supply: elem.max_supply,
    //                 logo:
    //                     'https://s2.coinmarketcap.com/static/img/coins/128x128/' +
    //                     elem.id +
    //                     '.png',
    //             }
    //             return obj
    //         })
    //         var finalMap = {}
    //         for (var i = 0; i < priceMap.length; i++) {
    //             finalMap[priceMap[i].symbol] = priceMap[i]
    //             delete finalMap[priceMap[i].symbol].symbol
    //         }

    //         for (var i = 0; i < app.config.token200.length; i++) {
    //             var token = app.config.token200[i]
    //             if (finalMap[token.symbol]) {
    //                 finalMap[token.symbol].network = token.platform.network
    //                 finalMap[token.symbol].tokenAddress =
    //                     token.platform.token_address
    //                 finalMap[token.symbol].decimals = token.platform.decimals
    //             }
    //         }
    //     }
    //     response.data = finalMap
    //     app.prices = response

    //     return finalMap
    // }

    app.account = accountManager
    return app
}

//push test
