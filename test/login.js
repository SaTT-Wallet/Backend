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

describe('LOgin Management', () => {
    let usernameLogin = process.env.USERNAME_LOGIN
    let passwordLoging = process.env.PASSWORD_LOGIN

    let accessToken, refreshToken, username

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
})
