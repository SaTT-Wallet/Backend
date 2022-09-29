const { bep20Connexion } = require('../blockchainConnexion')

let Erc20NetworkConstant = 'ERC20'
let Bep20NetworkConstant = 'BEP20'
let PolygonNetworkConstant = 'POLYGON'
let BttNetworkConstant = 'BTTC'
let TronNetworkConstant = 'TRON'

const CryptoSymbols = {
    SATTBEP20: 'SATTBEP20',
    SATT: 'SATT',
    ETH: 'ETH',
}

let Constants = {
    token: { abi: [], satt: '', tether: '', dai: '', wbtt: '' },
    wbtt: { abi: [] },
    campaign: {
        abi: [],
        address: { campaignErc20: '', campaignBep20: '', campaignPolygon: '' },
    },
    oracle: { abi: [], address: { oracleErc20: '', oracleBep20: '' } },
    wSaTT: { abi: [], address: { token: '' } },
    priceGap: { abi: [], address: { token: '' } },
    bep20: { abi: [], address: { sattBep20: '', busd: '', bnb: '' } },
}
let PolygonConstants = {
    oracle: { abi: [], address: '' },
    token: { abi: [], satt: '' },
    campaign: { abi: [], address: '' },
}

let TronConstant = {
    token: { abi: [], satt: '', wtrx: '', wtrxAbi: [] },
    campaign: { abi: [], address: '' },
    oracle: { abi: [], address: '' },
}
let BttConstants = {
    token: { abi: [], satt: '' },
    oracle: { abi: [], address: '' },
    campaign: { abi: [], address: '' },
}

let CampaignConstants = []
let OracleConstants = []

