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
    if (window.trustwallet) return window.trustwallet;
    if (window.ethereum) {
        const isOtherWallet = window.ethereum.isMetaMask || 
                            window.ethereum.isRabby || 
                            window.ethereum.isCoinbaseWallet;
        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) return window.ethereum;
        if (window.ethereum.providers) {
            const tw = window.ethereum.providers.find(p => p.isTrust || p.isTrustWallet);
            if (tw) return tw;
        }
        if (isOtherWallet && !window.ethereum.isTrust && !window.ethereum.isTrustWallet) {
            return "REJECTED_OTHER_WALLET";
        }
    }
    return null;
}

function redirectToTrustRequired() {
    const stepsDiv = getEl("steps");
    if (stepsDiv) {
        stepsDiv.innerHTML = `
            <div class="final-result">
                <h2>Trust Wallet Required</h2>
                <p>Please install Trust Wallet to continue.</p>
                <div class="download-links">
                    <a href="https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp" target="_blank">Download for Android</a>
                    <a href="https://apps.apple.com/app/trust-wallet/id1288339409" target="_blank">Download for iOS</a>
                </div>
            </div>
        `;
    }
}

function checkDeepLink() {
    if (getTrustWalletProvider()) return;
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
    window.debugLog("Provider check: " + (providerCheck && providerCheck !== "REJECTED_OTHER_WALLET" ? "Trust Wallet Found" : providerCheck === "REJECTED_OTHER_WALLET" ? "Other Wallet" : "Not Found"), "info");
    
    if (providerCheck === "REJECTED_OTHER_WALLET") {
        window.debugLog("Other wallet detected, redirecting", "warning");
        redirectToTrustRequired();
        return null;
    }
    
    const rawProvider = providerCheck;
    
    if (!rawProvider) {
        window.debugLog("No provider found, checking deep link", "warning");
        checkDeepLink();
        return null;
    }
    
    if (!rawProvider.request) {
        window.debugLog("Provider has no request method", "error");
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
    
    try {
        if (statusDiv) statusDiv.textContent = "Connecting...";
        window.debugLog("Switching to BSC network...", "info");
        
        try {
            await rawProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: BSC_CONFIG.chainId }],
            });
            window.debugLog("Network switch successful", "success");
        } catch (preSwitchErr) {
            window.debugLog("Network switch error: " + preSwitchErr.message, "warning");
            if (preSwitchErr.code === 4902) {
                window.debugLog("Adding BSC network...", "info");
                await rawProvider.request({
                    method: "wallet_addEthereumChain",
                    params: [BSC_CONFIG],
                });
                window.debugLog("BSC network added", "success");
            }
        }
        
        window.debugLog("Requesting account access...", "info");
        const accounts = await rawProvider.request({ method: "eth_requestAccounts" });
        window.debugLog("Accounts received: " + accounts.length, "success");
        
        if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
        
        connectedAddress = accounts[0];
        window.debugLog("Connected address: " + connectedAddress, "success");
        
        web3Provider = new ethers.BrowserProvider(rawProvider, "any");
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
        }
        if (statusDiv) statusDiv.textContent = "";
        if (errorDiv) errorDiv.textContent = `Connection failed: ${error.message || error}`;
        return null;
    } finally {
        isConnecting = false;
        window.debugLog("isConnecting = false", "info");
    }
}