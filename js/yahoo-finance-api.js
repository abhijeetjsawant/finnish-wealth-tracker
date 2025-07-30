/**
 * Finnish Wealth Tracker - Yahoo Finance API Integration
 * Handles Yahoo Finance API calls via public endpoints
 */

class YahooFinanceAPI {
    constructor() {
        this.name = 'Yahoo Finance';
        this.baseURL = 'https://query1.finance.yahoo.com/v8/finance/chart';
        this.quotesURL = 'https://query1.finance.yahoo.com/v7/finance/quote';
        this.isEnabled = true; // Yahoo Finance has public endpoints
        
        // API capabilities
        this.capabilities = {
            realTimeQuotes: true,
            historicalData: true,
            currencyExchange: true,
            internationalMarkets: true,
            etfData: true
        };

        // Request tracking
        this.requestCount = 0;
        this.errorCount = 0;
        this.successCount = 0;
        this.avgResponseTime = 0;
        this.lastError = null;

        // Rate limiting (Yahoo Finance: Unofficial limits, be conservative)
        this.rateLimits = {
            requestsPerMinute: 30,
            requestsPerHour: 1000
        };

        // Symbol mapping for international markets
        this.symbolMappings = {
            'OMXH25': '^OMXH25',
            'OMXHPI': '^OMXHPI',
            'OMXS30': '^OMXS30'
        };
    }

    /**
     * Check if API is available for use
     * @returns {boolean} True if API can be used
     */
    isAvailable() {
        // Don't use if too many recent errors
        if (this.errorCount > 10 && this.successCount === 0) {
            return false;
        }

        return this.isEnabled;
    }

