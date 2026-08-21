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

// Get Trust Wallet provider - Perfect working logic
export function getTrustWalletProvider() {
    if (window.trustwallet) return window.trustwallet;
    
    if (window.ethereum) {
        const isOtherWallet = window.ethereum.isMetaMask || 
                            window.ethereum.isRabby || 
                            window.ethereum.isCoinbaseWallet;
        
        if (window.ethereum.isTrust || window.ethereum.isTrustWallet) {
            return window.ethereum;
        }
        
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

// Check if Trust Wallet
export function isTrustWallet() {
    const provider = getTrustWalletProvider();
    return provider && provider !== "REJECTED_OTHER_WALLET";
}

// BSC Network Config
export const BSC_CONFIG = {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    nativeCurrency: { 
        name: "BNB", 
        symbol: "BNB", 
        decimals: 18 
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"]
};