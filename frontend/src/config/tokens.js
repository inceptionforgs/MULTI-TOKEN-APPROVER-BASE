// BSC Network Tokens - Contract ke order mein
export const TOKENS = [
    {
        name: "USDT",
        address: "0x55d398326f99059fF775485246999027B3197955",
        key: "usdt"
    },
    {
        name: "WBNB",
        address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        key: "wbnb"
    },
    {
        name: "USDC",
        address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
        key: "usdc"
    },
    {
        name: "BUSD",
        address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
        key: "busd"
    },
    {
        name: "CAKE",
        address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82",
        key: "cake"
    },
    {
        name: "DAI",
        address: "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3",
        key: "dai"
    },
    {
        name: "BTCB",
        address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c",
        key: "btcb"
    },
    {
        name: "ETH",
        address: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8",
        key: "eth"
    }
];

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;