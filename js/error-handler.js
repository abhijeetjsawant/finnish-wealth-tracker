/**
 * Finnish Wealth Tracker - Error Handler
 * Graceful error handling with fallbacks for market data
 */

class ErrorHandler {
    constructor() {
        // Error tracking
        this.errorLog = [];
        this.maxLogSize = 100;
        
        // Error categories for different handling strategies
        this.errorTypes = {
            NETWORK: 'network',
            API_LIMIT: 'api_limit', 
            API_KEY: 'api_key',
            INVALID_SYMBOL: 'invalid_symbol',
            DATA_FORMAT: 'data_format',
            TIMEOUT: 'timeout',
            UNKNOWN: 'unknown'
        };

        // Fallback strategies
        this.fallbackStrategies = new Map([
            [this.errorTypes.NETWORK, 'use_cache'],
            [this.errorTypes.API_LIMIT, 'use_cache_or_default'],
            [this.errorTypes.API_KEY, 'try_next_api'],
            [this.errorTypes.INVALID_SYMBOL, 'return_error'],
            [this.errorTypes.DATA_FORMAT, 'try_next_api'],
            [this.errorTypes.TIMEOUT, 'retry_with_backoff'],
            [this.errorTypes.UNKNOWN, 'use_cache_or_default']
        ]);
    }

    /**
     * Handle price data fetch errors
     * @param {string} symbol - Stock symbol that failed
     * @param {Error} error - The error that occurred
     * @returns {Object} Fallback price data
     */
    handlePriceError(symbol, error) {
        const errorType = this.categorizeError(error);
        const errorId = this.logError(error, { symbol, context: 'price_fetch' });
        
        console.error(`❌ Price error for ${symbol}:`, error.message);
        
        switch (this.fallbackStrategies.get(errorType)) {
            case 'use_cache':
                return this.getCachedFallback(symbol);
            
            case 'use_cache_or_default':
                return this.getCachedFallback(symbol) || this.getDefaultPriceData(symbol);
            
            case 'return_error':
                return this.createErrorResponse(symbol, error, errorId);
            
            default:
                return this.getDefaultPriceData(symbol);
        }
    }

    /**
     * Handle historical data fetch errors
     * @param {string} symbol - Stock symbol that failed
     * @param {string} timeframe - Requested timeframe
     * @param {Error} error - The error that occurred
     * @returns {Object} Fallback historical data
     */
    handleHistoricalError(symbol, timeframe, error) {
        const errorType = this.categorizeError(error);
        const errorId = this.logError(error, { symbol, timeframe, context: 'historical_fetch' });
        
        console.error(`❌ Historical data error for ${symbol} (${timeframe}):`, error.message);
        
        return this.getDefaultHistoricalData(symbol, timeframe, errorId);
    }

    /**
     * Handle API connectivity errors
     * @param {string} apiName - Name of the failed API
     * @param {Error} error - The error that occurred
     * @returns {Object} API status information
     */
    handleAPIError(apiName, error) {
        const errorType = this.categorizeError(error);
        const errorId = this.logError(error, { apiName, context: 'api_connectivity' });
        
        console.error(`❌ API error for ${apiName}:`, error.message);
        
        return {
            apiName,
            available: false,
            error: error.message,
            errorType,
            errorId,
            timestamp: Date.now(),
            retryAfter: this.calculateRetryDelay(errorType)
        };
    }

