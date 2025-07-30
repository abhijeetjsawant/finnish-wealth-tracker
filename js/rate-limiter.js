/**
 * Finnish Wealth Tracker - Rate Limiter
 * Intelligent rate limiting for API requests with burst handling
 */

class RateLimiter {
    constructor() {
        // Rate limiting configuration
        this.config = {
            maxRequestsPerMinute: 60,
            maxRequestsPerHour: 1000,
            burstLimit: 10, // Allow bursts of requests
            burstWindowMs: 5000, // 5 second burst window
            cooldownMs: 60000 // 1 minute cooldown after hitting limits
        };

        // Request tracking
        this.requests = [];
        this.hourlyRequests = [];
        this.burstRequests = [];
        this.lastRequest = 0;
        this.cooldownUntil = 0;

        // Statistics
        this.stats = {
            totalRequests: 0,
            blockedRequests: 0,
            burstBlocked: 0,
            hourlyBlocked: 0
        };
    }

    /**
     * Check if a new request can be made
     * @returns {boolean} True if request is allowed
     */
    canMakeRequest() {
        const now = Date.now();

        // Check if we're in cooldown period
        if (now < this.cooldownUntil) {
            console.log(`⏳ Rate limit cooldown active for ${Math.round((this.cooldownUntil - now) / 1000)}s`);
            this.stats.blockedRequests++;
            return false;
        }

        // Clean old requests
        this.cleanupOldRequests(now);

        // Check burst limit (short-term)
        if (this.burstRequests.length >= this.config.burstLimit) {
            console.log(`🚫 Burst limit reached (${this.config.burstLimit} requests in 5s)`);
            this.stats.burstBlocked++;
            this.stats.blockedRequests++;
            return false;
        }

        // Check per-minute limit
        if (this.requests.length >= this.config.maxRequestsPerMinute) {
            console.log(`🚫 Per-minute limit reached (${this.config.maxRequestsPerMinute} RPM)`);
            this.stats.blockedRequests++;
            this.enterCooldown(now);
            return false;
        }

        // Check per-hour limit
        if (this.hourlyRequests.length >= this.config.maxRequestsPerHour) {
            console.log(`🚫 Hourly limit reached (${this.config.maxRequestsPerHour} RPH)`);
            this.stats.hourlyBlocked++;
            this.stats.blockedRequests++;
            this.enterCooldown(now);
            return false;
        }

        return true;
    }

    /**
     * Record a successful request
     */
    recordRequest() {
        const now = Date.now();
        
        this.requests.push(now);
        this.hourlyRequests.push(now);
        this.burstRequests.push(now);
        this.lastRequest = now;
        this.stats.totalRequests++;

        console.log(`📊 API request recorded (${this.requests.length}/min, ${this.hourlyRequests.length}/hour)`);
    }

    /**
     * Clean up old request records
     * @param {number} now - Current timestamp
     */
    cleanupOldRequests(now) {
        const oneMinuteAgo = now - 60000;
        const oneHourAgo = now - 3600000;
        const burstWindowAgo = now - this.config.burstWindowMs;

        // Clean minute requests (older than 1 minute)
        this.requests = this.requests.filter(time => time > oneMinuteAgo);
        
        // Clean hourly requests (older than 1 hour)
        this.hourlyRequests = this.hourlyRequests.filter(time => time > oneHourAgo);
        
        // Clean burst requests (older than burst window)
        this.burstRequests = this.burstRequests.filter(time => time > burstWindowAgo);
    }

    /**
     * Enter cooldown mode after hitting limits
     * @param {number} now - Current timestamp
     */
    enterCooldown(now) {
        this.cooldownUntil = now + this.config.cooldownMs;
        console.log(`❄️ Entering cooldown for ${this.config.cooldownMs / 1000}s`);
    }

