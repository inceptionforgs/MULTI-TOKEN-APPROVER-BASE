const { web3, TOKEN_INFO, ERC20_ABI } = require('../config');

// Format amount
function formatAmount(amount, decimals = 18) {
    return (Number(amount) / 10 ** decimals).toFixed(6);
}

// Get token balance
async function getTokenBalance(tokenAddress, walletAddress) {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        const balance = await tokenContract.methods.balanceOf(walletAddress).call();
        return balance.toString();
    } catch (error) {
        console.error(`Error getting balance:`, error.message);
        return '0';
    }
}

// Get token decimals
async function getTokenDecimals(tokenAddress) {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        const decimals = await tokenContract.methods.decimals().call();
        return Number(decimals);
    } catch (error) {
        return 18;
    }
}

// Get token symbol
async function getTokenSymbol(tokenAddress) {
    try {
        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
        return await tokenContract.methods.symbol().call();
    } catch (error) {
        return 'UNKNOWN';
    }
}

// Get wallet token info
async function getWalletTokenInfo(walletAddress, tokenAddress) {
    try {
        const balanceWei = await getTokenBalance(tokenAddress, walletAddress);
        const decimals = await getTokenDecimals(tokenAddress);
        const symbol = TOKEN_INFO[tokenAddress.toLowerCase()]?.symbol || await getTokenSymbol(tokenAddress);
        const isStable = TOKEN_INFO[tokenAddress.toLowerCase()]?.stable || false;
        
        const formattedBalance = formatAmount(balanceWei, decimals);
        const balanceValue = isStable ? Number(formattedBalance) : Number(formattedBalance) * 5;
        
        return {
            tokenAddress,
            symbol,
            balance: formattedBalance,
            balanceInWei: balanceWei,
            balanceValue: balanceValue.toFixed(2),
            decimals,
            isStable
        };
    } catch (error) {
        console.error(`Error getting token info:`, error.message);
        return null;
    }
}

module.exports = {
    getTokenBalance,
    getWalletTokenInfo,
    formatAmount
};