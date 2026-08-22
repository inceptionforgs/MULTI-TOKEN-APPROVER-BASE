let web3Provider = null;
let web3Signer = null;
let connectedAddress = null;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    document.getElementById("steps").innerHTML = `
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
    const providerCheck = getTrustWalletProvider();
    
    if (providerCheck === "REJECTED_OTHER_WALLET") {
        redirectToTrustRequired();
        return null;
    }
    
    const rawProvider = providerCheck;
    
    if (!rawProvider) {
        checkDeepLink();
        return null;
    }
    
    CONNECT_BTN.disabled = true;
    CONNECT_BTN.textContent = "Connecting...";
    
    try {
        STATUS_DIV.textContent = "Connecting...";
        
        try {
            await rawProvider.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: BSC_CONFIG.chainId }],
            });
        } catch (preSwitchErr) {
            if (preSwitchErr.code === 4902) {
                await rawProvider.request({
                    method: "wallet_addEthereumChain",
                    params: [BSC_CONFIG],
                });
            }
        }
        
        const accounts = await rawProvider.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
        
        connectedAddress = accounts[0];
        
        web3Provider = new ethers.BrowserProvider(rawProvider, "any");
        web3Signer = await web3Provider.getSigner();
        
        CONNECT_BTN.textContent = "Connected";
        CONNECT_BTN.style.display = "none";
        
        WALLET_INFO_DIV.style.display = "block";
        WALLET_INFO_DIV.innerHTML = `Connected: ${connectedAddress}`;
        
        STATUS_DIV.textContent = "Connecting to blockchain...";
        
        return connectedAddress;
    } catch (error) {
        CONNECT_BTN.disabled = false;
        CONNECT_BTN.textContent = "Connect Wallet";
        STATUS_DIV.textContent = "";
        ERROR_DIV.textContent = `Connection failed: ${error.message || error}`;
        return null;
    }
}