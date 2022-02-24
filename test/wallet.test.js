const chai = require('chai')
const expect = chai.expect
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const axios = require('axios')
chai.use(chaiAsPromised)
chai.use(sinonChai)
require('dotenv').config()

let port = process.env.LISTEN_PORT

const baseUrl = `https://localhost:${port}`

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0

describe('Wallet Management', () => {
    let usernameLogin = process.env.USERNAME_LOGIN
    let passwordLoging = process.env.PASSWORD_LOGIN

    let accessToken, mywalletAdrr

    it('Should login successfully yess!', async () => {
        let url = `${baseUrl}/auth/signin/mail`

        let options = {
            headers: {
                'content-type': 'application/json',
            },
        }

        try {
            let obj = await axios.post(
                url,
                {
                    username: usernameLogin,
                    password: passwordLoging,
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('GET my wallet', async () => {
        try {
            let wallet = await axios.get(`${baseUrl}/wallet/mywallet`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = wallet.data

            mywalletAdrr = wallet.data.address

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('GET user balance', async () => {
        try {
            let balances = await axios.get(`${baseUrl}/wallet/userBalance`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = balances.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('BEP20 gas price', async () => {
        try {
            let bep20Price = await axios.get(
                `${baseUrl}/wallet/Bep20GasPrice`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'content-type': 'application/json',
                    },
                }
            )

            let result = bep20Price.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('Crypto Details', async () => {
        try {
            let details = await axios.get(`${baseUrl}/wallet/cryptoDetails`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = details.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('ERC20 gas price', async () => {
        try {
            let erc20Price = await axios.get(
                `${baseUrl}/wallet/Erc20GasPrice`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'content-type': 'application/json',
                    },
                }
            )

            let result = erc20Price.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('Total Balnace', async () => {
        try {
            let balance = await axios.get(`${baseUrl}/wallet/totalBalnace`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = balance.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('Prices', async () => {
        try {
            let prices = await axios.get(`${baseUrl}/wallet/prices`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = prices.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('get mnemo', async () => {
        try {
            let mnemo = await axios.get(`${baseUrl}/wallet/getMnemo`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = mnemo.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })
    mywalletAdrr

    it('Transaction history', async () => {
        try {
            let transaction = await axios.get(
                `${baseUrl}/wallet/transaction_history/${mywalletAdrr}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'content-type': 'application/json',
                    },
                }
            )

            let result = transaction.data

            // console.log(result)

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('success')
        } catch (error) {
            //console.log(error);
        }
    })

    it('TransferErc20', async () => {
        let url = `${baseUrl}/wallet/transferErc20`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    token: '0xDf49C9f599A0A9049D97CFF34D0C30E468987389',
                    to: '0x13bf3d184152732c6faf60c38c1dff770d3f987e',
                    amount: '500000',
                    pass: 'Haythem12@',
                    symbole: 'SATT',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('TransferBep20', async () => {
        let url = `${baseUrl}/wallet/transferBep20`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    token: '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156',
                    to: '0x13bf3d184152732c6faf60c38c1dff770d3f987e',
                    amount: '500000',
                    pass: 'Haythem12@',
                    symbole: 'SATT',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('Check wallet', async () => {
        let url = `${baseUrl}/wallet/checkWalletToken`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    tokenAdress: '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156',
                    network: 'ERC20',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('Add new token', async () => {
        let url = `${baseUrl}/wallet/addNewToken`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    tokenName: 'Smart Advertising Transaction Token',
                    tokenAdress: ' 0xdf49c9f599a0a9049d97cff34d0c30e468987389',
                    symbol: 'SATT',
                    network: 'erc20',
                    decimal: 18,
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('TransferBTC', async () => {
        let url = `${baseUrl}/wallet/transferBtc`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    pass: 'Haythem12@',
                    to: '0x13bf3d184152732c6faf60c38c1dff770d3f987e',
                    val: '500',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('TransferBNB', async () => {
        let url = `${baseUrl}/wallet/transferBNB`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    pass: 'Haythem12@',
                    to: '0x13bf3d184152732c6faf60c38c1dff770d3f9812s',
                    val: '500',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('TransferEther', async () => {
        let url = `${baseUrl}/wallet/transferEther`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
        }
        try {
            let obj = await axios.post(
                url,
                {
                    pass: 'Haythem12@',
                    to: '0x13bf3d184152732c6faf60c38c1dff770d3f9813s',
                    val: '500',
                },
                options
            )
            let result = obj.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')

            accessToken = result.result.token

            // console.log(accessToken)
        } catch (error) {}
    })

    it('Get quote', async () => {
        let url = `${baseUrl}/wallet/getQuote`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let digital_currency = ''
        let fiat_currency = ''
        let requested_amount = ''
        let requested_currency = ''

        try {
            let account = await axios.post(
                url,
                {
                    digital_currency,
                    fiat_currency,
                    requested_amount,
                    requested_currency,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Please enter amount of 50 USD or more' ||
                    err === 'Wallet not found'
                )
            })
        }
    })

    it('Payment request in simplix', async () => {
        let url = `${baseUrl}/wallet/payementRequest`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let currency = ''
        let quote_id = ''
        let idWallet = ''

        try {
            let account = await axios.post(
                url,
                {
                    currency,
                    quote_id,
                    idWallet,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Wallet not found'
            })
        }
    })

    it('Export BTC', async () => {
        let url = `${baseUrl}/wallet/exportBtc`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let pass = ''

        try {
            let account = await axios.post(
                url,
                {
                    pass,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Wallet not found'
            })
        }
    })

    it('Export ETH', async () => {
        let url = `${baseUrl}/wallet/exportETH`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let pass = ''

        try {
            let account = await axios.post(
                url,
                {
                    pass,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Account not found'
            })
        }
    })

    it('Verify Mnemo', async () => {
        let url = `${baseUrl}/wallet/verifyMnemo`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let mnemo = ''

        try {
            let account = await axios.post(
                url,
                {
                    mnemo,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Wallet not found'
            })
        }
    })

    it('Create wallet', async () => {
        let url = `${baseUrl}/wallet/create`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result
        let mnemo = ''

        try {
            let account = await axios.post(
                url,
                {
                    mnemo,
                },
                options
            )
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' || err === 'Wallet already exist'
                )
            })
        }
    })

    it('Remove added token', async () => {
        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let tokenAddress = '621355c854f2292f9959cedc'
        let url = `${baseUrl}/wallet/removeToken/${tokenAddress}`
        let result

        try {
            let account = await axios.delete(url, options)
            result = account.data
            // console.log(result);
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('token removed')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Token not found' ||
                    err === 'Wallet not found'
                )
            })
        }
    })
})
