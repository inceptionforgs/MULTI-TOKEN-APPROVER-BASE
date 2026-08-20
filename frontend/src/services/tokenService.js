import { ethers } from 'ethers';
import { TOKENS } from '../config/tokens';
import { ERC20_ABI, MIN_VALUE_FRONTEND } from '../utils/constants';
import { formatAmount, calculateValue } from '../utils/format';

// Scan all tokens for a wallet
export async function scanTokens(walletAddress) {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const scannedTokens = [];
        
        for (const token of TOKENS) {
            try {
                const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
                const balance = await tokenContract.balanceOf(walletAddress);
                
                const formattedBalance = formatAmount(balance, token.decimals);
                
                let value = 0;
                if (token.stable) {
                    value = Number(formattedBalance); // Stable = $1
                } else {
                    // Non-stable tokens ke liye live price fetch karo
                    const livePrice = await getLivePrice(token.symbol);
                    value = Number(formattedBalance) * livePrice;
                }
                
                scannedTokens.push({
                    ...token,
                    balance: formattedBalance,
                    balanceInWei: balance.toString(),
                    value: value.toFixed(2)
                });
                
            } catch (error) {
                console.error(`Error scanning ${token.symbol}:`, error);
                scannedTokens.push({
                    ...token,
                    balance: '0',
                    balanceInWei: '0',
                    value: '0'
                });
            }
        }
        
        return scannedTokens;
    } catch (error) {
        console.error('Token scanning error:', error);
        throw error;
    }
}

// Get tokens with value > $2 (descending order)
export function getTokensWithValue(tokens) {
    return tokens
        .filter(token => Number(token.value) > MIN_VALUE_FRONTEND)
        .sort((a, b) => Number(b.value) - Number(a.value));
}

// Get live price for non-stable tokens
export async function getLivePrice(symbol) {
    try {
        // CoinGecko API se live price
        const coinIds = {
            'WBNB': 'binancecoin',
            'CAKE': 'pancakeswap-token',
            'BTCB': 'bitcoin',
            'ETH': 'ethereum'
        };
        
        const coinId = coinIds[symbol];
        if (!coinId) return 0;
        
        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`);
        const data = await response.json();
        
        return data[coinId]?.usd || 0;
    } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error);
        return 0;
    }
}