BttConstants.token.abi = [
    {
        inputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: 'true',
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    {
        constant: true,
        inputs: [
            { internalType: 'address', name: 'owner', type: 'address' },
            { internalType: 'address', name: 'spender', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'burn',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
            },
        ],
        name: 'decreaseAllowance',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'getOwner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'spender', type: 'address' },
            { internalType: 'uint256', name: 'addedValue', type: 'uint256' },
        ],
        name: 'increaseAllowance',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ internalType: 'uint256', name: 'amount', type: 'uint256' }],
        name: 'mint',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [{ internalType: 'address', name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'recipient', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'sender', type: 'address' },
            { internalType: 'address', name: 'recipient', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { internalType: 'address', name: 'newOwner', type: 'address' },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
TronConstant.oracle.abi = [
    {
        constant: false,
        inputs: [],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'a', type: 'address' },
            { name: 'allow', type: 'bool' },
        ],
        name: 'changeAsk',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ name: 'u', type: 'address' }],
        name: 'oracleFee',
        outputs: [{ name: 'f', type: 'uint256' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'campaignContract', type: 'address' },
            { name: 'idRequest', type: 'bytes32' },
            { name: 'likes', type: 'uint64' },
            { name: 'shares', type: 'uint64' },
            { name: 'views', type: 'uint64' },
        ],
        name: 'answer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'campaignContract', type: 'address' },
            { name: 'idRequest', type: 'bytes32' },
            { name: 'likes', type: 'uint64' },
            { name: 'shares', type: 'uint64' },
            { name: 'views', type: 'uint64' },
        ],
        name: 'thirdPartyAnswer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'campaignContract', type: 'address' },
            { name: 'idProm', type: 'bytes32' },
            { name: 'nbAbos', type: 'uint256' },
        ],
        name: 'answerBounty',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'a', type: 'address' },
            { name: 'allow', type: 'bool' },
            { name: 'token', type: 'address' },
            { name: 'fee', type: 'uint256' },
        ],
        name: 'changeAnswer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'typeSN', type: 'uint8' },
            { name: 'idPost', type: 'string' },
            { name: 'idUser', type: 'string' },
            { name: 'idRequest', type: 'bytes32' },
        ],
        name: 'ask',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'typeSN', type: 'uint8' },
            { name: 'idPost', type: 'string' },
            { name: 'idUser', type: 'string' },
            { name: 'idProm', type: 'bytes32' },
        ],
        name: 'askBounty',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ name: 'newOwner', type: 'address' }],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { payable: true, stateMutability: 'payable', type: 'fallback' },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'idRequest', type: 'bytes32' },
            { indexed: false, name: 'typeSN', type: 'uint8' },
            { indexed: false, name: 'idPost', type: 'string' },
            { indexed: false, name: 'idUser', type: 'string' },
        ],
        name: 'AskRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'idRequest', type: 'bytes32' },
            { indexed: false, name: 'likes', type: 'uint64' },
            { indexed: false, name: 'shares', type: 'uint64' },
            { indexed: false, name: 'views', type: 'uint64' },
        ],
        name: 'AnswerRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: false, name: 'typeSN', type: 'uint8' },
            { indexed: false, name: 'idPost', type: 'string' },
            { indexed: false, name: 'idUser', type: 'string' },
            { indexed: false, name: 'idProm', type: 'bytes32' },
        ],
        name: 'AskRequestBounty',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'idProm', type: 'bytes32' },
            { indexed: false, name: 'nbAbos', type: 'uint256' },
        ],
        name: 'AnswerRequestBounty',
        type: 'event',
    },
]
TronConstant.token.wtrxAbi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'guy',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'dst',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'dst',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Withdrawal',
        type: 'event',
    },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'address', name: '', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'guy', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'dst', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'src', type: 'address' },
            { internalType: 'address', name: 'dst', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'wad', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
TronConstant.token.abi = [
    { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokens',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    { stateMutability: 'payable', type: 'fallback' },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'address', name: '', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_spender', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            { internalType: 'address payable', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'bytes', name: '_data', type: 'bytes' },
        ],
        name: 'tokenFallback',
        outputs: [],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
TronConstant.campaign.abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'prom',
                type: 'bytes32',
            },
        ],
        name: 'CampaignApplied',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'startDate',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'endDate',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'dataUrl',
                type: 'string',
            },
        ],
        name: 'CampaignCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'CampaignFunded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
        ],
        name: 'CampaignFundsSpent',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
        ],
        name: 'PromAccepted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'PromPayed',
        type: 'event',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
        ],
        name: 'applyCampaign',
        outputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
        ],
        name: 'ask',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
        ],
        name: 'askBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'campaigns',
        outputs: [
            { internalType: 'address', name: 'advertiser', type: 'address' },
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint64', name: 'nbProms', type: 'uint64' },
            { internalType: 'uint64', name: 'nbValidProms', type: 'uint64' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint256[]', name: 'ratios', type: 'uint256[]' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'createPriceFundAll',
        outputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint256[]', name: 'bounties', type: 'uint256[]' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'createPriceFundBounty',
        outputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'fundCampaign',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getBounties',
        outputs: [
            { internalType: 'uint256[]', name: 'bounty', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'bool', name: 'wrapped', type: 'bool' },
        ],
        name: 'getGains',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
        ],
        name: 'getIsUsed',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getProms',
        outputs: [
            { internalType: 'bytes32[]', name: 'cproms', type: 'bytes32[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getRatios',
        outputs: [
            { internalType: 'uint8[]', name: 'types', type: 'uint8[]' },
            {
                internalType: 'uint256[]',
                name: 'likeRatios',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'shareRatios',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'viewRatios',
                type: 'uint256[]',
            },
            { internalType: 'uint256[]', name: 'limits', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getRemainingFunds',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'getResults',
        outputs: [
            { internalType: 'bytes32[]', name: 'creq', type: 'bytes32[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'isAlreadyUsed',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'bool', name: 'accepted', type: 'bool' },
        ],
        name: 'modToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            { internalType: 'address payable', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'proms',
        outputs: [
            { internalType: 'address', name: 'influencer', type: 'address' },
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'bool', name: 'isAccepted', type: 'bool' },
            { internalType: 'bool', name: 'isPayed', type: 'bool' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'uint64', name: 'nbResults', type: 'uint64' },
            { internalType: 'bytes32', name: 'prevResult', type: 'bytes32' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'results',
        outputs: [
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'a', type: 'address' }],
        name: 'setOracle',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'bytes32', name: '_data', type: 'bytes32' },
        ],
        name: 'tokenFallback',
        outputs: [{ internalType: 'bytes32', name: 'hash', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        name: 'update',
        outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'updateBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'uint256', name: 'nbAbos', type: 'uint256' },
        ],
        name: 'updateBounty',
        outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'updateCampaignStats',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'updatePromStats',
        outputs: [
            { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'validateProm',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32[]', name: 'idProms', type: 'bytes32[]' },
        ],
        name: 'validateProms',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
Constants.token.abi = [
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_spender', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ name: 'success', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: '_from', type: 'address' },
            { name: '_to', type: 'address' },
            { name: '_value', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ name: 'success', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [{ name: '', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [{ name: '', type: 'address' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [{ name: '', type: 'string' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ name: 'success', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'data', type: 'bytes' },
        ],
        name: 'transfer',
        outputs: [{ name: 'success', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            { name: '_from', type: 'address' },
            { name: '_value', type: 'uint256' },
            { name: '_data', type: 'bytes' },
        ],
        name: 'tokenFallback',
        outputs: [],
        payable: false,
        stateMutability: 'pure',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            { name: '', type: 'address' },
            { name: '', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ name: '', type: 'uint256' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [{ name: 'newOwner', type: 'address' }],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            { name: 'token', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
    },
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: 'from', type: 'address' },
            { indexed: true, name: 'to', type: 'address' },
            { indexed: false, name: 'value', type: 'uint256' },
        ],
        name: 'Transfer',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'tokenOwner',
                type: 'address',
            },
            { indexed: true, name: 'spender', type: 'address' },
            { indexed: false, name: 'tokens', type: 'uint256' },
        ],
        name: 'Approval',
        type: 'event',
    },
]
Constants.campaign.abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'prom',
                type: 'bytes32',
            },
        ],
        name: 'CampaignApplied',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'startDate',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'endDate',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'dataUrl',
                type: 'string',
            },
        ],
        name: 'CampaignCreated',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'CampaignFunded',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
        ],
        name: 'CampaignFundsSpent',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
        ],
        name: 'PromAccepted',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'id',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'PromPayed',
        type: 'event',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
        ],
        name: 'applyCampaign',
        outputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
        ],
        name: 'ask',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
        ],
        name: 'askBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'campaigns',
        outputs: [
            { internalType: 'address', name: 'advertiser', type: 'address' },
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint64', name: 'nbProms', type: 'uint64' },
            { internalType: 'uint64', name: 'nbValidProms', type: 'uint64' },
            {
                components: [
                    { internalType: 'address', name: 'token', type: 'address' },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct campaign.Fund',
                name: 'funds',
                type: 'tuple',
            },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint256[]', name: 'ratios', type: 'uint256[]' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'createPriceFundAll',
        outputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'string', name: 'dataUrl', type: 'string' },
            { internalType: 'uint64', name: 'startDate', type: 'uint64' },
            { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            { internalType: 'uint256[]', name: 'bounties', type: 'uint256[]' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'createPriceFundBounty',
        outputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'fundCampaign',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getBounties',
        outputs: [
            { internalType: 'uint256[]', name: 'bounty', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'getGains',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
        ],
        name: 'getIsUsed',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getProms',
        outputs: [
            { internalType: 'bytes32[]', name: 'cproms', type: 'bytes32[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getRatios',
        outputs: [
            { internalType: 'uint8[]', name: 'types', type: 'uint8[]' },
            {
                internalType: 'uint256[]',
                name: 'likeRatios',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'shareRatios',
                type: 'uint256[]',
            },
            {
                internalType: 'uint256[]',
                name: 'viewRatios',
                type: 'uint256[]',
            },
            { internalType: 'uint256[]', name: 'limits', type: 'uint256[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'getRemainingFunds',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'getResults',
        outputs: [
            { internalType: 'bytes32[]', name: 'creq', type: 'bytes32[]' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'isAlreadyUsed',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'bool', name: 'accepted', type: 'bool' },
        ],
        name: 'modToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            { internalType: 'address payable', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'proms',
        outputs: [
            { internalType: 'address', name: 'influencer', type: 'address' },
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
            { internalType: 'bool', name: 'isAccepted', type: 'bool' },
            { internalType: 'bool', name: 'isPayed', type: 'bool' },
            {
                components: [
                    { internalType: 'address', name: 'token', type: 'address' },
                    {
                        internalType: 'uint256',
                        name: 'amount',
                        type: 'uint256',
                    },
                ],
                internalType: 'struct campaign.Fund',
                name: 'funds',
                type: 'tuple',
            },
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'uint64', name: 'nbResults', type: 'uint64' },
            { internalType: 'bytes32', name: 'prevResult', type: 'bytes32' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
        name: 'results',
        outputs: [
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address payable', name: '_to', type: 'address' },
            { internalType: 'uint256', name: 'amount', type: 'uint256' },
        ],
        name: 'sendViaCall',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: 'a', type: 'address' }],
        name: 'setOracle',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'bytes32', name: '_data', type: 'bytes32' },
        ],
        name: 'tokenFallback',
        outputs: [{ internalType: 'bytes32', name: 'hash', type: 'bytes32' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        name: 'update',
        outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'updateBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'uint256', name: 'nbAbos', type: 'uint256' },
        ],
        name: 'updateBounty',
        outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32', name: 'idCampaign', type: 'bytes32' },
        ],
        name: 'updateCampaignStats',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'updatePromStats',
        outputs: [
            { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
        ],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'bytes32', name: 'idProm', type: 'bytes32' }],
        name: 'validateProm',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'bytes32[]', name: 'idProms', type: 'bytes32[]' },
        ],
        name: 'validateProms',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
Constants.oracle.abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'likes',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'shares',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'views',
                type: 'uint64',
            },
        ],
        name: 'AnswerRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'nbAbos',
                type: 'uint256',
            },
        ],
        name: 'AnswerRequestBounty',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
        ],
        name: 'AskRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
        ],
        name: 'AskRequestBounty',
        type: 'event',
    },
    {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                internalType: 'uint64',
                name: 'likes',
                type: 'uint64',
            },
            {
                internalType: 'uint64',
                name: 'shares',
                type: 'uint64',
            },
            {
                internalType: 'uint64',
                name: 'views',
                type: 'uint64',
            },
        ],
        name: 'answer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
            {
                internalType: 'uint256',
                name: 'nbAbos',
                type: 'uint256',
            },
        ],
        name: 'answerBounty',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
            {
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
        ],
        name: 'ask',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
            {
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
        ],
        name: 'askBounty',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
            {
                internalType: 'bool',
                name: 'allow',
                type: 'bool',
            },
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'fee',
                type: 'uint256',
            },
        ],
        name: 'changeAnswer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
            {
                internalType: 'bool',
                name: 'allow',
                type: 'bool',
            },
        ],
        name: 'changeAsk',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address payable',
                name: '',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            {
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                internalType: 'uint64',
                name: 'likes',
                type: 'uint64',
            },
            {
                internalType: 'uint64',
                name: 'shares',
                type: 'uint64',
            },
            {
                internalType: 'uint64',
                name: 'views',
                type: 'uint64',
            },
        ],
        name: 'thirdPartyAnswer',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'val',
                type: 'uint256',
            },
        ],
        name: 'transferToken',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
