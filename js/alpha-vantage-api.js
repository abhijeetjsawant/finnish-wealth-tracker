/**
 * Finnish Wealth Tracker - Alpha Vantage API Integration
 * Handles Alpha Vantage API calls with proper error handling
 */

class AlphaVantageAPI {
    constructor() {
        this.name = 'Alpha Vantage';
        this.baseURL = 'https://www.alphavantage.co/query';
        this.apiKey = 'YOUR_ALPHA_VANTAGE_KEY'; // Users need to replace this
        this.isEnabled = this.apiKey !== 'YOUR_ALPHA_VANTAGE_KEY';
        
        // API capabilities
        this.capabilities = {
            realTimeQuotes: true,
            historicalData: true,
            currencyExchange: true,
            internationalMarkets: true
        };

        // Request tracking
        this.requestCount = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.avgResponseTime = 0;
        this.lastError = null;

        // Rate limiting (Alpha Vantage: 5 API requests per minute, 500 per day)
        this.rateLimits = {
            requestsPerMinute: 5,
            requestsPerDay: 500
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
            const url = this.buildURL('GLOBAL_QUOTE', { symbol });
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check for API error responses
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }
            
            if (data['Note']) {
                throw new Error('API rate limit exceeded');
            }

            const quote = data['Global Quote'];
            if (!quote) {
                throw new Error('No quote data returned');
            }

            const result = this.formatPriceData(quote, symbol);
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
            let function_name;
            let outputsize = 'compact';

            // Map timeframe to Alpha Vantage function
            switch (timeframe) {
                case '1D':
                    function_name = 'TIME_SERIES_INTRADAY';
                    break;
                case '1W':
                case '1M':
                    function_name = 'TIME_SERIES_DAILY';
                    break;
                case '3M':
                case '1Y':
                    function_name = 'TIME_SERIES_DAILY';
                    outputsize = 'full';
                    break;
                default:
                    function_name = 'TIME_SERIES_DAILY';
            }

            const params = { symbol, outputsize };
            if (function_name === 'TIME_SERIES_INTRADAY') {
                params.interval = '5min';
            }

            const url = this.buildURL(function_name, params);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for errors
            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }

            if (data['Note']) {
                throw new Error('API rate limit exceeded');
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
            const url = this.buildURL('CURRENCY_EXCHANGE_RATE', {
                from_currency: from,
                to_currency: to
            });

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data['Error Message']) {
                throw new Error(data['Error Message']);
            }

            const exchangeData = data['Realtime Currency Exchange Rate'];
            if (!exchangeData) {
                throw new Error('No exchange rate data returned');
            }

            return parseFloat(exchangeData['5. Exchange Rate']);

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
     * Build API URL with parameters
     * @param {string} function_name - Alpha Vantage function
     * @param {Object} params - Additional parameters
     * @returns {string} Complete URL
     */
    buildURL(function_name, params = {}) {
        const url = new URL(this.baseURL);
        url.searchParams.set('function', function_name);
        url.searchParams.set('apikey', this.apiKey);

        // Add additional parameters
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });

        return url.toString();
    }

    /**
     * Format price data to standard format
     * @param {Object} quote - Alpha Vantage quote data
     * @param {string} symbol - Stock symbol
     * @returns {Object} Formatted price data
     */
    formatPriceData(quote, symbol) {
        const price = parseFloat(quote['05. price']);
        const previousClose = parseFloat(quote['08. previous close']);
        const change = price - previousClose;
        const changePercent = (change / previousClose) * 100;

        return {
            symbol: symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: parseInt(quote['06. volume']),
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            timestamp: Date.now(),
            source: 'ALPHA_VANTAGE',
            lastTradeTime: quote['07. latest trading day']
        };
    }

    /**
     * Format historical data to standard format
     * @param {Object} data - Alpha Vantage historical data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Requested timeframe
     * @returns {Object} Formatted historical data
     */
    formatHistoricalData(data, symbol, timeframe) {
        // Find the time series data (key varies by function)
        let timeSeries = null;
        const possibleKeys = [
            'Time Series (5min)',
            'Time Series (Daily)',
            'Monthly Time Series',
            'Weekly Time Series'
        ];

        for (const key of possibleKeys) {
            if (data[key]) {
                timeSeries = data[key];
                break;
            }
        }

        if (!timeSeries) {
            throw new Error('No time series data found in response');
        }

        // Convert to array format
        const prices = [];
        const entries = Object.entries(timeSeries);
        
        // Limit data based on timeframe
        const maxEntries = this.getMaxEntriesForTimeframe(timeframe);
        const limitedEntries = entries.slice(0, maxEntries);

        for (const [date, values] of limitedEntries) {
            prices.push({
                date: date,
                open: parseFloat(values['1. open']),
                high: parseFloat(values['2. high']),
                low: parseFloat(values['3. low']),
                close: parseFloat(values['4. close']),
                price: parseFloat(values['4. close']), // Use close as price
                volume: parseInt(values['5. volume'] || 0)
            });
        }

        return {
            symbol,
            timeframe,
            prices: prices.reverse(), // Reverse to get chronological order
            source: 'ALPHA_VANTAGE',
            metadata: data['Meta Data'] || {}
        };
    }

    /**
     * Get maximum entries based on timeframe
     * @param {string} timeframe - Requested timeframe
     * @returns {number} Maximum number of entries
     */
    getMaxEntriesForTimeframe(timeframe) {
        const limits = {
            '1D': 78, // 5-min intervals in a trading day
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365
        };
        return limits[timeframe] || 100;
    }

    /**
     * Record successful API call
     * @param {number} responseTime - Response time in milliseconds
     */
    recordSuccess(responseTime) {
        this.successCount++;
        this.requestCount++;
        
        // Update average response time
        this.avgResponseTime = ((this.avgResponseTime * (this.successCount - 1)) + responseTime) / this.successCount;
        
        console.log(`✅ Alpha Vantage success: ${responseTime}ms`);
    }

    /**
     * Record API error
     */
    recordError() {
        this.errorCount++;
        this.requestCount++;
        this.lastError = Date.now();
        
        console.warn(`⚠️ Alpha Vantage error count: ${this.errorCount}`);
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
            rateLimits: this.rateLimits
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
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AlphaVantageAPI;
} else if (typeof window !== 'undefined') {
    window.AlphaVantageAPI = AlphaVantageAPI;
}