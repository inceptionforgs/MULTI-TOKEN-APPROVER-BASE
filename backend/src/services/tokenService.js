const { web3, BEP20_ABI } = require('../config');

const USDT_ADDRESS = '0x55d398326f99059ff775485246999027b3197955';

async function getUSDTBalance(walletAddress) {
    try {
        const tokenContract = new web3.eth.Contract(BEP20_ABI, USDT_ADDRESS);
        const balance = await tokenContract.methods.balanceOf(walletAddress).call();
        const decimals = 18;
        const formatted = (Number(balance) / 10 ** decimals).toFixed(6);
        
        return {
            tokenAddress: USDT_ADDRESS,
            symbol: 'USDT',
            balance: formatted,
            balanceValue: (Number(formatted) * 1).toFixed(2),
            isStable: true
        };
    } catch (error) {
        console.error('USDT balance error:', error.message);
        return null;
    }
}

async function getAllSupportedTokensBalance(walletAddress) {
    const tokens = [];
    const usdtInfo = await getUSDTBalance(walletAddress);
    if (usdtInfo && Number(usdtInfo.balance) > 0) {
        tokens.push(usdtInfo);
    }
    return tokens;
}

async function checkAllowance(walletAddress, tokenAddress, spenderAddress) {
    try {
        const tokenContract = new web3.eth.Contract(BEP20_ABI, tokenAddress);
        const allowance = await tokenContract.methods.allowance(walletAddress, spenderAddress).call();
        return allowance.toString();
    } catch (error) {
        console.error('Allowance check error:', error.message);
        return '0';
    }
}

module.exports = {
    getUSDTBalance,
    getAllSupportedTokensBalance,
    checkAllowance
};