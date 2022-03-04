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

describe('Profile Management', () => {
    let usernameLogin = process.env.USERNAME_LOGIN
    let passwordLoging = process.env.PASSWORD_LOGIN

    let accessToken = undefined

    it('Should login successfully', async () => {
        let url = `${baseUrl}/auth/signin/mail`

        let options = {
            headers: {
                'content-type': 'application/json',
            },
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
            // console.log('---------error', error)
            expect(error).to.be.null
        }
    })

    it('Get account details', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/account`, {
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
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Get user picture', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/picture`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
            result = account
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'No file exists' || err === 'token required'
            })
        }
    })

    it('Save user picture', async () => {
        try {
            let url = `${baseUrl}/profile/picture`

            let options = {
                headers: {
                    'content-type': 'application/json',
                },
                rejectUnauthorized: false,
            }
            let result
            let account = await axios.post(url, options)
            result = account.data

            expect(result.code).to.equal(201)
            expect(result.message).to.equal('Saved')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'Only images allowed' || err === 'token required'
            })
        }
    })

    it('Update profile', async () => {
        let url = `${baseUrl}/profile/UpdateProfile`
        let city = 'manouba'
        let country = 'tunisie'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.put(
                url,
                {
                    city,
                    country,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('profile updated')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'email already exists' ||
                    err === 'update failed' ||
                    err === 'token required'
                )
            })
        }
    })

    it('Get user legal', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/UserLegal`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
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
                return err === 'token required'
            })
        }
    })

    it('Get user Interests', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/UserIntersts`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'No interest found' || err === 'token required'
            })
        }
    })

    it('Add user interests', async () => {
        let url = `${baseUrl}/profile/AddUserIntersts`
        let interests = ['test2', 'test3']

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    interests,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Update user interests', async () => {
        let url = `${baseUrl}/profile/UpdateUserIntersts`
        let interests = ['test2', 'test3']

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.put(
                url,
                {
                    interests,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('remove google channels', async () => {
        let url = `${baseUrl}/profile/RemoveGoogleChannels`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.delete(url, options)
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'No channel found'
            })
        }
    })

    it('remove facebook channels', async () => {
        let url = `${baseUrl}/profile/RemoveFacebookChannels`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.delete(url, options)
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'No channel found'
            })
        }
    })

    it('remove linkedIn channels', async () => {
        let url = `${baseUrl}/profile/RemoveLinkedInChannels`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.delete(url, options)
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'No channel found'
            })
        }
    })

    it('Get social accounts', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/socialAccounts`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'No channel found' || err === 'token required'
            })
        }
    })

    it('Update user onboarding status', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/onBoarding`, {
                headers: {
                    Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(201)
            expect(result.message).to.equal('onBoarding updated')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'No channel found' || err === 'token required'
            })
        }
    })

    it('Request crypto from a satt user', async () => {
        let url = `${baseUrl}/profile/receiveMoney`

        let to = 'sss'
        let price = 'sss'
        let currency = 'sss'
        let name = 'sss'
        let wallet = 'sss'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    to,
                    price,
                    currency,
                    name,
                    wallet,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('Email was sent')
            })
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'user not found'
            })
        }
    })

    it('add user legal', async () => {
        let url = `${baseUrl}/profile/add/Legalprofile`

        let type = 'sss'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    type,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(201)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('legal saved')
            })
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'Only images allowed'
            })
        }
    })

    it('Get user legal file', async () => {
        let result
        let userLegal = '620b6e7c1f54a82fd4ca5cfb'
        try {
            let account = await axios.get(
                `${baseUrl}/profile/legalUserUpload/${userLegal}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'No file exists' || err === 'token required'
            })
        }
    })

    it('Update notification status if its seen or not by user', async () => {
        let result
        let id = '61f7eab4fc0a8605852bd808'
        try {
            let account = await axios.post(
                `${baseUrl}/profile/notification/seen/:${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${
                            accessToken ? accessToken : ''
                        }`,
                        'content-type': 'application/json',
                    },
                }
            )

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                str.startsWith('notification seen')
            })
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'update failed' ||
                    err === 'token required' ||
                    err === 'id field is missing'
                )
            })
        }
    })

    it('Update notifications status of the user that are seen', async () => {
        let result
        try {
            let account = await axios.get(
                `${baseUrl}/profile/notification/issend/clicked`,
                {
                    headers: {
                        Authorization: `Bearer `,
                        'content-type': 'application/json',
                    },
                }
            )

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('Notification clicked')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'No notifications found' || err === 'token required'
                )
            })
        }
    })

    it('retrieve all user notifications', async () => {
        let result
        try {
            let account = await axios.get(`${baseUrl}/profile/notifications`, {
                headers: {
                    Authorization: `Bearer `,
                    'content-type': 'application/json',
                },
            })

            // console.log( account)
            result = account.data
            expect(result.code).to.equal(200)
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('success')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'No notifications found' || err === 'token required'
                )
            })
        }
    })

    it('user request to change his email', async () => {
        let url = `${baseUrl}/profile/changeEmail`

        let pass = process.env.PASSWORD_LOGIN
        let email = 'youssef.beenamor@gmail.com'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    pass,
                    email,
                },
                options
            )
            result = account.data

            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('Email was sent')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'wrong password' ||
                    err === 'duplicated email'
                )
            })
        }
    })

    it('send email to satt contact', async () => {
        let url = `${baseUrl}/profile/SattSupport`

        let name = 'youssef'
        let email = 'youssef.beenamor@gmail.'
        let subject = 'Test'
        let message = 'message test'

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    name,
                    email,
                    subject,
                    message,
                },
                options
            )
            result = account.data

            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('Email was sent')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'please provide a valid email address!'
            })
        }
    })

    it('confirm change email', async () => {
        let url = `${baseUrl}/profile/confirmChangeEmail`

        let code = 0

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.post(
                url,
                {
                    code,
                },
                options
            )
            result = account.data

            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('email changed')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'code expired' ||
                    err === 'code incorrect'
                )
            })
        }
    })

    it('Link confirmation to change email ', async () => {
        let typeSN = 1
        let idUser = '0'
        let idPost = 'kgfn'

        let url = `${baseUrl}/profile/link/verify/:${typeSN}/:${idUser}/:${idPost}`

        let options = {
            headers: {
                Authorization: `Bearer ${accessToken ? accessToken : ''}`,
                'content-type': 'application/json',
            },
        }

        let result

        try {
            let account = await axios.get(url, options)
            result = account.data

            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                return str.startsWith('success')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 406)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'please provide all fields' ||
                    err === 'account not linked' ||
                    err === 'invalid link' ||
                    err === 'account deactivated'
                )
            })
        }
    })
})
