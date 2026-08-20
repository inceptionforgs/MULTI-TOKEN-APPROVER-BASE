import { ethers } from 'ethers';
import { isTrustWallet } from '../utils/detectOS';

// Connect wallet
export async function connectWallet() {
    try {
        if (!isTrustWallet()) {
            throw new Error('You are not eligible. Please install Trust Wallet and try again.');
        }
        
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Request account access
        const accounts = await provider.send('eth_requestAccounts', []);
        
        if (!accounts || accounts.length === 0) {
            throw new Error('No wallet found');
        }
        
        return accounts[0];
    } catch (error) {
        console.error('Wallet connection error:', error);
        throw error;
    }
}

// Get current wallet address
export async function getWalletAddress() {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        return await signer.getAddress();
    } catch (error) {
        console.error('Error getting wallet address:', error);
        return null;
    }
}

// Approve token
export async function approveToken(tokenAddress, spenderAddress, amount) {
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        const erc20Abi = [
            'function approve(address spender, uint256 amount) returns (bool)'
        ];
        
        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, signer);
        
        const tx = await tokenContract.approve(spenderAddress, amount);
        await tx.wait();
        
        return {
            success: true,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error('Approval error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}