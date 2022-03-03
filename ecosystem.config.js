const packagejson = require('./package.json')

module.exports = {
    apps: [
        {
            name: packagejson.name,
            script: './app.js',
            env: {
                NODE_ENV: 'local',
            },
            env_testnet: {
                NODE_ENV: 'testnet',
            },
            env_mainnet: {
                NODE_ENV: 'mainnet',
            },
        },
    ],
}
