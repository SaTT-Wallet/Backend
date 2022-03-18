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

describe('Campaign Management', () => {
    let usernameLogin = process.env.USERNAME_LOGIN
    let passwordLoging = process.env.PASSWORD_LOGIN

    let accessToken

    it('Should login successfully', async () => {
        let url = `${baseUrl}/auth/signin/mail`

        let options = {
            headers: {
                'content-type': 'application/json',
            },
            rejectUnauthorized: false,
        }
        let result
        try {
            let obj = await axios.post(
                url,
                {
                    username: usernameLogin,
                    password: passwordLoging,
                },
                options
            )
            result = obj.data
            accessToken = result.data.access_token

            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
            expect(result.data).to.be.an('object')
        } catch (error) {
            // console.log('error', error)
        }
    })

    it('Get campaign kits', async () => {
        let result
        let id = '61f169ec724cc395ed336770'

        try {
            let account = await axios.get(`${baseUrl}/campaign/${id}/kits`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            result = account.data

            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Add kits', async () => {
        let result
        let campaign = 'updated campaign'
        let link = 'string'
        let file = ''

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/addKits`,
                { campaign, link, file },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('Kit uploaded')
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Update campaign', async () => {
        let result
        let id = '61f169ec724cc395ed336770'
        let campaign = {
            title: 'string',
            resume: 'string',
            brand: 'string',
            description: 'string',
            reference: 'string',
            cover: 'string',
            coverSrc: 'string',
            logo: 'string',
            countries: [
                {
                    item_id: 0,
                    item_text: 'string',
                },
            ],
            token: {
                name: 'string',
                type: 'string',
                addr: 'string',
            },
            tags: ['string'],
            endDate: 0,
            startDate: 0,
            remuneration: 'string',
            cost: 'string',
            cost_usd: 'string',
            ratios: [
                'string',
                'string',
                'string',
                0,
                'string',
                'string',
                'string',
                0,
                'string',
                'string',
                'string',
                0,
                'string',
                'string',
                'string',
                0,
                'string',
                'string',
                'string',
                0,
            ],
            bounties: ['string', 'string', 0, 'string'],
        }

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.put(
                `${baseUrl}/campaign/update/${id}`,
                { campaign },
                options
            )

            result = account.data
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('updated')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Campaign not found'
            })
        }
    })

    it('Bep20 Approval', async () => {
        let result
        let tokenAddress = '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156'
        let campaignAddress = '61f169ec724cc395ed336770'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/bep20/approval`,
                { tokenAddress, campaignAddress },
                options
            )

            result = account.data
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'wallet not found'
            })
        }
    })

    it('Bep20 Allow', async () => {
        let result
        let tokenAddress = '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156'
        let campaignAddress = '61f169ec724cc395ed336770'
        let amount = ''
        let pass = ''

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/bep20/allow`,
                { tokenAddress, campaignAddress, amount, pass },
                options
            )

            result = account.data
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            error = error.response.data
            // console.log('errrr', error)
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Wrong password' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Erc20 Approval', async () => {
        let result
        let tokenAddress = '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156'
        let campaignAddress = '0xa5F46d6F4F3b318EeFF1B37e39491e52233c5975'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/erc20/approval`,
                { tokenAddress, campaignAddress },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'wallet not found' ||
                    err === 'invalid token'
                )
            })
        }
    })

    it('Erc20 Allow', async () => {
        let result
        let tokenAddress = '0x448BEE2d93Be708b54eE6353A7CC35C4933F1156'
        let campaignAddress = '61f169ec724cc395ed336770'
        let amount = ''
        let pass = ''

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/erc20/allow`,
                { tokenAddress, campaignAddress, amount, pass },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'wallet not found' ||
                    err == 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Launch new performance compaign', async () => {
        let result
        let tokenAddress = 'test idProm'
        let contract = 'test link'
        let idCampaign = '61f406058eccba86089d26aa'
        let dataUrl = 'test dataUrl'
        let amount = 'test amount'
        let pass = ''
        let startDate = 'test startDate'
        let endDate = 'test endDate'
        let ratios = ['test bounties']

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/launch/performance`,
                {
                    tokenAddress,
                    contract,
                    idCampaign,
                    dataUrl,
                    amount,
                    pass,
                    startDate,
                    endDate,
                    ratios,
                },
                options
            )

            result = account.data
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                str.startsWith('success')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Launch campaign', async () => {
        let result
        let tokenAddress = 'test idProm'
        let contract = 'test link'
        let idCampaign = '620e082b711cb119aebaf5a9'
        let dataUrl = 'test dataUrl'
        let amount = 'test amount'
        let pass = ''
        let startDate = 'test startDate'
        let endDate = 'test endDate'
        let bounties = ['test bounties']

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/launchBounty`,
                {
                    tokenAddress,
                    contract,
                    idCampaign,
                    dataUrl,
                    amount,
                    pass,
                    startDate,
                    endDate,
                    bounties,
                },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                str.startsWith('success')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Get campaign pending link', async () => {
        let result
        let id = '61f169ec724cc395ed336770'

        try {
            let account = await axios.get(
                `${baseUrl}/campaign/campaignPrompAll/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            result = account.data
            // console.log(account.data)

            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Apply your link', async () => {
        let result
        let pass = ''
        let idCampaign = '620e082b711cb119aebaf5a9'
        let typeSN = 'test idProm'
        let idPost = 'test link'
        let title = 'test email'
        let idUser = 'test idUser'
        let hash = 'test hash'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/apply`,
                { pass, idCampaign, typeSN, idPost, idUser, title, hash },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                str.startsWith('success')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Link already sent' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Increase budget', async () => {
        let result
        let campaign = {
            amount: '50',
            tokenAddress: '0x6fAc729f346A46fC0093126f237b4A520c40eb89',
            hash: '61f169ec724cc395ed336770',
            pass: 'Haythem12@',
        }

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/funding`,
                campaign,
                option
            )

            result = account.data

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Get loggedIn user links', async () => {
        let result
        let wallet_id = '0x7b1251ac88dc25f7a9405471dccd066d8df607ea'

        try {
            let account = await axios.get(
                `${baseUrl}/campaign/filterLinks/${wallet_id}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            result = account.data
            // console.log(account.data)

            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Get campaign details', async () => {
        let result
        let id = '620e082b711cb119aebaf5a9'
        try {
            let account = await axios.get(`${baseUrl}/campaign/details/${id}`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Campaign not found'
            })
        }
    })

    it('Get campaign list', async () => {
        let result
        let idWallet = '0x71dfcee7ab5d4cd66b010a36c70527cac3727561'
        try {
            let account = await axios.get(
                `${baseUrl}/campaign/campaigns?idWallet=${idWallet}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            result = account.data
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Get notification link', async () => {
        let result
        let campaign = {
            idCampaign: '61f169ec724cc395ed336770',
            idProm: '123456',
            link: 'https://www.youtube.com/watch?v=ZhDNtEe0kGM',
        }

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/linkNotification`,
                campaign,
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('Email was sent')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Get link stats', async () => {
        let result
        let id =
            '0x20055c4e5029f7cdea0380524e23920e819258bf7b1d3c067dfb67cf6f25b2f1'

        try {
            let account = await axios.get(
                `${baseUrl}/campaign/prom/stats/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            result = account.data

            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err == 'link not found'
            })
        }
    })

    it('validate participation', async () => {
        let result
        let campaign = {
            pass: 'Haythem12@',
            idCampaign: '61b1e29be560f6509c2961b7',
            idProm: '0xfc84a8bbfbb9db244912be8483e787acdf4f4791bf9933fcb15917ade4995eb8',
            link: 'https://scontent-cdt1-1.cdninstagram.com/v/t51.29350-15/',
            email: 'haythem@atayen.us',
            idUser: '2',
        }

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/validate`,
                campaign,
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                str.startsWith('success')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'unothorized' ||
                    err === 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })

    it('Create new campaign as draft', async () => {
        let result
        let campaign = {
            title: 'string',
            resume: 'string',
            brand: 'string',
            description: 'string',
            reference: 'string',
            countries: [{ item_id: 0, item_text: 'string' }],
            token: { name: 'string', type: 'string', addr: 'string' },
            tags: ['string'],
            endDate: 0,
            startDate: 0,
            remuneration: 'string',
            cost: 'string',
            cost_usd: 'string',
            ratios: [
                {
                    like: 'string',
                    view: 'string',
                    share: 'string',
                    reachLimit: 'string',
                    oracle: 'string',
                },
            ],
            bounties: [
                {
                    oracle: 'string',
                    categorie: [
                        { minFollowers: 0, maxFollowers: 0, reward: 'string' },
                    ],
                },
            ],
        }

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/save`,
                campaign,
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Reject link', async () => {
        let result
        let idLink =
            '0xfc84a8bbfbb9db244912be8483e787acdf4f4791bf9933fcb15917ade4995eb8'
        let campaign = {
            idCampaign: '61b1e29be560f6509c2961b7',
            title: 'string',
            email: 'haythem@atayen.us',
            link: 'https://scontent-cdt1-1.cdninstagram.com/v/t51.29350-15',
            reason: 'string',
            lang: 'en',
            idUser: '2',
        }

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.put(
                `${baseUrl}/campaign/reject/${idLink}`,
                campaign,
                option
            )

            result = account.data

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'unothorized'
            })
        }
    })

    // it('Get Gains', async () => {
    //     let result
    //     let campaign = {
    //         pass: 'Haythem12@',
    //         idProm: '0xd691a632995eaceab4d8b9f6308ca8ecd232da1a68b9a481242ccdc5bbd2027d',
    //         hash: '0xb2f57b9d234312f4805370bf882d523ed8fcf9c4fc700640317ba30adcf1b7b0',
    //     }

    //     let options = {
    //         headers: {
    //             Authorization: `Bearer ${accessToken ? accessToken : ''}`,
    //             'content-type': 'application/json',
    //         },
    //     }
    //     try {
    //         let account = await axios.post(
    //             `${baseUrl}/campaign/gains`,
    //             campaign,
    //             options
    //         )

    //         result = account.data
    //         // console.log(account.data)
    //         result = account.data
    //         expect(result.code).to.equal(200)
    //         expect(result.message).to.equal('success')
    //         expect(result).to.have.property('data')
    //     } catch (error) {
    //         // console.log(error)
    //         error = error.response.data
    //         expect(error.code).to.be.within(400, 500)
    //         expect(error).to.have.property('error')
    //         expect(error.error).to.satisfy((err) => {
    //             return (
    //                 err === 'token required' ||
    //                 err === 'Key derivation failed - possibly wrong password'
    //             )
    //         })
    //     }
    // })

    it('get remaining funds in a campaign', async () => {
        let result
        let campaign = {
            hash: '0xb2f57b9d234312f4805370bf882d523ed8fcf9c4fc700640317ba30adcf1b7b0',
            pass: 'Haythem12@',
        }

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/remaining`,
                campaign,
                option
            )

            result = account.data

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('Token added')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 500)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err == 'Key derivation failed - possibly wrong password'
                )
            })
        }
    })
})
