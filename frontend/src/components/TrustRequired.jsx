import React from 'react';

function TrustRequired() {
    return (
        <div className="trust-required">
            <h1>Trust Wallet Required</h1>
            <p>Please install Trust Wallet to continue.</p>
            
            <div className="download-links">
                <a 
                    href="https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download for Android
                </a>
                
                <a 
                    href="https://apps.apple.com/app/trust-wallet/id1288339409"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Download for iOS
                </a>
            </div>
        </div>
    );
}

export default TrustRequired;