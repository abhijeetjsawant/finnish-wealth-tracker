/**
 * Finnish Wealth Tracker - IEX Cloud API Integration
 * Handles IEX Cloud API calls with proper error handling
 */

class IEXCloudAPI {
    constructor() {
        this.name = 'IEX Cloud';
        this.baseURL = 'https://cloud.iexapis.com/stable';
        this.sandboxURL = 'https://sandbox.iexapis.com/stable';
        this.apiKey = 'YOUR_IEX_CLOUD_KEY'; // Users need to replace this
        this.isEnabled = this.apiKey !== 'YOUR_IEX_CLOUD_KEY';
        this.useSandbox = false; // Set to true for testing
        
        // API capabilities
        this.capabilities = {
            realTimeQuotes: true,
            historicalData: true,
            currencyExchange: true,
            internationalMarkets: true,
            batchRequests: true
        };

        // Request tracking
        this.requestCount = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.avgResponseTime = 0;
        this.lastError = null;

        // Rate limiting (IEX Cloud: Generous limits, depends on plan)
        this.rateLimits = {
            requestsPerSecond: 100,
            requestsPerMonth: 50000 // Varies by plan
        };
    }

    /**
     * Check if API is available for use
     * @returns {boolean} True if API can be used
     */
    isAvailable() {
        // Don't use if API key not configured
        if (!this.isEnabled) {
            return false;
        }

        // Don't use if too many recent errors
        if (this.errorCount > 5 && this.successCount === 0) {
            return false;
        }

        return true;
    }

