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

describe('LOgin Management', () => {
    let usernameLogin = process.env.USERNAME_LOGIN
    let passwordLoging = process.env.PASSWORD_LOGIN

    let accessToken

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
            accessToken = result.result.token

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result.msg).to.equal('success')
            expect(result).to.have.property('result')

            expect(result.result).to.be.an('object')
        } catch (error) {
            console.log(error)
        }
    })

    it('GET logout connected user', async () => {
        try {
            let logout = await axios.get(`${baseUrl}/auth/logout`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = logout.data

            expect(result.code).to.equal(200)
            expect(result.status).to.equal(true)
            expect(result).to.have.property('result')
            expect(result.msg).to.equal('user logout')
        } catch (error) {
            //console.log(error);
        }
    })

    it('Get random captcha', async () => {
        try {
            let auth = await axios.get(`${baseUrl}/auth/captcha`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'content-type': 'application/json',
                },
            })

            let result = auth.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result.message).to.equal('success')
            expect(result).to.have.property('data')
        } catch (error) {
            // console.log(error)
            expect(error).to.be.null
        }
    })

    it('Verify captcha', async () => {
        let url = `${baseUrl}/auth/verifyCaptcha`

        let _id = '621c6d176'
        let position = 1

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
                    _id,
                    position,
                },
                options
            )
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
                return (
                    err === 'wrong captcha' ||
                    err === 'Please provide a valid id!'
                )
            })
        }
    })

    it('Purge account', async () => {
        let url = `${baseUrl}/auth/purge`

        let reason = 'sss'
        let password = 'sss'

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
                    reason,
                    password,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('account deleted')
            })
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'wrong password'
            })
        }
    })

    it('Change password', async () => {
        let url = `${baseUrl}/auth/changePassword`

        let newpass = 'sss'
        let oldpass = 'sss'

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
                    newpass,
                    oldpass,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('changed')
            })
        } catch (error) {
            // console.log(error.response)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'wrong password'
            })
        }
    })

    it('Get Code recover password', async () => {
        let url = `${baseUrl}/auth/passlost`

        let mail = 'sss'

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
                    mail,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('Email was sent')
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'please provide a valid email address!' ||
                    err === 'account not exists'
                )
            })
        }
    })

    it('Check if code is correct', async () => {
        let url = `${baseUrl}/auth/confirmCode`

        let code = 'sss'
        let email = 'sss'
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
                    code,
                    email,
                    type,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('code is matched')
            })
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'user not found' ||
                    err === 'wrong code' ||
                    err === 'code expired'
                )
            })
        }
    })

    it('Password recover', async () => {
        let url = `${baseUrl}/auth/passrecover`

        let code = 'sss'
        let email = 'sss'
        let newpass = 'sss'

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
                    email,
                    newpass,
                    code,
                },
                options
            )
            result = account.data
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('successfully')
            })
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'user not found' ||
                    err === 'wrong code' ||
                    err === 'code expired'
                )
            })
        }
    })

    it('Signup', async () => {
        let url = `${baseUrl}/auth/signup/mail`

        let username = 'test66@gmail.com'
        let password = 'sss'
        let newsLetter = 'true'

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
                    username,
                    password,
                    newsLetter,
                },
                options
            )
            result = account.data
            // expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('Email was sent')
            })
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error.message).to.satisfy((err) => {
                return err === 'account_already_used'
            })
        }
    })

    it('Resend confirmation code', async () => {
        let url = `${baseUrl}/auth/resend/confirmationToken`

        let email = 'youssef@atayen.us'

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
                    email,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('Email sent')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'user not found' || err === 'Missing credentials'
            })
        }
    })

    it('Save fire base access token', async () => {
        let url = `${baseUrl}/auth/save/firebaseAccessToken`

        let fb_accesstoken = 'sssss'

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
                    fb_accesstoken,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
        }
    })

    it('Update last step', async () => {
        let url = `${baseUrl}/auth/updateLastStep`

        let email = 'youssef@atayen.us'
        let completed = 'true'
        let firstName = ''
        let lastName = ''

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
                    completed,
                    email,
                    firstName,
                    lastName,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((msg) => {
                return (
                    msg === 'updated successfully' ||
                    msg === 'updated successfully with same email'
                )
            })
        } catch (error) {
            // console.log(error)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' || err === 'email already exists'
                )
            })
        }
    })

    it('Auth for apple', async () => {
        let url = `${baseUrl}/auth/apple`

        let id_apple = ''
        let mail = 'youssef@atayen.us'
        let idSN = ''
        let name = ''

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
                    id_apple,
                    mail,
                    idSN,
                    name,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('Email sent')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'account_exists_with_another_courrier'
                )
            })
        }
    })

    it('Register with social for apple ', async () => {
        let url = `${baseUrl}/auth/socialSignup`

        let name = ''
        let idSn = 'youssef@atayen.us'
        let id = ''
        let photo = ''
        let givenName = ''
        let familyName = ''

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
                    idSn,
                    id,
                    photo,
                    givenName,
                    familyName,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required' || err === 'account_exists'
            })
        }
    })

    it('Login with social for apple ', async () => {
        let url = `${baseUrl}/auth/socialSignin`

        let idSn = 'youssef@atayen.us'
        let id = ''

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
                    idSn,
                    id,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return (
                    err === 'token required' ||
                    err === 'account_doesnt_exist' ||
                    err === 'invalid idSn'
                )
            })
        }
    })

    it('Disconnect social account', async () => {
        let social = 'facebook'
        let url = `${baseUrl}/auth/disconnect/${social}`

        let email = 'youssef@atayen.us'
        let completed = 'true'
        let firstName = ''
        let lastName = ''

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
                    completed,
                    email,
                    firstName,
                    lastName,
                },
                options
            )
            result = account.data
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.satisfy((str) => {
                str.startsWith('deconnect successfully from')
            })
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

    it('setting two factor authentication for user ', async () => {
        let social = 'facebook'
        let url = `${baseUrl}/auth/qrCode`

        let email = 'youssef@atayen.us'
        let completed = 'true'
        let firstName = ''
        let lastName = ''

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
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('Verify 2fa ', async () => {
        let url = `${baseUrl}/auth/verifyQrCode`

        let code = ''

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
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })

    it('LogOut ', async () => {
        let url = `${baseUrl}/auth/logout`

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
            // console.log(result)
            expect(result.code).to.equal(200)
            expect(result).to.have.property('data')
            expect(result.message).to.equal('success')
        } catch (error) {
            // console.log(error.response.data)
            error = error.response.data
            expect(error.code).to.be.within(400, 404)
            expect(error).to.have.property('error')
            expect(error.error).to.satisfy((err) => {
                return err === 'token required'
            })
        }
    })
})
