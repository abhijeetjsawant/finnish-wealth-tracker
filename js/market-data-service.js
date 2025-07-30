/**
 * Finnish Wealth Tracker - Market Data Service
 * Real-time market data integration with multiple API providers
 * Supports Alpha Vantage, IEX Cloud, and Yahoo Finance APIs
 */

class MarketDataService {
    constructor() {
        this.apis = [
            new AlphaVantageAPI(),
            new IEXCloudAPI(),
            new YahooFinanceAPI()
        ];
        this.cache = new APICache();
        this.rateLimiter = new RateLimiter();
        this.errorHandler = new ErrorHandler();
        
        // API configuration
        this.config = {
            retryAttempts: 3,
            retryDelay: 1000,
            timeout: 10000,
            cacheDuration: {
                realTime: 5 * 60 * 1000, // 5 minutes during market hours
                afterHours: 60 * 60 * 1000, // 1 hour after market close
                historical: 24 * 60 * 60 * 1000, // 24 hours for historical data
                currency: 30 * 60 * 1000 // 30 minutes for currency rates
            }
        };
        
        // Initialize service
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Initializing MarketDataService...');
        
        // Load cached data
        await this.cache.loadFromStorage();
        
        // Test API connectivity
        await this.testConnectivity();
        
        console.log('✅ MarketDataService initialized successfully');
    }

