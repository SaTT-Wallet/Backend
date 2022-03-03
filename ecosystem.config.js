module.exports = {
    apps: [
        {
            name: 'node-satt',
            script: './app.js',
            env: {
                NODE_ENV: 'local',
            },
            env_testnet: {
                NODE_ENV: 'testnet',
            },
            env_staging: {
                NODE_ENV: 'staging',
            },
            env_mainnet: {
                NODE_ENV: 'mainnet',
            },
        },
    ],
}
