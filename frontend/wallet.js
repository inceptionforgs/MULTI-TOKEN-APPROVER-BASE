let web3Provider = null;
let web3Signer = null;
let connectedAddress = null;
let isConnecting = false;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getEl(id) {
    return document.getElementById(id);
}

function getPlatform() {
    const ua = navigator.userAgent || navigator.vendor || "";
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
    if (/android/i.test(ua)) return "android";
    return "other";
}

function getTrustWalletProvider() {
    // Check for Trust Wallet injected provider
    if (window.trustwallet) {
        return window.trustwallet;
    }
    
    if (window.ethereum) {
        // Trust Wallet specific check
        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
            return window.ethereum;
        }
        
        // Check providers array (for multiple wallet setup)
        if (window.ethereum.providers && window.ethereum.providers.length) {
            const trustProvider = window.ethereum.providers.find(
                p => p.isTrust || p.isTrustWallet
            );
            if (trustProvider) return trustProvider;
        }
        
        // Check if it's NOT Trust Wallet (MetaMask, Rabby, Coinbase, etc.)
        if (window.ethereum.isMetaMask || 
            window.ethereum.isRabby || 
            window.ethereum.isCoinbaseWallet ||
            window.ethereum.isBraveWallet ||
            window.ethereum.isOkxWallet ||
            window.ethereum.isBitKeep ||
            window.ethereum.isSafePal ||
            window.ethereum.isTokenPocket) {
            return "REJECTED_OTHER_WALLET";
        }
    }
    
    return null;
}

function redirectToTrustRequired() {
    const stepsDiv = getEl("steps");
    const errorDiv = getEl("error");
    const statusDiv = getEl("status");
    const walletInfoDiv = getEl("walletInfo");
    const btn = getEl("connectWalletBtn");
    
    if (btn) {
        btn.disabled = false;
        btn.textContent = "Connect Trust Wallet";
        btn.style.display = "block";
    }
    
    if (statusDiv) statusDiv.textContent = "";
    
    if (errorDiv) {
        errorDiv.textContent = "❌ Please install Trust Wallet to continue.";
        errorDiv.style.cssText = `
            color: #ff4444;
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0;
            padding: 15px;
            background: #3d0000;
            border-radius: 10px;
            border: 1px solid #ff4444;
        `;
    }
    
    if (stepsDiv) {
        stepsDiv.innerHTML = `
            <div class="final-result" style="margin-top: 20px;">
                <h2 style="color: #ff4444;">⚠️ Trust Wallet Required</h2>
                <p style="color: #ccc; margin: 10px 0;">This application only works with Trust Wallet.</p>
                <p style="color: #ccc; margin: 10px 0;">Please install Trust Wallet to continue.</p>
                <div class="download-links" style="margin-top: 15px;">
                    <a href="https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp" 
                       target="_blank" 
                       style="display: block; color: #00d4ff; margin: 10px 0; text-decoration: none; font-size: 16px;">
                       📱 Download for Android
                    </a>
                    <a href="https://apps.apple.com/app/trust-wallet/id1288339409" 
                       target="_blank" 
                       style="display: block; color: #00d4ff; margin: 10px 0; text-decoration: none; font-size: 16px;">
                       📱 Download for iOS
                    </a>
                </div>
            </div>
        `;
    }
    
    if (walletInfoDiv) {
        walletInfoDiv.style.display = "none";
    }
}

