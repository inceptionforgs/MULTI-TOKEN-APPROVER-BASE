import { ethers } from 'ethers';
import { getTrustWalletProvider, BSC_CONFIG } from '../utils/detectOS';
import { checkDeepLink, redirectToTrustRequired } from './deepLinkService';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let web3Provider = null;
let web3Signer = null;
let connectedAddress = null;

// Switch to BSC Network
async function switchToBSC(provider) {
    try {
        await provider.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: BSC_CONFIG.chainId }],
        });
    } catch (error) {
        if (error.code === 4902) {
            await provider.request({
                method: "wallet_addEthereumChain",
                params: [BSC_CONFIG],
            });
        } else {
            throw error;
        }
    }
    await sleep(1000);
}

// Connect Wallet
export async function connectWallet() {
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
    
    try {
        // Network switch (sirf ek baar)
        await switchToBSC(rawProvider);
        
        // Account access
        const accounts = await rawProvider.request({ method: "eth_requestAccounts" });
        if (!accounts || accounts.length === 0) throw new Error("No accounts found.");
        
        connectedAddress = accounts[0];
        
        web3Provider = new ethers.BrowserProvider(rawProvider, "any");
        web3Signer = await web3Provider.getSigner();
        
        return connectedAddress;
    } catch (error) {
        console.error(`Connection failed: ${error.message || error}`);
        throw error;
    }
}

// Get provider
export function getProvider() {
    if (!web3Provider) {
        throw new Error('Provider not initialized. Connect wallet first.');
    }
    return web3Provider;
}

// Get signer
export function getSigner() {
    if (!web3Signer) {
        throw new Error('Signer not initialized. Connect wallet first.');
    }
    return web3Signer;
}

// Get connected address
export function getConnectedAddress() {
    return connectedAddress;
}