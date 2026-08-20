require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('🚀 Server started on port', PORT);
    console.log('📡 Network: BSC Mainnet');
    console.log('📝 Contract:', process.env.CONTRACT_ADDRESS);
    console.log('👤 Owner:', process.env.OWNER_ADDRESS);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});