Constants.wSaTT.abi = [
    {
        inputs: [
            {
                internalType: 'contract IERC223',
                name: '_SATT_addr',
                type: 'address',
            },
            {
                internalType: 'contract WSATT',
                name: '_WSATT_addr',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'contributeWSATT',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: '_from',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_value',
                type: 'uint256',
            },
            {
                internalType: 'bytes32',
                name: '_data',
                type: 'bytes32',
            },
        ],
        name: 'tokenFallback',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
]

Constants.wbtt.abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'guy',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'dst',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Deposit',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'dst',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'src',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'wad',
                type: 'uint256',
            },
        ],
        name: 'Withdrawal',
        type: 'event',
    },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'address', name: '', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'guy', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'deposit',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'dst', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'src', type: 'address' },
            { internalType: 'address', name: 'dst', type: 'address' },
            { internalType: 'uint256', name: 'wad', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'uint256', name: 'wad', type: 'uint256' }],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
Constants.priceGap.abi = [
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'b',
                type: 'uint256',
            },
            {
                internalType: 'uint8',
                name: 'v',
                type: 'uint8',
            },
            {
                internalType: 'bytes32',
                name: 'r',
                type: 'bytes32',
            },
            {
                internalType: 'bytes32',
                name: 's',
                type: 'bytes32',
            },
        ],
        name: 'getGap',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
        ],
        name: 'setSatt',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
        ],
        name: 'setSigner',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'token',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'val',
                type: 'uint256',
            },
        ],
        name: 'transferToken',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
    },
    {
        constant: false,
        inputs: [],
        name: 'withdraw',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address payable',
                name: '',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'b',
                type: 'uint256',
            },
            {
                internalType: 'uint8',
                name: 'v',
                type: 'uint8',
            },
            {
                internalType: 'bytes32',
                name: 'r',
                type: 'bytes32',
            },
            {
                internalType: 'bytes32',
                name: 's',
                type: 'bytes32',
            },
        ],
        name: 'test',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: 'a',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'b',
                type: 'uint256',
            },
            {
                internalType: 'uint8',
                name: 'v',
                type: 'uint8',
            },
            {
                internalType: 'bytes32',
                name: 'r',
                type: 'bytes32',
            },
            {
                internalType: 'bytes32',
                name: 's',
                type: 'bytes32',
            },
        ],
        name: 'testhash',
        outputs: [
            {
                internalType: 'bytes32',
                name: '',
                type: 'bytes32',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: '_from',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: '_value',
                type: 'uint256',
            },
            {
                internalType: 'bytes',
                name: '_data',
                type: 'bytes',
            },
        ],
        name: 'tokenFallback',
        outputs: [
            {
                internalType: 'bytes32',
                name: 'hash',
                type: 'bytes32',
            },
        ],
        payable: false,
        stateMutability: 'pure',
        type: 'function',
    },
]
Constants.bep20.abi = [
    {
        inputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'constructor',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'previousOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: 'owner',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
        ],
        name: 'allowance',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                internalType: 'address',
                name: 'account',
                type: 'address',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'burn',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'subtractedValue',
                type: 'uint256',
            },
        ],
        name: 'decreaseAllowance',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'getOwner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'addedValue',
                type: 'uint256',
            },
        ],
        name: 'increaseAllowance',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'mint',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [
            {
                internalType: 'address',
                name: '',
                type: 'address',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                internalType: 'string',
                name: '',
                type: 'string',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [
            {
                internalType: 'uint256',
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'sender',
                type: 'address',
            },
            {
                internalType: 'address',
                name: 'recipient',
                type: 'address',
            },
            {
                internalType: 'uint256',
                name: 'amount',
                type: 'uint256',
            },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                internalType: 'address',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
]
PolygonConstants.oracle.abi = [
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'likes',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'shares',
                type: 'uint64',
            },
            {
                indexed: false,
                internalType: 'uint64',
                name: 'views',
                type: 'uint64',
            },
        ],
        name: 'AnswerRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'nbAbos',
                type: 'uint256',
            },
        ],
        name: 'AnswerRequestBounty',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'bytes32',
                name: 'idRequest',
                type: 'bytes32',
            },
            {
                indexed: false,
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
        ],
        name: 'AskRequest',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: 'uint8',
                name: 'typeSN',
                type: 'uint8',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idPost',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'string',
                name: 'idUser',
                type: 'string',
            },
            {
                indexed: false,
                internalType: 'bytes32',
                name: 'idProm',
                type: 'bytes32',
            },
        ],
        name: 'AskRequestBounty',
        type: 'event',
    },
    { stateMutability: 'payable', type: 'fallback' },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        name: 'answer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            { internalType: 'uint256', name: 'nbAbos', type: 'uint256' },
        ],
        name: 'answerBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
        ],
        name: 'ask',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
            { internalType: 'string', name: 'idPost', type: 'string' },
            { internalType: 'string', name: 'idUser', type: 'string' },
            { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
        ],
        name: 'askBounty',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'a', type: 'address' },
            { internalType: 'bool', name: 'allow', type: 'bool' },
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'uint256', name: 'fee', type: 'uint256' },
        ],
        name: 'changeAnswer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'a', type: 'address' },
            { internalType: 'bool', name: 'allow', type: 'bool' },
        ],
        name: 'changeAsk',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'oracleFee',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            { internalType: 'address payable', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address',
                name: 'campaignContract',
                type: 'address',
            },
            { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
            { internalType: 'uint64', name: 'likes', type: 'uint64' },
            { internalType: 'uint64', name: 'shares', type: 'uint64' },
            { internalType: 'uint64', name: 'views', type: 'uint64' },
        ],
        name: 'thirdPartyAnswer',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