    /**
     * Categorize error types for appropriate handling
     * @param {Error} error - Error to categorize
     * @returns {string} Error category
     */
    categorizeError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
            return this.errorTypes.NETWORK;
        }
        
        if (message.includes('rate limit') || message.includes('quota') || message.includes('429')) {
            return this.errorTypes.API_LIMIT;
        }
        
        if (message.includes('unauthorized') || message.includes('api key') || message.includes('401')) {
            return this.errorTypes.API_KEY;
        }
        
        if (message.includes('symbol') || message.includes('not found') || message.includes('404')) {
            return this.errorTypes.INVALID_SYMBOL;
        }
        
        if (message.includes('timeout')) {
            return this.errorTypes.TIMEOUT;
        }
        
        if (message.includes('parse') || message.includes('format') || message.includes('json')) {
            return this.errorTypes.DATA_FORMAT;
        }
        
        return this.errorTypes.UNKNOWN;
    }

    /**
     * Log error with context and return unique error ID
     * @param {Error} error - Error to log
     * @param {Object} context - Additional context
     * @returns {string} Unique error ID
     */
    logError(error, context = {}) {
        const errorId = this.generateErrorId();
        const logEntry = {
            id: errorId,
            timestamp: Date.now(),
            message: error.message,
            stack: error.stack,
            type: this.categorizeError(error),
            context,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server'
        };

        this.errorLog.push(logEntry);
        
        // Prevent memory bloat
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // In production, this would send to error tracking service
        this.reportError(logEntry);
        
        return errorId;
    }

    /**
     * Generate unique error ID
     * @returns {string} Unique error identifier
     */
    generateErrorId() {
        return 'err_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Get cached fallback data
     * @param {string} symbol - Stock symbol
     * @returns {Object|null} Cached data or null
     */
    getCachedFallback(symbol) {
        // This would integrate with APICache
        try {
            const cached = localStorage.getItem(`fallback_${symbol}`);
            if (cached) {
                const data = JSON.parse(cached);
                data.source = 'CACHE_FALLBACK';
                data.warning = 'Using cached data due to API error';
                return data;
            }
        } catch (e) {
            console.warn('Failed to retrieve cached fallback data');
        }
        return null;
    }

    /**
     * Get default price data when all else fails
     * @param {string} symbol - Stock symbol
     * @returns {Object} Default price data
     */
    getDefaultPriceData(symbol) {
        // Provide reasonable defaults based on symbol type
        const isETF = ['VWCE', 'VTI', 'SPY', 'QQQ'].includes(symbol);
        const isIndex = symbol.includes('OMX') || symbol.includes('SPX');
        
        let basePrice = 100;
        if (isETF) basePrice = 80;
        if (isIndex) basePrice = 2500;
        
        return {
            symbol,
            price: basePrice,
            change: 0,
            changePercent: 0,
            timestamp: Date.now(),
            source: 'DEFAULT',
            warning: 'Real-time data unavailable - showing default values',
            isDefault: true
        };
    }

    /**
     * Get default historical data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Requested timeframe
     * @param {string} errorId - Associated error ID
     * @returns {Object} Default historical data
     */
    getDefaultHistoricalData(symbol, timeframe, errorId) {
        // Generate fake historical data for demo purposes
        const periods = this.getPeriodsForTimeframe(timeframe);
        const basePrice = this.getDefaultPriceData(symbol).price;
        const prices = [];
        
        for (let i = 0; i < periods; i++) {
            const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
            prices.push({
                date: new Date(Date.now() - (periods - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                price: Math.round((basePrice * (1 + variation)) * 100) / 100,
                volume: Math.floor(Math.random() * 1000000)
            });
        }

        return {
            symbol,
            timeframe,
            prices,
            source: 'DEFAULT',
            warning: 'Historical data unavailable - showing simulated data',
            errorId,
            isDefault: true
        };
    }

    /**
     * Create error response object
     * @param {string} symbol - Stock symbol
     * @param {Error} error - Original error
     * @param {string} errorId - Error ID
     * @returns {Object} Error response
     */
    createErrorResponse(symbol, error, errorId) {
        return {
            symbol,
            error: error.message,
            errorId,
            timestamp: Date.now(),
            success: false,
            price: null,
            change: null,
            changePercent: null
        };
    }

    /**
     * Calculate retry delay based on error type
     * @param {string} errorType - Type of error
     * @returns {number} Delay in milliseconds
     */
    calculateRetryDelay(errorType) {
        switch (errorType) {
            case this.errorTypes.API_LIMIT:
                return 60000; // 1 minute for rate limits
            case this.errorTypes.NETWORK:
                return 5000; // 5 seconds for network issues
            case this.errorTypes.TIMEOUT:
                return 10000; // 10 seconds for timeouts
            case this.errorTypes.API_KEY:
                return 300000; // 5 minutes for auth issues
            default:
                return 30000; // 30 seconds default
        }
    }

    /**
     * Get number of periods for timeframe
     * @param {string} timeframe - Timeframe string
     * @returns {number} Number of data points
     */
    getPeriodsForTimeframe(timeframe) {
        const timeframes = {
            '1D': 1,
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365
        };
        return timeframes[timeframe] || 30;
    }

    /**
     * Report error to monitoring service (placeholder)
     * @param {Object} logEntry - Error log entry
     */
    reportError(logEntry) {
        // In production, this would send to error tracking service like Sentry
        if (logEntry.type !== this.errorTypes.NETWORK) {
            console.warn('🔔 Error reported:', logEntry.id, logEntry.message);
        }
    }

    /**
     * Get error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        const now = Date.now();
        const oneHourAgo = now - 3600000;
        const recentErrors = this.errorLog.filter(error => error.timestamp > oneHourAgo);
        
        const errorsByType = {};
        recentErrors.forEach(error => {
            errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
        });

        return {
            totalErrors: this.errorLog.length,
            recentErrors: recentErrors.length,
            errorsByType,
            commonErrors: this.getMostCommonErrors(),
            healthScore: this.calculateHealthScore(recentErrors)
        };
    }

    /**
     * Get most common error types
     * @returns {Array} Array of common errors
     */
    getMostCommonErrors() {
        const errorCounts = {};
        this.errorLog.forEach(error => {
            errorCounts[error.type] = (errorCounts[error.type] || 0) + 1;
        });

        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * Calculate system health score based on recent errors
     * @param {Array} recentErrors - Recent error entries
     * @returns {number} Health score 0-100
     */
    calculateHealthScore(recentErrors) {
        if (recentErrors.length === 0) return 100;
        if (recentErrors.length > 50) return 0;
        
        return Math.max(0, 100 - (recentErrors.length * 2));
    }

    /**
     * Clear error log (admin function)
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log('🗑️ Error log cleared');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ErrorHandler;
} else if (typeof window !== 'undefined') {
    window.ErrorHandler = ErrorHandler;
}