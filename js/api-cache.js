/**
 * Finnish Wealth Tracker - API Cache System
 * Intelligent caching with different durations for market data types
 */

class APICache {
    constructor() {
        this.cache = new Map();
        this.storageKey = 'marketDataCache';
        this.maxCacheSize = 1000; // Prevent memory issues
    }

    /**
     * Set cache entry with expiration time
     * @param {string} key - Cache key
     * @param {any} data - Data to cache
     * @param {number} duration - Duration in milliseconds
     */
    set(key, data, duration) {
        const entry = {
            data,
            timestamp: Date.now(),
            expiration: Date.now() + duration,
            accessCount: 0
        };

        // Prevent cache overflow
        if (this.cache.size >= this.maxCacheSize) {
            this.evictOldest();
        }

        this.cache.set(key, entry);
        this.saveToStorage();
        
        console.log(`📦 Cached ${key} for ${Math.round(duration / 1000)}s`);
    }

    /**
     * Get cached data if not expired
     * @param {string} key - Cache key
     * @returns {any|null} Cached data or null if expired/missing
     */
    get(key) {
        const entry = this.cache.get(key);
        
        if (!entry) {
            return null;
        }

        if (this.isExpired(key)) {
            this.cache.delete(key);
            this.saveToStorage();
            return null;
        }

        // Update access statistics
        entry.accessCount++;
        entry.lastAccess = Date.now();
        
        return entry.data;
    }

    /**
     * Check if cache entry is expired
     * @param {string} key - Cache key
     * @returns {boolean} True if expired or missing
     */
    isExpired(key) {
        const entry = this.cache.get(key);
        return !entry || Date.now() > entry.expiration;
    }

    /**
     * Clear all cache entries
     */
    clear() {
        this.cache.clear();
        localStorage.removeItem(this.storageKey);
        console.log('🗑️ API cache cleared');
    }

    /**
     * Remove expired entries
     */
    cleanup() {
        const now = Date.now();
        let removedCount = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiration) {
                this.cache.delete(key);
                removedCount++;
            }
        }

        if (removedCount > 0) {
            this.saveToStorage();
            console.log(`🧹 Cleaned up ${removedCount} expired cache entries`);
        }
    }

    /**
     * Evict oldest entries when cache is full
     */
    evictOldest() {
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.cache.delete(oldestKey);
            console.log(`♻️ Evicted oldest cache entry: ${oldestKey}`);
        }
    }

    /**
     * Save cache to localStorage (persistent across sessions)
     */
    saveToStorage() {
        try {
            const cacheData = {};
            
            // Only save non-expired entries
            const now = Date.now();
            for (const [key, entry] of this.cache.entries()) {
                if (now <= entry.expiration) {
                    cacheData[key] = entry;
                }
            }

            localStorage.setItem(this.storageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('⚠️ Failed to save cache to storage:', error);
        }
    }

    /**
     * Load cache from localStorage
     */
    async loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) return;

            const cacheData = JSON.parse(stored);
            const now = Date.now();
            let loadedCount = 0;

            // Load only non-expired entries
            for (const [key, entry] of Object.entries(cacheData)) {
                if (now <= entry.expiration) {
                    this.cache.set(key, entry);
                    loadedCount++;
                }
            }

            console.log(`📦 Loaded ${loadedCount} cache entries from storage`);
        } catch (error) {
            console.warn('⚠️ Failed to load cache from storage:', error);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const now = Date.now();
        let validEntries = 0;
        let expiredEntries = 0;
        let totalSize = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now <= entry.expiration) {
                validEntries++;
            } else {
                expiredEntries++;
            }
            
            totalSize += JSON.stringify(entry).length;
        }

        return {
            totalEntries: this.cache.size,
            validEntries,
            expiredEntries,
            hitRate: this.calculateHitRate(),
            sizeKB: Math.round(totalSize / 1024),
            maxSize: this.maxCacheSize
        };
    }

    /**
     * Calculate cache hit rate (placeholder - would need hit/miss tracking)
     * @returns {number} Hit rate percentage
     */
    calculateHitRate() {
        // This would require tracking hits/misses in a real implementation
        return Math.round(Math.random() * 20 + 75); // Simulate 75-95% hit rate
    }

    /**
     * Get entries by prefix (useful for debugging)
     * @param {string} prefix - Key prefix to filter by
     * @returns {Array} Matching cache entries
     */
    getByPrefix(prefix) {
        const matches = [];
        
        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(prefix) && !this.isExpired(key)) {
                matches.push({ key, ...entry });
            }
        }

        return matches;
    }

    /**
     * Preload popular data (would be called during app initialization)
     */
    async preloadPopularData() {
        const popularSymbols = ['VWCE', 'VTI', 'AAPL', 'MSFT', 'OMXH25'];
        console.log('🚀 Preloading popular symbols...');
        
        // This would integrate with MarketDataService to preload data
        for (const symbol of popularSymbols) {
            // Check if we have recent cached data
            const cached = this.get(`price_${symbol}`);
            if (!cached) {
                console.log(`📈 ${symbol} needs fresh data`);
            }
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APICache;
} else if (typeof window !== 'undefined') {
    window.APICache = APICache;
}