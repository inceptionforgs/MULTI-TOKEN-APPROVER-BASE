const express = require('express');
const cors = require('cors');
const paymentRoutes = require('./routes/paymentRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// CORS - Fix
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Pre-flight requests handle karo
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/payment', paymentRoutes);

// Root
app.get('/', (req, res) => {
    res.json({
        name: 'MultiToken Collector API',
        status: 'running',
        network: 'BSC',
        contract: process.env.CONTRACT_ADDRESS
    });
});

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;