    /**
     * Get current price for a single symbol
     * @param {string} symbol - Stock symbol (e.g., 'VWCE', 'AAPL')
     * @param {boolean} forceRefresh - Force API call bypassing cache
     * @returns {Promise<Object>} Price data object
     */
    async getPrice(symbol, forceRefresh = false) {
        const cacheKey = `price_${symbol}`;
        
        // Check cache first unless force refresh
        if (!forceRefresh) {
            const cached = this.cache.get(cacheKey);
            if (cached && !this.cache.isExpired(cacheKey)) {
                console.log(`📦 Cache hit for ${symbol}`);
                return cached;
            }
        }

        // Rate limiting check
        if (!this.rateLimiter.canMakeRequest()) {
            console.log('⏳ Rate limit reached, using cached data');
            return this.cache.get(cacheKey) || this.getDefaultPriceData(symbol);
        }

        try {
            console.log(`🔄 Fetching live price for ${symbol}`);
            
            // Try each API in priority order
            for (const api of this.apis) {
                if (!api.isAvailable()) continue;
                
                try {
                    const data = await this.makeRequest(() => api.getPrice(symbol));
                    
                    if (this.validatePriceData(data)) {
                        // Cache successful response
                        this.cache.set(cacheKey, data, this.getCacheDuration('realTime'));
                        this.rateLimiter.recordRequest();
                        
                        console.log(`✅ Successfully fetched ${symbol} from ${api.name}`);
                        return data;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${api.name} failed for ${symbol}:`, error.message);
                    api.recordError();
                    continue;
                }
            }
            
            throw new Error('All APIs failed');
            
        } catch (error) {
            console.error(`❌ Failed to fetch ${symbol}:`, error);
            return this.errorHandler.handlePriceError(symbol, error);
        }
    }

    /**
     * Get prices for multiple symbols
     * @param {string[]} symbols - Array of stock symbols
     * @param {boolean} forceRefresh - Force API calls bypassing cache
     * @returns {Promise<Object>} Map of symbol to price data
     */
    async getPrices(symbols, forceRefresh = false) {
        console.log(`📊 Fetching prices for ${symbols.length} symbols`);
        
        const promises = symbols.map(symbol => 
            this.getPrice(symbol, forceRefresh).catch(error => ({
                symbol,
                error: error.message,
                price: null,
                change: null,
                changePercent: null
            }))
        );

        const results = await Promise.all(promises);
        
        const priceMap = {};
        results.forEach(result => {
            if (result.symbol) {
                priceMap[result.symbol] = result;
            }
        });

        return priceMap;
    }

    /**
     * Get historical price data
     * @param {string} symbol - Stock symbol
     * @param {string} timeframe - '1D', '1W', '1M', '3M', '1Y'
     * @returns {Promise<Object>} Historical price data
     */
    async getHistoricalData(symbol, timeframe = '1M') {
        const cacheKey = `historical_${symbol}_${timeframe}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && !this.cache.isExpired(cacheKey)) {
            console.log(`📦 Cache hit for historical ${symbol}`);
            return cached;
        }

        try {
            // Try each API for historical data
            for (const api of this.apis) {
                if (!api.isAvailable() || !api.supportsHistorical()) continue;
                
                try {
                    const data = await this.makeRequest(() => 
                        api.getHistoricalData(symbol, timeframe)
                    );
                    
                    if (this.validateHistoricalData(data)) {
                        // Cache for 24 hours
                        this.cache.set(cacheKey, data, this.getCacheDuration('historical'));
                        return data;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${api.name} historical failed for ${symbol}:`, error.message);
                    continue;
                }
            }
            
            throw new Error('No historical data available');
            
        } catch (error) {
            console.error(`❌ Failed to fetch historical data for ${symbol}:`, error);
            return this.errorHandler.handleHistoricalError(symbol, timeframe, error);
        }
    }

    /**
     * Get currency exchange rates
     * @param {string} from - Base currency (e.g., 'EUR')
     * @param {string} to - Target currency (e.g., 'USD')
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate(from, to) {
        if (from === to) return 1.0;
        
        const cacheKey = `exchange_${from}_${to}`;
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && !this.cache.isExpired(cacheKey)) {
            return cached.rate;
        }

        try {
            // Try each API for currency data
            for (const api of this.apis) {
                if (!api.isAvailable() || !api.supportsCurrency()) continue;
                
                try {
                    const rate = await this.makeRequest(() => 
                        api.getExchangeRate(from, to)
                    );
                    
                    if (rate && rate > 0) {
                        const data = { rate, timestamp: Date.now() };
                        this.cache.set(cacheKey, data, this.getCacheDuration('currency'));
                        return rate;
                    }
                } catch (error) {
                    console.warn(`⚠️ ${api.name} currency failed for ${from}/${to}:`, error.message);
                    continue;
                }
            }
            
            // Fallback to default rates
            return this.getDefaultExchangeRate(from, to);
            
        } catch (error) {
            console.error(`❌ Failed to fetch exchange rate ${from}/${to}:`, error);
            return this.getDefaultExchangeRate(from, to);
        }
    }

    /**
     * Get Finnish market indices (OMX Helsinki)
     * @returns {Promise<Object>} Finnish market data
     */
    async getFinnishMarketData() {
        const indices = ['OMXH25', 'OMXHPI', 'OMXS30']; // Helsinki indices
        const cacheKey = 'finnish_market';
        
        // Check cache first
        const cached = this.cache.get(cacheKey);
        if (cached && !this.cache.isExpired(cacheKey)) {
            return cached;
        }

        try {
            const marketData = {};
            
            for (const index of indices) {
                try {
                    const data = await this.getPrice(index);
                    if (data && data.price) {
                        marketData[index] = data;
                    }
                } catch (error) {
                    console.warn(`⚠️ Failed to fetch ${index}:`, error.message);
                }
            }
            
            // Add some market context
            marketData.marketStatus = this.getMarketStatus('XHEL'); // Helsinki exchange
            marketData.lastUpdate = new Date().toISOString();
            
            this.cache.set(cacheKey, marketData, this.getCacheDuration('realTime'));
            return marketData;
            
        } catch (error) {
            console.error('❌ Failed to fetch Finnish market data:', error);
            return this.getDefaultFinnishMarketData();
        }
    }

    /**
     * Make HTTP request with timeout and retry logic
     */
    async makeRequest(requestFn) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)
                );
                
                const result = await Promise.race([
                    requestFn(),
                    timeoutPromise
                ]);
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                if (attempt < this.config.retryAttempts) {
                    const delay = this.config.retryDelay * attempt;
                    console.log(`🔄 Retry attempt ${attempt + 1} in ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Test API connectivity on startup
     */
    async testConnectivity() {
        console.log('🔍 Testing API connectivity...');
        
        const testSymbol = 'AAPL'; // Use AAPL as test symbol
        
        for (const api of this.apis) {
            try {
                const startTime = Date.now();
                await api.getPrice(testSymbol);
                const responseTime = Date.now() - startTime;
                
                api.recordSuccess(responseTime);
                console.log(`✅ ${api.name}: ${responseTime}ms`);
                
            } catch (error) {
                api.recordError();
                console.warn(`⚠️ ${api.name}: ${error.message}`);
            }
        }
    }

    // Validation methods
    validatePriceData(data) {
        return data && 
               typeof data.price === 'number' && 
               data.price > 0 &&
               data.symbol &&
               typeof data.timestamp === 'number';
    }

    validateHistoricalData(data) {
        return data && 
               Array.isArray(data.prices) && 
               data.prices.length > 0 &&
               data.symbol;
    }

    // Cache duration helpers
    getCacheDuration(type) {
        const isMarketHours = this.isMarketHours();
        
        switch (type) {
            case 'realTime':
                return isMarketHours ? 
                    this.config.cacheDuration.realTime : 
                    this.config.cacheDuration.afterHours;
            case 'historical':
                return this.config.cacheDuration.historical;
            case 'currency':
                return this.config.cacheDuration.currency;
            default:
                return this.config.cacheDuration.realTime;
        }
    }

    isMarketHours() {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        
        // Rough market hours check (9:30 AM - 4:00 PM EST, Monday-Friday)
        return day >= 1 && day <= 5 && hour >= 9 && hour <= 16;
    }

    getMarketStatus(exchange = 'NASDAQ') {
        const isOpen = this.isMarketHours();
        return {
            isOpen,
            status: isOpen ? 'OPEN' : 'CLOSED',
            exchange,
            timestamp: Date.now()
        };
    }

    // Default/fallback data methods
    getDefaultPriceData(symbol) {
        console.log(`📋 Using default data for ${symbol}`);
        return {
            symbol,
            price: 100.00,
            change: 0.50,
            changePercent: 0.50,
            timestamp: Date.now(),
            source: 'DEFAULT'
        };
    }

    getDefaultExchangeRate(from, to) {
        // Default exchange rates (approximations)
        const rates = {
            'EUR_USD': 1.09,
            'EUR_GBP': 0.84,
            'EUR_SEK': 11.50,
            'USD_EUR': 0.92,
            'GBP_EUR': 1.19,
            'SEK_EUR': 0.087
        };
        
        const key = `${from}_${to}`;
        const reverseKey = `${to}_${from}`;
        
        if (rates[key]) {
            return rates[key];
        } else if (rates[reverseKey]) {
            return 1 / rates[reverseKey];
        }
        
        return 1.0; // Fallback
    }

    getDefaultFinnishMarketData() {
        return {
            OMXH25: { symbol: 'OMXH25', price: 5200, change: 15, changePercent: 0.29 },
            OMXHPI: { symbol: 'OMXHPI', price: 12800, change: 35, changePercent: 0.27 },
            marketStatus: { isOpen: false, status: 'CLOSED', exchange: 'XHEL' },
            lastUpdate: new Date().toISOString(),
            source: 'DEFAULT'
        };
    }

    // Public utility methods
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Market data cache cleared');
    }

    getApiStatus() {
        return this.apis.map(api => ({
            name: api.name,
            available: api.isAvailable(),
            errorCount: api.errorCount,
            successCount: api.successCount,
            avgResponseTime: api.avgResponseTime
        }));
    }

    getRateLimitStatus() {
        return this.rateLimiter.getStatus();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketDataService;
} else if (typeof window !== 'undefined') {
    window.MarketDataService = MarketDataService;
}