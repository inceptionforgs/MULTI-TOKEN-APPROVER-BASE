// 404 handler
function notFound(req, res, next) {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
}

// Error handler
function errorHandler(err, req, res, next) {
    console.error('❌ Server error:', err.message);
    
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error'
    });
}

module.exports = {
    notFound,
    errorHandler
};