    /**
     * Get current price for a symbol
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} Price data
     */
    async getPrice(symbol) {
        const startTime = Date.now();
        
        try {
            const url = this.buildURL(`stock/${symbol}/quote`);
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Symbol ${symbol} not found`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check for API error responses
            if (data.error) {
                throw new Error(data.error);
            }

            const result = this.formatPriceData(data, symbol);
            this.recordSuccess(Date.now() - startTime);
            return result;

        } catch (error) {
            this.recordError();
            throw error;
        }
    }

    /**
     * Get historical price data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Time range (1D, 1W, 1M, 3M, 1Y)
     * @returns {Promise<Object>} Historical data
     */
    async getHistoricalData(symbol, timeframe) {
        try {
            let endpoint;
            
            // Map timeframe to IEX Cloud endpoint
            switch (timeframe) {
                case '1D':
                    endpoint = `stock/${symbol}/intraday-prices?chartLast=1`;
                    break;
                case '1W':
                    endpoint = `stock/${symbol}/chart/5d`;
                    break;
                case '1M':
                    endpoint = `stock/${symbol}/chart/1m`;
                    break;
                case '3M':
                    endpoint = `stock/${symbol}/chart/3m`;
                    break;
                case '1Y':
                    endpoint = `stock/${symbol}/chart/1y`;
                    break;
                default:
                    endpoint = `stock/${symbol}/chart/1m`;
            }

            const url = this.buildURL(endpoint);
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error(`Symbol ${symbol} not found`);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            return this.formatHistoricalData(data, symbol, timeframe);

        } catch (error) {
            this.recordError();
            throw error;
        }
    }

    /**
     * Get currency exchange rate
     * @param {string} from - Base currency
     * @param {string} to - Target currency
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate(from, to) {
        try {
            // IEX Cloud uses forex symbols like EURUSD
            const symbol = `${from}${to}`;
            const url = this.buildURL(`fx/latest?symbols=${symbol}`);

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // IEX Cloud returns forex data in different format
            if (data[0] && data[0].rate) {
                return data[0].rate;
            }

            throw new Error('No exchange rate data returned');

        } catch (error) {
            this.recordError();
            throw error;
        }
    }

    /**
     * Get multiple quotes in a single request (batch optimization)
     * @param {string[]} symbols - Array of symbols
     * @returns {Promise<Object>} Map of symbol to price data
     */
    async getBatchQuotes(symbols) {
        if (symbols.length === 0) return {};
        
        try {
            const symbolList = symbols.join(',');
            const url = this.buildURL(`stock/market/batch?symbols=${symbolList}&types=quote`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const results = {};

            // Process batch results
            for (const [symbol, symbolData] of Object.entries(data)) {
                if (symbolData.quote) {
                    results[symbol] = this.formatPriceData(symbolData.quote, symbol);
                }
            }

            this.recordSuccess(0); // Batch request
            return results;

        } catch (error) {
            this.recordError();
            throw error;
        }
    }

    /**
     * Check if API supports historical data
     * @returns {boolean} True if supported
     */
    supportsHistorical() {
        return this.capabilities.historicalData;
    }

    /**
     * Check if API supports currency exchange
     * @returns {boolean} True if supported
     */
    supportsCurrency() {
        return this.capabilities.currencyExchange;
    }

    /**
     * Check if API supports batch requests
     * @returns {boolean} True if supported
     */
    supportsBatch() {
        return this.capabilities.batchRequests;
    }

    /**
     * Build API URL with parameters
     * @param {string} endpoint - API endpoint
     * @param {Object} params - Additional parameters
     * @returns {string} Complete URL
     */
    buildURL(endpoint, params = {}) {
        const baseURL = this.useSandbox ? this.sandboxURL : this.baseURL;
        const url = new URL(`${baseURL}/${endpoint}`);
        
        // Add API key
        url.searchParams.set('token', this.apiKey);

        // Add additional parameters
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        return url.toString();
    }

    /**
     * Format price data to standard format
     * @param {Object} quote - IEX Cloud quote data
     * @param {string} symbol - Stock symbol
     * @returns {Object} Formatted price data
     */
    formatPriceData(quote, symbol) {
        const price = quote.latestPrice || quote.iexRealtimePrice || quote.delayedPrice;
        const change = quote.change || 0;
        const changePercent = quote.changePercent ? quote.changePercent * 100 : 0;

        return {
            symbol: symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: quote.latestVolume || quote.avgTotalVolume || 0,
            high: quote.high || price,
            low: quote.low || price,
            open: quote.open || price,
            previousClose: quote.previousClose || price,
            marketCap: quote.marketCap,
            peRatio: quote.peRatio,
            timestamp: Date.now(),
            source: 'IEX_CLOUD',
            lastTradeTime: quote.latestTime,
            isUSMarketOpen: quote.isUSMarketOpen
        };
    }

    /**
     * Format historical data to standard format
     * @param {Array} data - IEX Cloud historical data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Requested timeframe
     * @returns {Object} Formatted historical data
     */
    formatHistoricalData(data, symbol, timeframe) {
        if (!Array.isArray(data)) {
            throw new Error('Invalid historical data format');
        }

        const prices = data.map(item => {
            // Handle both daily and intraday data formats
            const price = item.close || item.average || item.marketAverage;
            
            return {
                date: item.date,
                time: item.minute, // For intraday data
                open: item.open || price,
                high: item.high || price,
                low: item.low || price,
                close: price,
                price: price,
                volume: item.volume || 0
            };
        }).filter(item => item.price !== null && item.price !== undefined);

        return {
            symbol,
            timeframe,
            prices,
            source: 'IEX_CLOUD'
        };
    }

    /**
     * Record successful API call
     * @param {number} responseTime - Response time in milliseconds
     */
    recordSuccess(responseTime) {
        this.successCount++;
        this.requestCount++;
        
        // Update average response time
        if (responseTime > 0) {
            this.avgResponseTime = ((this.avgResponseTime * (this.successCount - 1)) + responseTime) / this.successCount;
        }
        
        console.log(`✅ IEX Cloud success: ${responseTime}ms`);
    }

    /**
     * Record API error
     */
    recordError() {
        this.errorCount++;
        this.requestCount++;
        this.lastError = Date.now();
        
        console.warn(`⚠️ IEX Cloud error count: ${this.errorCount}`);
    }

    /**
     * Get API statistics
     * @returns {Object} API performance statistics
     */
    getStats() {
        return {
            name: this.name,
            enabled: this.isEnabled,
            available: this.isAvailable(),
            requestCount: this.requestCount,
            successCount: this.successCount,
            errorCount: this.errorCount,
            successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(1) + '%' : '0%',
            avgResponseTime: Math.round(this.avgResponseTime) + 'ms',
            capabilities: this.capabilities,
            rateLimits: this.rateLimits,
            usingSandbox: this.useSandbox
        };
    }

    /**
     * Reset statistics (for testing)
     */
    resetStats() {
        this.requestCount = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.avgResponseTime = 0;
        this.lastError = null;
    }

    /**
     * Enable sandbox mode for testing
     */
    enableSandbox() {
        this.useSandbox = true;
        console.log('🧪 IEX Cloud sandbox mode enabled');
    }

    /**
     * Disable sandbox mode
     */
    disableSandbox() {
        this.useSandbox = false;
        console.log('🏭 IEX Cloud production mode enabled');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IEXCloudAPI;
} else if (typeof window !== 'undefined') {
    window.IEXCloudAPI = IEXCloudAPI;
}