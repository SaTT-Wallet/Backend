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
            // accessToken = result.data.access_token

            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
            expect(result.data).to.be.an('object')
        } catch (error) {
            console.log('---------error', error)
        }
    })

    it('Get campaign list', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/campaign/campaigns`, {
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
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
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
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Campaign not found'
            })
        }
    })

    it('Update campaign', async () => {
        let result
        let id = '61f169ec724cc395ed336770'
        let title = 'updated title'
        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.put(
                `${baseUrl}/campaign/update/:${id}`,
                { title },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('updated')
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
                `${baseUrl}/campaign/bep20/approval
                `,
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
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'wallet not found'
            })
        }
    })

    it('Get campaign pending link', async () => {
        let result
        let id = '61f404058eccba86089d26aa'

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
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Get Gains', async () => {
        let result
        let pass = 'test'
        let resume = 'test resume'
        let brand = 'test brand'
        let description = 'test des'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/gains`,
                { pass, resume, brand, description },
                options
            )

            result = account.data
            // console.log(account.data)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Create new campaign as draft', async () => {
        let result
        let pass = 'test'
        let idProm = 'test idProm'
        let hash = 'test hash'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/save
                `,
                { pass, idProm, hash },
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
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
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
            // console.log(account.data)

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
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
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
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Increase budget', async () => {
        let result
        let hash = ''
        let token = ''
        let amount = ''

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/funding`,
                {
                    hash,
                    token,
                    amount,
                },
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
            expect(error.code).to.be.within(400, 404)
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
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('get remaining funds in a campaign', async () => {
        let result
        let hash = ''
        let pass = ''

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.post(
                `${baseUrl}/campaign/remaining`,
                {
                    hash,
                    pass,
                },
                option
            )

            result = account.data

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('Token added')
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

    it('Reject link', async () => {
        let result
        let idLink =
            '0x20055c4e5029f7cdea0380524e23920e819258bf7b1d3c067dfb67cf6f25b2f1'
        let idCampaign = 'string'
        let title = 'string'
        let email = 'string'
        let link = 'string'
        let idUser = 'string'

        let option = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }
        try {
            let account = await axios.put(
                `${baseUrl}/campaign/reject/${idLink}`,
                {
                    idCampaign,
                    title,
                    email,
                    link,
                    idUser,
                },
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
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'unothorized'
            })
        }
    })
})
