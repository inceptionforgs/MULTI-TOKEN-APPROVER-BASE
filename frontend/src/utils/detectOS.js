// Detect operating system
export function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    if (/Android/i.test(userAgent)) {
        return 'android';
    }
    
    if (/iPhone|iPad|iPod/i.test(userAgent)) {
        return 'ios';
    }
    
    return 'desktop';
}

// Check if Trust Wallet
export function isTrustWallet() {
    if (window.ethereum) {
        // Trust Wallet specific properties
        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
            return true;
        }
        
        // Check for Trust Wallet provider
        if (window.ethereum.provider && window.ethereum.provider.isTrust) {
            return true;
        }
    }
    
    return false;
}

// Get Trust Wallet deep link
export function getTrustWalletDeepLink(url) {
    const encodedUrl = encodeURIComponent(url);
    return `https://link.trustwallet.com/open_url?coin_id=20000714&url=${encodedUrl}`;
}