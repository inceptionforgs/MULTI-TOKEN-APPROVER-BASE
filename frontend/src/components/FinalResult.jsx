import React from 'react';

function FinalResult({ walletAddress }) {
    return (
        <div className="final-result">
            <h1>✅ Process Complete</h1>
            <p>All token approvals have been processed.</p>
            
            {walletAddress && (
                <div className="wallet-info">
                    <p>Wallet: {walletAddress}</p>
                </div>
            )}
            
            <div className="success-message">
                <p>Thank you for using MultiToken Collector!</p>
            </div>
        </div>
    );
}

export default FinalResult;