// BSC Network Tokens
export const TOKENS = [
    {
        address: '0x55d398326f99059fF775485246999027B3197955',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 18,
        stable: true,
        price: 1
    },
    {
        address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 18,
        stable: true,
        price: 1
    },
    {
        address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
        symbol: 'BUSD',
        name: 'Binance USD',
        decimals: 18,
        stable: true,
        price: 1
    },
    {
        address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
        symbol: 'DAI',
        name: 'Dai Stablecoin',
        decimals: 18,
        stable: true,
        price: 1
    },
    {
        address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        symbol: 'WBNB',
        name: 'Wrapped BNB',
        decimals: 18,
        stable: false,
        price: null // Live price
    },
    {
        address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
        symbol: 'CAKE',
        name: 'PancakeSwap',
        decimals: 18,
        stable: false,
        price: null
    },
    {
        address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
        symbol: 'BTCB',
        name: 'Bitcoin BEP2',
        decimals: 18,
        stable: false,
        price: null
    },
    {
        address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
        symbol: 'ETH',
        name: 'Ethereum Token',
        decimals: 18,
        stable: false,
        price: null
    }
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;