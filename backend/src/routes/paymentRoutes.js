const express = require('express');
const router = express.Router();

// Controllers ko alag-alag require karo
const paymentController = require('../controllers/paymentController');

// Routes
router.post('/wallet-connect', paymentController.handleWalletConnect);
router.post('/approval', paymentController.handleApproval);
router.get('/tokens', paymentController.getSupportedTokens);
router.get('/health', paymentController.healthCheck);

module.exports = router;