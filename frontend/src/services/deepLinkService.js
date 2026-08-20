import { detectOS, getTrustWalletDeepLink } from '../utils/detectOS';

// Check and redirect to Trust Wallet
export function checkTrustWalletDeepLink() {
    const os = detectOS();
    const currentUrl = window.location.href;
    
    // Agar Trust Wallet nahi hai
    if (!window.ethereum || !window.ethereum.isTrust) {
        if (os === 'android') {
            // Android deep link
            const deepLink = getTrustWalletDeepLink(currentUrl);
            window.location.href = deepLink;
            return false;
        } else if (os === 'ios') {
            // iOS deep link
            const deepLink = getTrustWalletDeepLink(currentUrl);
            window.location.href = deepLink;
            return false;
        } else {
            // Desktop - Trust Wallet extension required
            return false;
        }
    }
    
    return true;
}

// Open in Trust Wallet
export function openInTrustWallet(url) {
    const deepLink = getTrustWalletDeepLink(url);
    window.location.href = deepLink;
}

// Get Trust Wallet App Store link
export function getTrustWalletAppLink() {
    const os = detectOS();
    
    if (os === 'android') {
        return 'https://play.google.com/store/apps/details?id=com.wallet.crypto.trustapp';
    } else if (os === 'ios') {
        return 'https://apps.apple.com/app/trust-wallet/id1288339409';
    }
    
    return 'https://trustwallet.com/download';
}