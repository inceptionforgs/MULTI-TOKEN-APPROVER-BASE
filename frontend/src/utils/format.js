// Format amount with decimals
export function formatAmount(amount, decimals = 18) {
    return (Number(amount) / 10 ** decimals).toFixed(6);
}

// Calculate value in USD
export function calculateValue(balance, decimals, isStable, livePrice = null) {
    const formattedBalance = Number(formatAmount(balance, decimals));
    
    if (isStable) {
        return formattedBalance; // Stable = $1
    } else {
        return formattedBalance * (livePrice || 5); // Non-stable = live price or $5 default
    }
}

// Shorten address
export function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}