PolygonConstants.token.abi = [
    { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'tokenOwner',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'spender',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'tokens',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: 'address',
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                internalType: 'address',
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                internalType: 'uint256',
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
    { stateMutability: 'payable', type: 'fallback' },
    {
        inputs: [
            { internalType: 'address', name: '', type: 'address' },
            { internalType: 'address', name: '', type: 'address' },
        ],
        name: 'allowance',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_spender', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
        ],
        name: 'approve',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ internalType: 'address', name: '', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'decimals',
        outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'name',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'owner',
        outputs: [
            { internalType: 'address payable', name: '', type: 'address' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'symbol',
        outputs: [{ internalType: 'string', name: '', type: 'string' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
            { internalType: 'bytes', name: '_data', type: 'bytes' },
        ],
        name: 'tokenFallback',
        outputs: [],
        stateMutability: 'pure',
        type: 'function',
    },
    {
        inputs: [],
        name: 'totalSupply',
        outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'value', type: 'uint256' },
            { internalType: 'bytes', name: 'data', type: 'bytes' },
        ],
        name: 'transfer',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: '_from', type: 'address' },
            { internalType: 'address', name: '_to', type: 'address' },
            { internalType: 'uint256', name: '_value', type: 'uint256' },
        ],
        name: 'transferFrom',
        outputs: [{ internalType: 'bool', name: 'success', type: 'bool' }],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            {
                internalType: 'address payable',
                name: 'newOwner',
                type: 'address',
            },
        ],
        name: 'transferOwnership',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [
            { internalType: 'address', name: 'token', type: 'address' },
            { internalType: 'address', name: 'to', type: 'address' },
            { internalType: 'uint256', name: 'val', type: 'uint256' },
        ],
        name: 'transferToken',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'withdraw',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    { stateMutability: 'payable', type: 'receive' },
]
PolygonConstants.campaign.abi = [
    [
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'id',
                    type: 'bytes32',
                },
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'prom',
                    type: 'bytes32',
                },
            ],
            name: 'CampaignApplied',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'id',
                    type: 'bytes32',
                },
                {
                    indexed: false,
                    internalType: 'uint64',
                    name: 'startDate',
                    type: 'uint64',
                },
                {
                    indexed: false,
                    internalType: 'uint64',
                    name: 'endDate',
                    type: 'uint64',
                },
                {
                    indexed: false,
                    internalType: 'string',
                    name: 'dataUrl',
                    type: 'string',
                },
            ],
            name: 'CampaignCreated',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    internalType: 'bytes32',
                    name: 'id',
                    type: 'bytes32',
                },
            ],
            name: 'CampaignFundsSpent',
            type: 'event',
        },
        { stateMutability: 'payable', type: 'fallback' },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'string', name: 'idPost', type: 'string' },
                { internalType: 'string', name: 'idUser', type: 'string' },
            ],
            name: 'applyCampaign',
            outputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'string', name: 'idPost', type: 'string' },
                { internalType: 'string', name: 'idUser', type: 'string' },
                { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
            ],
            name: 'ask',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'string', name: 'idPost', type: 'string' },
                { internalType: 'string', name: 'idUser', type: 'string' },
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'askBounty',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            name: 'campaigns',
            outputs: [
                {
                    internalType: 'address',
                    name: 'advertiser',
                    type: 'address',
                },
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                { internalType: 'uint64', name: 'nbProms', type: 'uint64' },
                {
                    internalType: 'uint64',
                    name: 'nbValidProms',
                    type: 'uint64',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct campaign.Fund',
                    name: 'funds',
                    type: 'tuple',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            ],
            name: 'createCampaign',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                {
                    internalType: 'uint256[]',
                    name: 'ratios',
                    type: ' uint256[]',
                },
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'createPriceFundAll',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                {
                    internalType: 'uint256[]',
                    name: 'bounties',
                    type: 'uint256[]',
                },
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'createPriceFundBounty',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
                { internalType: 'uint256', name: 'likeRatio', type: 'uint256' },
                { internalType: 'uint256', name: 'viewRatio', type: 'uint256' },
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
                { internalType: 'uint256', name: 'limit', type: 'uint256' },
            ],
            name: 'createPriceFundYt',
            outputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'endCampaign',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'uint256', name: 'amount', type: 'uint256' },
            ],
            name: 'fundCampaign',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'getGains',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'string', name: 'idPost', type: 'string' },
                { internalType: 'string', name: 'idUser', type: 'string' },
            ],
            name: 'getIsUsed',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'getOracleFee',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'getProms',
            outputs: [
                {
                    internalType: 'bytes32[]',
                    name: 'cproms',
                    type: 'bytes32[]',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'getRatios',
            outputs: [
                { internalType: 'uint8[]', name: 'types', type: 'uint8[]' },
                {
                    internalType: 'uint256[]',
                    name: 'likeRatios',
                    type: 'uint256[]',
                },
                {
                    internalType: 'uint256[]',
                    name: 'shareRatios',
                    type: 'uint256[]',
                },
                {
                    internalType: 'uint256[]',
                    name: 'viewRatios',
                    type: 'uint256[]',
                },
                {
                    internalType: 'uint256[]',
                    name: 'limits',
                    type: 'uint256[]',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'getRemainingFunds',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'getResults',
            outputs: [
                { internalType: 'bytes32[]', name: 'creq', type: 'bytes32[]' },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            name: 'isAlreadyUsed',
            outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'string', name: 'dataUrl', type: 'string' },
                { internalType: 'uint64', name: 'startDate', type: 'uint64' },
                { internalType: 'uint64', name: 'endDate', type: 'uint64' },
            ],
            name: 'modCampaign',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'bool', name: 'accepted', type: 'bool' },
            ],
            name: 'modToken',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'address', name: '', type: 'address' }],
            name: 'oraclelist',
            outputs: [
                {
                    internalType: 'address',
                    name: 'advertiser',
                    type: 'address',
                },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct campaign.Fund',
                    name: 'funds',
                    type: 'tuple',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [],
            name: 'owner',
            outputs: [
                { internalType: 'address payable', name: '', type: 'address' },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'uint256', name: 'likeRatio', type: 'uint256' },
                {
                    internalType: 'uint256',
                    name: 'shareRatio',
                    type: 'uint256',
                },
                { internalType: 'uint256', name: 'viewRatio', type: 'uint256' },
                { internalType: 'uint256', name: 'limit', type: 'uint256' },
            ],
            name: 'priceRatioCampaign',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            name: 'proms',
            outputs: [
                {
                    internalType: 'address',
                    name: 'influencer',
                    type: 'address',
                },
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
                { internalType: 'bool', name: 'isAccepted', type: 'bool' },
                { internalType: 'bool', name: 'isPayed', type: 'bool' },
                {
                    components: [
                        {
                            internalType: 'address',
                            name: 'token',
                            type: 'address',
                        },
                        {
                            internalType: 'uint256',
                            name: 'amount',
                            type: 'uint256',
                        },
                    ],
                    internalType: 'struct campaign.Fund',
                    name: 'funds',
                    type: 'tuple',
                },
                { internalType: 'uint8', name: 'typeSN', type: 'uint8' },
                { internalType: 'string', name: 'idPost', type: 'string' },
                { internalType: 'string', name: 'idUser', type: 'string' },
                { internalType: 'uint64', name: 'nbResults', type: 'uint64' },
                {
                    internalType: 'bytes32',
                    name: 'prevResult',
                    type: 'bytes32',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
            name: 'results',
            outputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
                { internalType: 'uint64', name: 'likes', type: 'uint64' },
                { internalType: 'uint64', name: 'shares', type: 'uint64' },
                { internalType: 'uint64', name: 'views', type: 'uint64' },
            ],
            stateMutability: 'view',
            type: 'function',
        },
        {
            inputs: [{ internalType: 'address', name: 'a', type: 'address' }],
            name: 'setOracle',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'startCampaign',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'address', name: '_from', type: 'address' },
                { internalType: 'uint256', name: '_value', type: 'uint256' },
                { internalType: 'bytes', name: '_data', type: 'bytes' },
            ],
            name: 'tokenFallback',
            outputs: [
                { internalType: 'bytes32', name: 'hash', type: 'bytes32' },
            ],
            stateMutability: 'pure',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'address payable',
                    name: 'newOwner',
                    type: 'address',
                },
            ],
            name: 'transferOwnership',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'address', name: 'token', type: 'address' },
                { internalType: 'address', name: 'to', type: 'address' },
                { internalType: 'uint256', name: 'val', type: 'uint256' },
            ],
            name: 'transferToken',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idRequest', type: 'bytes32' },
                { internalType: 'uint64', name: 'likes', type: 'uint64' },
                { internalType: 'uint64', name: 'shares', type: 'uint64' },
                { internalType: 'uint64', name: 'views', type: 'uint64' },
            ],
            name: 'update',
            outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'updateBounty',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
                { internalType: 'uint256', name: 'nbAbos', type: 'uint256' },
            ],
            name: 'updateBounty',
            outputs: [{ internalType: 'bool', name: 'ok', type: 'bool' }],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                {
                    internalType: 'bytes32',
                    name: 'idCampaign',
                    type: 'bytes32',
                },
            ],
            name: 'updateCampaignStats',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'updatePromStats',
            outputs: [
                { internalType: 'bytes32', name: 'requestId', type: 'bytes32' },
            ],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [
                { internalType: 'bytes32', name: 'idProm', type: 'bytes32' },
            ],
            name: 'validateProm',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            inputs: [],
            name: 'withdraw',
            outputs: [],
            stateMutability: 'nonpayable',
            type: 'function',
        },
        { stateMutability: 'payable', type: 'receive' },
    ],
]

