// Debug Panel - Development only
// Production mein: debug folder delete karo + script tag remove karo

(function() {
    // Debug console panel - Bottom fixed
    const debugPanel = document.createElement("div");
    debugPanel.id = "debugPanel";
    debugPanel.style.cssText = `
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        width: 100%;
        height: 180px;
        background: rgba(0,0,0,0.95);
        border-top: 2px solid #00d4ff;
        display: flex;
        flex-direction: column;
        z-index: 9999;
        font-family: monospace;
    `;

    // Panel header
    const panelHeader = document.createElement("div");
    panelHeader.style.cssText = `
        padding: 5px 10px;
        background: #1a1a1a;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
        gap: 10px;
    `;

    const title = document.createElement("span");
    title.textContent = "🐛 Debug Console";
    title.style.cssText = "color: #00d4ff; font-size: 12px; font-weight: bold;";

    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = "display: flex; gap: 5px;";

    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy";
    copyBtn.style.cssText = `
        background: #00d4ff;
        color: #000;
        border: none;
        padding: 3px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
        font-weight: bold;
    `;

    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.style.cssText = `
        background: #ff4444;
        color: #fff;
        border: none;
        padding: 3px 10px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
    `;

    btnContainer.appendChild(copyBtn);
    btnContainer.appendChild(clearBtn);

    panelHeader.appendChild(title);
    panelHeader.appendChild(btnContainer);

    // Log area
    const logArea = document.createElement("div");
    logArea.id = "debugLog";
    logArea.style.cssText = `
        flex: 1;
        padding: 8px 10px;
        overflow-y: auto;
        font-size: 11px;
        line-height: 1.4;
        color: #ccc;
    `;

    debugPanel.appendChild(panelHeader);
    debugPanel.appendChild(logArea);
    document.body.appendChild(debugPanel);

    // Clear logs
    clearBtn.addEventListener("click", () => {
        logArea.innerHTML = "";
    });

    // Copy logs
    copyBtn.addEventListener("click", () => {
        const logs = [];
        const entries = logArea.querySelectorAll('div');
        entries.forEach(entry => {
            logs.push(entry.textContent);
        });
        
        const logText = logs.join('\n');
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(logText).then(() => {
                copyBtn.textContent = "✅ Copied!";
                setTimeout(() => {
                    copyBtn.textContent = "Copy";
                }, 2000);
            }).catch(() => {
                fallbackCopy(logText, copyBtn);
            });
        } else {
            fallbackCopy(logText, copyBtn);
        }
    });

    function fallbackCopy(text, btn) {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        
        try {
            document.execCommand('copy');
            btn.textContent = "✅ Copied!";
            setTimeout(() => {
                btn.textContent = "Copy";
            }, 2000);
        } catch (e) {
            btn.textContent = "❌ Failed";
            setTimeout(() => {
                btn.textContent = "Copy";
            }, 2000);
        }
        
        document.body.removeChild(textarea);
    }

    // Debug log function
    window.debugLog = function(message, type = "info") {
        const logEntry = document.createElement("div");
        logEntry.style.cssText = `
            margin: 2px 0;
            padding: 2px 5px;
            border-radius: 3px;
            word-wrap: break-word;
            white-space: pre-wrap;
        `;

        const timestamp = new Date().toLocaleTimeString();

        switch(type) {
            case "error":
                logEntry.style.background = "#3d0000";
                logEntry.style.color = "#ff6666";
                logEntry.textContent = `[${timestamp}] ❌ ${message}`;
                break;
            case "success":
                logEntry.style.background = "#003d00";
                logEntry.style.color = "#66ff66";
                logEntry.textContent = `[${timestamp}] ✅ ${message}`;
                break;
            case "warning":
                logEntry.style.background = "#3d3d00";
                logEntry.style.color = "#ffff66";
                logEntry.textContent = `[${timestamp}] ⚠️ ${message}`;
                break;
            default:
                logEntry.style.background = "#1a1a1a";
                logEntry.style.color = "#ccc";
                logEntry.textContent = `[${timestamp}] ℹ️ ${message}`;
        }

        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
    };

    // Override console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = function(...args) {
        originalLog.apply(console, args);
        window.debugLog(args.join(' '), "info");
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        window.debugLog(args.join(' '), "error");
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        window.debugLog(args.join(' '), "warning");
    };

    // Initial logs
    window.debugLog("Debug Panel initialized", "success");
    window.debugLog("Platform: " + getPlatform(), "info");
    window.debugLog("Trust Wallet: " + (getTrustWalletProvider() ? "Detected" : "Not Detected"), "info");
    window.debugLog("Backend URL: " + BACKEND_URL, "info");
    window.debugLog("Contract: " + CONTRACT_ADDRESS, "info");
})();