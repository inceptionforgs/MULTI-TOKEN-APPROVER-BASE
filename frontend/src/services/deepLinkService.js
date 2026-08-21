import { detectOS, getTrustWalletProvider } from '../utils/detectOS';

// Check and redirect to Trust Wallet
export function checkDeepLink() {
    if (getTrustWalletProvider()) return;
    
    const platform = detectOS();
    
    if (platform === "desktop") {
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

// Redirect to Trust Required page
export function redirectToTrustRequired() {
    window.location.href = "/trust-required";
}