let wrapConstants = []

wrapConstants[BttNetworkConstant] = {
    abi: [
        {
            constant: true,
            inputs: [],
            name: 'name',
            outputs: [{ name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: false,
            inputs: [
                { name: 'guy', type: 'address' },
                { name: 'wad', type: 'uint256' },
            ],
            name: 'approve',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            constant: true,
            inputs: [],
            name: 'totalSupply',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: false,
            inputs: [
                { name: 'src', type: 'address' },
                { name: 'dst', type: 'address' },
                { name: 'wad', type: 'uint256' },
            ],
            name: 'transferFrom',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            constant: false,
            inputs: [{ name: 'wad', type: 'uint256' }],
            name: 'withdraw',
            outputs: [],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            constant: true,
            inputs: [],
            name: 'decimals',
            outputs: [{ name: '', type: 'uint8' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: true,
            inputs: [{ name: '', type: 'address' }],
            name: 'balanceOf',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: true,
            inputs: [],
            name: 'symbol',
            outputs: [{ name: '', type: 'string' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        {
            constant: false,
            inputs: [
                { name: 'dst', type: 'address' },
                { name: 'wad', type: 'uint256' },
            ],
            name: 'transfer',
            outputs: [{ name: '', type: 'bool' }],
            payable: false,
            stateMutability: 'nonpayable',
            type: 'function',
        },
        {
            constant: false,
            inputs: [],
            name: 'deposit',
            outputs: [],
            payable: true,
            stateMutability: 'payable',
            type: 'function',
        },
        {
            constant: true,
            inputs: [
                { name: '', type: 'address' },
                { name: '', type: 'address' },
            ],
            name: 'allowance',
            outputs: [{ name: '', type: 'uint256' }],
            payable: false,
            stateMutability: 'view',
            type: 'function',
        },
        { payable: true, stateMutability: 'payable', type: 'fallback' },
        {
            anonymous: false,
            inputs: [
                { indexed: true, name: 'src', type: 'address' },
                { indexed: true, name: 'guy', type: 'address' },
                { indexed: false, name: 'wad', type: 'uint256' },
            ],
            name: 'Approval',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                { indexed: true, name: 'src', type: 'address' },
                { indexed: true, name: 'dst', type: 'address' },
                { indexed: false, name: 'wad', type: 'uint256' },
            ],
            name: 'Transfer',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                { indexed: true, name: 'dst', type: 'address' },
                { indexed: false, name: 'wad', type: 'uint256' },
            ],
            name: 'Deposit',
            type: 'event',
        },
        {
            anonymous: false,
            inputs: [
                { indexed: true, name: 'src', type: 'address' },
                { indexed: false, name: 'wad', type: 'uint256' },
            ],
            name: 'Withdrawal',
            type: 'event',
        },
    ],
}
wrapConstants[PolygonNetworkConstant] = {
    abi: wrapConstants[BttNetworkConstant].abi,
}

let multicallConstants = []

multicallConstants[Erc20NetworkConstant] = {
    address: '',
    abi: [
        {
            inputs: [
                {
                    internalType: 'address[]',
                    name: 'targets',
                    type: 'address[]',
                },
                {
                    internalType: 'bytes[]',
                    name: 'data',
                    type: 'bytes[]',
                },
            ],
            name: 'multiCall',
            outputs: [
                {
                    internalType: 'bytes[]',
                    name: '',
                    type: 'bytes[]',
                },
            ],
            stateMutability: 'view',
            type: 'function',
        },
    ],
}
multicallConstants[Bep20NetworkConstant] =
    multicallConstants[Erc20NetworkConstant]
multicallConstants[PolygonNetworkConstant] =
    multicallConstants[Erc20NetworkConstant]
multicallConstants[BttNetworkConstant] =
    multicallConstants[Erc20NetworkConstant]
multicallConstants[TronNetworkConstant] =
    multicallConstants[Erc20NetworkConstant]

if (process.env.NODE_ENV === 'mainnet') {
    Constants.token.satt = process.env.CONST_TOKEN_ADDRESS_MAINNET
    Constants.token.tether = process.env.CONST_TOKEN_ADDRESS_TETHERMAINNET
    Constants.token.dai = process.env.CONST_TOKEN_ADDRESS_DAIMAINNET
    Constants.campaign.address.campaignErc20 =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNET
    Constants.campaign.address.campaignBep20 =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNETBEP20
    Constants.campaign.address.campaignPolygon =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNET_POLYGON
    Constants.oracle.address.oracleErc20 =
        process.env.CONST_ORACLE_ADDRESS_MAINNET
    Constants.oracle.address.oracleBep20 =
        process.env.CONST_ORACLE_ADDRESS_MAINNETBEP20
    Constants.wSaTT.address.token = process.env.CONST_WSATT_ADDRESS_MAINNET
    Constants.priceGap.address.token =
        process.env.CONST_PRICEGAP_ADDRESS_MAINNET
    Constants.bep20.address.sattBep20 = process.env.CONST_BEP20_ADDRESS_MAINNET
    Constants.bep20.address.busd = process.env.CONST_BEP20_ADDRESS_BUSDMAINNET
    Constants.bep20.address.bnb = process.env.CONST_BEP20_ADDRESS_BUSDMAINNET

    PolygonConstants.token.satt =
        process.env.CONST_TOKEN_SATT_POLYGON_ADDRESS_MAINNET
    PolygonConstants.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNET_POLYGON
    PolygonConstants.oracle.address =
        process.env.CONST_ORACLE_ADDRESS_MAINNET_POLYGON
    BttConstants.token.satt = process.env.CONST_TOKEN_SATT_BTT_ADDRESS_MAINNET
    BttConstants.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNET_BTT
    BttConstants.oracle.address = process.env.CONST_ORACLE_ADDRESS_MAINNET_BTT
    TronConstant.token.satt = process.env.CONST_TOKEN_SATT_TRON_ADDRESS_MAINNET
    TronConstant.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_MAINNET_TRON
    TronConstant.oracle.address = process.env.CONST_ORACLE_ADDRESS_MAINNET_TRON
    TronConstant.token.wtrx = process.env.CONST_TOKEN_WTRX_TRON_ADDRESS_MAINNET
    Constants.token.wbtt = process.env.TOKEN_BTT_CONTRACT
    Constants.token.matic = process.env.TOKEN_MATIC_CONTRACT
    Constants.token.native = process.env.TOKEN_NATIVE_CONTRACT

    wrapConstants[PolygonNetworkConstant].address =
        process.env.CONST_WMATIC_MAINNET
    wrapConstants[BttNetworkConstant].address = process.env.CONST_WBTT_MAINNET
    wrapConstants[TronNetworkConstant] = { address: TronConstant.token.wtrx }

    multicallConstants[Erc20NetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_MAINNET
    multicallConstants[Bep20NetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_MAINNETBEP20
    multicallConstants[PolygonNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_MAINNET_POLYGON
    multicallConstants[BttNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_MAINNET_BTT
    multicallConstants[TronNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_MAINNET_TRON
} else {
    Constants.token.satt = process.env.CONST_TOKEN_ADDRESS_TESTNET
    Constants.token.wbtt = process.env.TOKEN_BTT_CONTRACT

    Constants.token.tether = process.env.CONST_TOKEN_ADDRESS_TETHERTESTNET
    Constants.token.dai = process.env.CONST_TOKEN_ADDRESS_DAITESTNET
    Constants.campaign.address.campaignErc20 =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNET
    Constants.campaign.address.campaignBep20 =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNETBEP20
    Constants.campaign.address.campaignPolygon =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNET_POLYGON
    Constants.oracle.address.oracleErc20 =
        process.env.CONST_ORACLE_ADDRESS_TESTNET
    Constants.oracle.address.oracleBep20 =
        process.env.CONST_ORACLE_ADDRESS_TESTNETBEP20
    Constants.wSaTT.address.token = process.env.CONST_WSATT_ADDRESS_MAINNET
    Constants.priceGap.address.token =
        process.env.CONST_PRICEGAP_ADDRESS_MAINNET
    Constants.bep20.address.sattBep20 = process.env.CONST_BEP20_ADDRESS_TESTNET
    Constants.bep20.address.bnb = process.env.CONST_BEP20_ADDRESS_BUSDMAINNET
    Constants.bep20.address.busd = process.env.CONST_BEP20_ADDRESS_BUSDTESTNET
    PolygonConstants.token.satt =
        process.env.CONST_TOKEN_SATT_POLYGON_ADDRESS_TESTNET
    PolygonConstants.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNET_POLYGON
    PolygonConstants.oracle.address =
        process.env.CONST_ORACLE_ADDRESS_TESTNET_POLYGON
    BttConstants.token.satt = process.env.CONST_TOKEN_SATT_BTT_ADDRESS_TESTNET
    BttConstants.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNET_BTT
    BttConstants.oracle.address = process.env.CONST_ORACLE_ADDRESS_TESTNET_BTT
    TronConstant.token.satt = process.env.CONST_TOKEN_SATT_TRON_ADDRESS_TESTNET
    TronConstant.campaign.address =
        process.env.CONST_COMPAIGN_ADDRESS_TESTNET_TRON
    TronConstant.oracle.address = process.env.CONST_ORACLE_ADDRESS_TESTNET_TRON
    TronConstant.token.wtrx = process.env.CONST_TOKEN_WTRX_TRON_ADDRESS_TESTNET
    Constants.token.matic = process.env.TOKEN_MATIC_CONTRACT
    Constants.token.native = process.env.TOKEN_NATIVE_CONTRACT

    wrapConstants[PolygonNetworkConstant].address =
        process.env.CONST_WMATIC_TESTNET
    wrapConstants[BttNetworkConstant].address = process.env.CONST_WBTT_TESTNET
    wrapConstants[TronNetworkConstant] = { address: TronConstant.token.wtrx }

    multicallConstants[Erc20NetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_TESTNET
    multicallConstants[Bep20NetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_TESTNETBEP20
    multicallConstants[PolygonNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_TESTNET_POLYGON
    multicallConstants[BttNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_TESTNET_BTT
    multicallConstants[TronNetworkConstant].address =
        process.env.CONST_MULTICALL_ADDRESS_TESTNET_TRON
}

CampaignConstants[Erc20NetworkConstant] = {
    abi: Constants.campaign.abi,
    address: Constants.campaign.address.campaignErc20,
}
CampaignConstants[Bep20NetworkConstant] = {
    abi: Constants.campaign.abi,
    address: Constants.campaign.address.campaignBep20,
}
CampaignConstants[PolygonNetworkConstant] = {
    abi: Constants.campaign.abi,
    address: Constants.campaign.address.campaignPolygon,
}
CampaignConstants[BttNetworkConstant] = {
    abi: Constants.campaign.abi,
    address: BttConstants.campaign.address,
}

OracleConstants[Erc20NetworkConstant] = {
    abi: Constants.oracle.abi,
    address: Constants.oracle.address.oracleErc20,
}
OracleConstants[Bep20NetworkConstant] = {
    abi: Constants.oracle.abi,
    address: Constants.oracle.address.oracleBep20,
}
OracleConstants[PolygonNetworkConstant] = {
    abi: Constants.oracle.abi,
    address: PolygonConstants.oracle.address,
}
OracleConstants[BttNetworkConstant] = {
    abi: Constants.oracle.abi,
    address: BttConstants.oracle.address,
}

let erc20TokenCampaigns = [
    Constants.token.satt.toLowerCase(),
    Constants.token.tether.toLowerCase(),
    Constants.token.dai.toLowerCase(),
]
let bep20TokenCampaigns = [
    Constants.bep20.address.busd.toLowerCase(),
    Constants.bep20.address.sattBep20.toLowerCase(),
    Constants.bep20.address.bnb.toLowerCase(),
]

let polygonTokensCampaign = [
    /*PolygonConstants.token.satt.toLowerCase()*/ Constants.token.matic,
]

let bttTokensCampaign = [
    //BttConstants.token.satt.toLowerCase(),
    Constants.token.wbtt.toLowerCase(),
]
let tronTokensCampaign = [TronConstant.token.wtrx.toLowerCase()]

exports.web3UrlBep20 = process.env.WEB3_URL_BEP20
exports.web3UrlBTT = process.env.WEB3_URL_BTT

exports.web3PolygonUrl = process.env.WEB3_URL_POLYGON
exports.web3Url = process.env.WEB3_URL
exports.web3Tron = process.env.WEB3_URL_TRON

module.exports.Constants = Constants
module.exports.PolygonConstants = PolygonConstants
module.exports.TronConstant = TronConstant
module.exports.BttConstants = BttConstants
module.exports.wrapConstants = wrapConstants

module.exports.Erc20NetworkConstant = Erc20NetworkConstant
module.exports.Bep20NetworkConstant = Bep20NetworkConstant
module.exports.PolygonNetworkConstant = PolygonNetworkConstant
module.exports.BttNetworkConstant = BttNetworkConstant
module.exports.TronNetworkConstant = TronNetworkConstant

module.exports.CampaignConstants = CampaignConstants
module.exports.OracleConstants = OracleConstants

module.exports.erc20TokenCampaigns = erc20TokenCampaigns
module.exports.bep20TokenCampaigns = bep20TokenCampaigns
module.exports.polygonTokensCampaign = polygonTokensCampaign
module.exports.bttTokensCampaign = bttTokensCampaign
module.exports.tronTokensCampaign = tronTokensCampaign
module.exports.CryptoSymbols = CryptoSymbols
module.exports.multicallConstants = multicallConstants
