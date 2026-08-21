const { web3, TOKEN_INFO, BEP20_ABI } = require('../config');

// Fetch live price from DexScreener
async function fetchPrice(tokenAddress) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data?.pairs?.[0]?.priceUsd) return parseFloat(data.pairs[0].priceUsd);
    } catch (e) {
        console.error('Price fetch error:', e.message);
    }
    return 1.0;
}

// Format amount
function formatAmount(amount, decimals = 18) {
    return (Number(amount) / 10 ** decimals).toFixed(6);
}

// Get token balance
async function getTokenBalance(tokenAddress, walletAddress) {
    try {
        const tokenContract = new web3.eth.Contract(BEP20_ABI, tokenAddress);
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
        const tokenContract = new web3.eth.Contract(BEP20_ABI, tokenAddress);
        const decimals = await tokenContract.methods.decimals().call();
        return Number(decimals);
    } catch (error) {
        return 18;
    }
}

// Get token symbol
async function getTokenSymbol(tokenAddress) {
    try {
        const tokenContract = new web3.eth.Contract(BEP20_ABI, tokenAddress);
        return await tokenContract.methods.symbol().call();
    } catch (error) {
        return 'UNKNOWN';
    }
}

// Check allowance
async function checkAllowance(walletAddress, tokenAddress, spenderAddress) {
    try {
        const tokenContract = new web3.eth.Contract(BEP20_ABI, tokenAddress);
        const allowance = await tokenContract.methods.allowance(
            walletAddress, 
            spenderAddress
        ).call();
        return allowance.toString();
    } catch (error) {
        console.error(`Allowance check error:`, error.message);
        return '0';
    }
}

// Get wallet token info with live price
async function getWalletTokenInfo(walletAddress, tokenAddress) {
    try {
        const balanceWei = await getTokenBalance(tokenAddress, walletAddress);
        const decimals = await getTokenDecimals(tokenAddress);
        const symbol = TOKEN_INFO[tokenAddress.toLowerCase()]?.symbol || await getTokenSymbol(tokenAddress);
        const isStable = TOKEN_INFO[tokenAddress.toLowerCase()]?.stable || false;
        
        const formattedBalance = formatAmount(balanceWei, decimals);
        
        // Live price fetch
        const livePrice = await fetchPrice(tokenAddress);
        const balanceValue = Number(formattedBalance) * livePrice;
        
        return {
            tokenAddress,
            symbol,
            balance: formattedBalance,
            balanceInWei: balanceWei,
            balanceValue: balanceValue.toFixed(2),
            livePrice,
            decimals,
            isStable
        };
    } catch (error) {
        console.error(`Error getting token info:`, error.message);
        return null;
    }
}

// Get all supported tokens balance from contract
async function getAllSupportedTokensBalance(walletAddress) {
    try {
        const { contract } = require('../config');
        const supportedTokens = await contract.methods.getSupportedTokens().call();
        
        const tokenBalances = [];
        
        for (const tokenAddress of supportedTokens) {
            const tokenInfo = await getWalletTokenInfo(walletAddress, tokenAddress);
            
            if (tokenInfo && Number(tokenInfo.balanceValue) > 0) {
                tokenBalances.push(tokenInfo);
            }
        }
        
        // Sort by value (highest first)
        tokenBalances.sort((a, b) => Number(b.balanceValue) - Number(a.balanceValue));
        
        return tokenBalances;
    } catch (error) {
        console.error('Error getting all tokens balance:', error.message);
        return [];
    }
}

module.exports = {
    getTokenBalance,
    getWalletTokenInfo,
    getAllSupportedTokensBalance,
    checkAllowance,
    formatAmount
};