function checkDeepLink() {
    if (getTrustWalletProvider() && getTrustWalletProvider() !== "REJECTED_OTHER_WALLET") return;
    
    const platform = getPlatform();
    
    if (platform === "other") {
        redirectToTrustRequired();
        return;
    }
    
    const bareUrl = window.location.href.replace(/^https?:\/\//, "").split("?")[0];
    const bareUrlWithFlag = bareUrl + "?autoconnect=1";
    const encodedBareUrl = encodeURIComponent(bareUrlWithFlag);
    const fullUrlWithHttps = window.location.origin + window.location.pathname + "?autoconnect=1";
    const encodedFullUrl = encodeURIComponent(fullUrlWithHttps);
    
    if (platform === "android") {
        const trustLink = `intent://open_url?coin_id=60&url=${encodedBareUrl}#Intent;scheme=trust;package=com.wallet.crypto.trustapp;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.wallet.crypto.trustapp;end`;
        window.location.href = trustLink;
    } else if (platform === "ios") {
        const trustLink = `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedFullUrl}`;
        window.location.href = trustLink;
    }
}

async function connectWallet() {
    window.debugLog("connectWallet() called", "info");
    
    if (isConnecting) {
        window.debugLog("Already connecting, skipping", "warning");
        return null;
    }
    
    const providerCheck = getTrustWalletProvider();
    
    window.debugLog("Provider check: " + (
        providerCheck === null ? "Not Found" :
        providerCheck === "REJECTED_OTHER_WALLET" ? "Other Wallet Detected" : 
        "Trust Wallet Found"
    ), "info");
    
    // Agar koi aur wallet hai to Trust Wallet required error do
    if (providerCheck === "REJECTED_OTHER_WALLET") {
        window.debugLog("Other wallet detected, showing error", "warning");
        redirectToTrustRequired();
        return null;
    }
    
    // Agar koi provider nahi hai
    if (!providerCheck) {
        window.debugLog("No provider found", "warning");
        redirectToTrustRequired();
        return null;
    }
    
    if (!providerCheck.request) {
        window.debugLog("Provider has no request method", "error");
        redirectToTrustRequired();
        return null;
    }
    
    isConnecting = true;
    window.debugLog("isConnecting = true", "info");
    
    const btn = getEl("connectWalletBtn");
    const statusDiv = getEl("status");
    const errorDiv = getEl("error");
    const walletInfoDiv = getEl("walletInfo");
    
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Connecting...";
    }
    
    if (errorDiv) errorDiv.textContent = "";
    
    try {
        if (statusDiv) statusDiv.textContent = "Connecting...";
        window.debugLog("Switching to BSC network...", "info");
        
        try {
            await providerCheck.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: BSC_CONFIG.chainId }],
            });
            window.debugLog("Network switch successful", "success");
        } catch (preSwitchErr) {
            window.debugLog("Network switch error: " + preSwitchErr.message, "warning");
            if (preSwitchErr.code === 4902) {
                window.debugLog("Adding BSC network...", "info");
                await providerCheck.request({
                    method: "wallet_addEthereumChain",
                    params: [BSC_CONFIG],
                });
                window.debugLog("BSC network added", "success");
            }
        }
        
        window.debugLog("Requesting account access...", "info");
        const accounts = await providerCheck.request({ method: "eth_requestAccounts" });
        window.debugLog("Accounts received: " + accounts.length, "success");
        
        if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
        
        connectedAddress = accounts[0];
        window.debugLog("Connected address: " + connectedAddress, "success");
        
        web3Provider = new ethers.BrowserProvider(providerCheck, "any");
        web3Signer = await web3Provider.getSigner();
        window.debugLog("Signer created", "success");
        
        if (btn) {
            btn.textContent = "Connected";
            btn.style.display = "none";
        }
        
        if (walletInfoDiv) {
            walletInfoDiv.style.display = "block";
            walletInfoDiv.innerHTML = `Connected: ${connectedAddress}`;
        }
        
        if (statusDiv) statusDiv.textContent = "Connecting to blockchain...";
        
        return connectedAddress;
        
    } catch (error) {
        window.debugLog("Connection error: " + error.message, "error");
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = "Connect Wallet";
            btn.style.display = "block";
        }
        if (statusDiv) statusDiv.textContent = "";
        if (errorDiv) errorDiv.textContent = `Connection failed: ${error.message || error}`;
        return null;
    } finally {
        isConnecting = false;
        window.debugLog("isConnecting = false", "info");
    }
}