    /**
     * Get current rate limiter status
     * @returns {Object} Current status and statistics
     */
    getStatus() {
        const now = Date.now();
        this.cleanupOldRequests(now);

        return {
            canMakeRequest: this.canMakeRequest(),
            requestsThisMinute: this.requests.length,
            requestsThisHour: this.hourlyRequests.length,
            burstRequests: this.burstRequests.length,
            inCooldown: now < this.cooldownUntil,
            cooldownRemaining: Math.max(0, this.cooldownUntil - now),
            stats: { ...this.stats },
            limits: {
                perMinute: this.config.maxRequestsPerMinute,
                perHour: this.config.maxRequestsPerHour,
                burst: this.config.burstLimit
            },
            usage: {
                minutePercent: Math.round((this.requests.length / this.config.maxRequestsPerMinute) * 100),
                hourPercent: Math.round((this.hourlyRequests.length / this.config.maxRequestsPerHour) * 100),
                burstPercent: Math.round((this.burstRequests.length / this.config.burstLimit) * 100)
            }
        };
    }

    /**
     * Calculate optimal delay before next request
     * @returns {number} Recommended delay in milliseconds
     */
    getOptimalDelay() {
        if (!this.canMakeRequest()) {
            const now = Date.now();
            
            // If in cooldown, return remaining cooldown time
            if (now < this.cooldownUntil) {
                return this.cooldownUntil - now;
            }

            // If burst limit hit, wait for burst window
            if (this.burstRequests.length >= this.config.burstLimit) {
                const oldestBurst = Math.min(...this.burstRequests);
                return Math.max(0, (oldestBurst + this.config.burstWindowMs) - now);
            }

            // If minute limit hit, wait for oldest request to expire
            if (this.requests.length >= this.config.maxRequestsPerMinute) {
                const oldestRequest = Math.min(...this.requests);
                return Math.max(0, (oldestRequest + 60000) - now);
            }
        }

        // Calculate smooth spacing for optimal API usage
        const requestsInWindow = this.requests.length;
        if (requestsInWindow === 0) return 0;

        const targetSpacing = 60000 / this.config.maxRequestsPerMinute; // Ideal spacing
        const timeSinceLastRequest = Date.now() - this.lastRequest;
        
        return Math.max(0, targetSpacing - timeSinceLastRequest);
    }

    /**
     * Reset rate limiter (useful for testing or admin functions)
     */
    reset() {
        this.requests = [];
        this.hourlyRequests = [];
        this.burstRequests = [];
        this.lastRequest = 0;
        this.cooldownUntil = 0;
        
        console.log('🔄 Rate limiter reset');
    }

    /**
     * Update rate limiting configuration
     * @param {Object} newConfig - New configuration options
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('⚙️ Rate limiter config updated:', newConfig);
    }

    /**
     * Get efficiency report
     * @returns {Object} Efficiency metrics
     */
    getEfficiencyReport() {
        const now = Date.now();
        const uptime = now - (this.stats.totalRequests > 0 ? Math.min(...this.hourlyRequests) : now);
        
        return {
            uptime: Math.round(uptime / 1000), // seconds
            totalRequests: this.stats.totalRequests,
            successRate: this.stats.totalRequests > 0 ? 
                ((this.stats.totalRequests - this.stats.blockedRequests) / this.stats.totalRequests * 100).toFixed(1) + '%' : 
                '100%',
            averageRPM: uptime > 0 ? Math.round((this.stats.totalRequests / uptime) * 60000) : 0,
            blockedRequests: this.stats.blockedRequests,
            burstBlocked: this.stats.burstBlocked,
            hourlyBlocked: this.stats.hourlyBlocked
        };
    }

    /**
     * Smart delay function that waits optimal time before allowing request
     * @returns {Promise} Resolves when it's safe to make request
     */
    async waitForSlot() {
        const delay = this.getOptimalDelay();
        if (delay > 0) {
            console.log(`⏱️ Waiting ${delay}ms for optimal API timing`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RateLimiter;
} else if (typeof window !== 'undefined') {
    window.RateLimiter = RateLimiter;
}