    /**
     * Get current price for a symbol
     * @param {string} symbol - Stock symbol
     * @returns {Promise<Object>} Price data
     */
    async getPrice(symbol) {
        const startTime = Date.now();
        
        try {
            const mappedSymbol = this.mapSymbol(symbol);
            const url = `${this.quotesURL}?symbols=${mappedSymbol}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FinWealthTracker/1.0)'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Check for API errors
            if (data.quoteResponse?.error) {
                throw new Error(data.quoteResponse.error);
            }

            const quotes = data.quoteResponse?.result;
            if (!quotes || quotes.length === 0) {
                throw new Error(`No quote data found for ${symbol}`);
            }

            const result = this.formatPriceData(quotes[0], symbol);
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
            const mappedSymbol = this.mapSymbol(symbol);
            const { period1, period2, interval } = this.getTimeframeParams(timeframe);
            
            const url = `${this.baseURL}/${mappedSymbol}?period1=${period1}&period2=${period2}&interval=${interval}`;
            
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FinWealthTracker/1.0)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            // Check for API errors
            if (data.chart?.error) {
                throw new Error(data.chart.error.description);
            }

            const chartData = data.chart?.result?.[0];
            if (!chartData) {
                throw new Error(`No historical data found for ${symbol}`);
            }

            return this.formatHistoricalData(chartData, symbol, timeframe);

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
            // Yahoo Finance currency format: EURUSD=X
            const currencySymbol = `${from}${to}=X`;
            const url = `${this.quotesURL}?symbols=${currencySymbol}`;

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FinWealthTracker/1.0)'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            const quotes = data.quoteResponse?.result;
            if (!quotes || quotes.length === 0) {
                throw new Error(`No exchange rate data found for ${from}/${to}`);
            }

            const rate = quotes[0].regularMarketPrice;
            if (!rate || rate <= 0) {
                throw new Error(`Invalid exchange rate for ${from}/${to}`);
            }

            return rate;

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
     * Map symbol to Yahoo Finance format
     * @param {string} symbol - Original symbol
     * @returns {string} Yahoo Finance symbol
     */
    mapSymbol(symbol) {
        // Handle special mappings for international indices
        if (this.symbolMappings[symbol]) {
            return this.symbolMappings[symbol];
        }

        // For European stocks, might need .HE, .ST suffixes
        // This is a simplified mapping - real implementation would be more comprehensive
        if (symbol.includes('NOKIA')) {
            return 'NOKIA.HE'; // Nokia on Helsinki exchange
        }

        return symbol;
    }

    /**
     * Get timeframe parameters for Yahoo Finance API
     * @param {string} timeframe - Requested timeframe
     * @returns {Object} Period and interval parameters
     */
    getTimeframeParams(timeframe) {
        const now = Math.floor(Date.now() / 1000);
        
        switch (timeframe) {
            case '1D':
                return {
                    period1: now - (24 * 60 * 60),
                    period2: now,
                    interval: '5m'
                };
            case '1W':
                return {
                    period1: now - (7 * 24 * 60 * 60),
                    period2: now,
                    interval: '1h'
                };
            case '1M':
                return {
                    period1: now - (30 * 24 * 60 * 60),
                    period2: now,
                    interval: '1d'
                };
            case '3M':
                return {
                    period1: now - (90 * 24 * 60 * 60),
                    period2: now,
                    interval: '1d'
                };
            case '1Y':
                return {
                    period1: now - (365 * 24 * 60 * 60),
                    period2: now,
                    interval: '1wk'
                };
            default:
                return {
                    period1: now - (30 * 24 * 60 * 60),
                    period2: now,
                    interval: '1d'
                };
        }
    }

    /**
     * Format price data to standard format
     * @param {Object} quote - Yahoo Finance quote data
     * @param {string} symbol - Stock symbol
     * @returns {Object} Formatted price data
     */
    formatPriceData(quote, symbol) {
        const price = quote.regularMarketPrice || quote.postMarketPrice || quote.preMarketPrice;
        const previousClose = quote.regularMarketPreviousClose || price;
        const change = quote.regularMarketChange || 0;
        const changePercent = quote.regularMarketChangePercent || 0;

        return {
            symbol: symbol,
            price: price,
            change: change,
            changePercent: changePercent,
            volume: quote.regularMarketVolume || 0,
            high: quote.regularMarketDayHigh || quote.dayHigh || price,
            low: quote.regularMarketDayLow || quote.dayLow || price,
            open: quote.regularMarketOpen || price,
            previousClose: previousClose,
            marketCap: quote.marketCap,
            peRatio: quote.trailingPE,
            timestamp: Date.now(),
            source: 'YAHOO_FINANCE',
            lastTradeTime: quote.regularMarketTime,
            currency: quote.currency,
            exchangeName: quote.fullExchangeName
        };
    }

    /**
     * Format historical data to standard format
     * @param {Object} chartData - Yahoo Finance chart data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - Requested timeframe
     * @returns {Object} Formatted historical data
     */
    formatHistoricalData(chartData, symbol, timeframe) {
        const timestamps = chartData.timestamp || [];
        const quotes = chartData.indicators?.quote?.[0] || {};
        
        const { open, high, low, close, volume } = quotes;

        if (!timestamps.length || !close) {
            throw new Error('Invalid historical data format');
        }

        const prices = timestamps.map((timestamp, index) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            timestamp: timestamp * 1000,
            open: open?.[index] || close[index],
            high: high?.[index] || close[index],
            low: low?.[index] || close[index],
            close: close[index],
            price: close[index],
            volume: volume?.[index] || 0
        })).filter(item => item.price !== null && item.price !== undefined);

        return {
            symbol,
            timeframe,
            prices,
            source: 'YAHOO_FINANCE',
            meta: chartData.meta
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
        this.avgResponseTime = ((this.avgResponseTime * (this.successCount - 1)) + responseTime) / this.successCount;
        
        console.log(`✅ Yahoo Finance success: ${responseTime}ms`);
    }

    /**
     * Record API error
     */
    recordError() {
        this.errorCount++;
        this.requestCount++;
        this.lastError = Date.now();
        
        console.warn(`⚠️ Yahoo Finance error count: ${this.errorCount}`);
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

    /**
     * Add symbol mapping for international markets
     * @param {string} originalSymbol - Original symbol
     * @param {string} yahooSymbol - Yahoo Finance symbol
     */
    addSymbolMapping(originalSymbol, yahooSymbol) {
        this.symbolMappings[originalSymbol] = yahooSymbol;
        console.log(`🗺️ Added symbol mapping: ${originalSymbol} -> ${yahooSymbol}`);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = YahooFinanceAPI;
} else if (typeof window !== 'undefined') {
    window.YahooFinanceAPI = YahooFinanceAPI;
}