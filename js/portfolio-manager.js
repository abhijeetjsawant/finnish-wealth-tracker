/**
 * Finnish Wealth Tracker - Portfolio Manager
 * Real-time portfolio tracking with P&L calculations and rebalancing
 */

class PortfolioManager {
    constructor(marketDataService) {
        this.marketDataService = marketDataService;
        this.portfolioData = null;
        this.performanceMetrics = {};
        this.rebalancingThreshold = 0.05; // 5% deviation triggers rebalancing suggestion
        
        // Performance tracking
        this.trackingStartDate = null;
        this.historicalPerformance = [];
        
        // Finnish tax considerations
        this.taxSettings = {
            capitalGainsRate: 0.30, // 30% capital gains tax in Finland
            ostTaxFree: true,
            aotTaxable: true
        };

        this.loadPortfolioData();
        this.initializeTracking();
    }

    /**
     * Load portfolio data from storage
     */
    loadPortfolioData() {
        try {
            const stored = localStorage.getItem('portfolioData');
            this.portfolioData = stored ? JSON.parse(stored) : this.getDefaultPortfolio();
            
            if (!this.portfolioData.metadata) {
                this.portfolioData.metadata = {
                    createdAt: Date.now(),
                    lastUpdated: Date.now(),
                    totalContributions: this.calculateTotalContributions(),
                    trackingStartDate: Date.now()
                };
            }
            
            console.log('📊 Portfolio data loaded:', this.portfolioData);
        } catch (error) {
            console.warn('⚠️ Failed to load portfolio data, using defaults');
            this.portfolioData = this.getDefaultPortfolio();
        }
    }

    /**
     * Get default portfolio structure
     */
    getDefaultPortfolio() {
        return {
            ostInvestments: [
                {
                    symbol: 'VWCE',
                    name: 'Vanguard FTSE All-World',
                    type: 'etf',
                    shares: 150,
                    avgPrice: 100,
                    totalInvested: 15000,
                    purchaseDate: '2024-01-15',
                    targetAllocation: 0.15 // 15% of total portfolio
                },
                {
                    symbol: 'MSFT',
                    name: 'Microsoft Corporation',
                    type: 'stock',
                    shares: 25,
                    avgPrice: 300,
                    totalInvested: 7500,
                    purchaseDate: '2024-02-01',
                    targetAllocation: 0.075 // 7.5% of total portfolio
                }
            ],
            aotInvestments: [
                {
                    symbol: 'VTI',
                    name: 'Vanguard Total Stock Market',
                    type: 'etf',
                    shares: 200,
                    avgPrice: 225,
                    totalInvested: 45000,
                    purchaseDate: '2024-01-01',
                    targetAllocation: 0.45 // 45% of total portfolio
                },
                {
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    type: 'stock',
                    shares: 100,
                    avgPrice: 250,
                    totalInvested: 25000,
                    purchaseDate: '2024-01-20',
                    targetAllocation: 0.25 // 25% of total portfolio
                },
                {
                    symbol: 'GOOGL',
                    name: 'Alphabet Inc.',
                    type: 'stock',
                    shares: 60,
                    avgPrice: 300,
                    totalInvested: 18000,
                    purchaseDate: '2024-02-15',
                    targetAllocation: 0.075 // 7.5% of total portfolio
                }
            ],
            metadata: {
                createdAt: Date.now(),
                lastUpdated: Date.now(),
                totalContributions: 110500,
                trackingStartDate: Date.now()
            }
        };
    }

    /**
     * Calculate total contributions across all investments
     */
    calculateTotalContributions() {
        const ostTotal = this.portfolioData.ostInvestments.reduce((sum, inv) => sum + inv.totalInvested, 0);
        const aotTotal = this.portfolioData.aotInvestments.reduce((sum, inv) => sum + inv.totalInvested, 0);
        return ostTotal + aotTotal;
    }

    /**
     * Initialize performance tracking
     */
    initializeTracking() {
        this.trackingStartDate = this.portfolioData.metadata.trackingStartDate || Date.now();
        this.loadHistoricalPerformance();
    }

    /**
     * Load historical performance data
     */
    loadHistoricalPerformance() {
        try {
            const stored = localStorage.getItem('portfolioPerformanceHistory');
            this.historicalPerformance = stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.warn('⚠️ Failed to load performance history');
            this.historicalPerformance = [];
        }
    }

    /**
     * Save performance snapshot
     */
    savePerformanceSnapshot(metrics) {
        this.historicalPerformance.push({
            timestamp: Date.now(),
            date: new Date().toISOString().split('T')[0],
            ...metrics
        });

        // Keep only last 365 days
        const oneYearAgo = Date.now() - (365 * 24 * 60 * 60 * 1000);
        this.historicalPerformance = this.historicalPerformance.filter(
            snapshot => snapshot.timestamp > oneYearAgo
        );

        // Save to storage
        try {
            localStorage.setItem('portfolioPerformanceHistory', JSON.stringify(this.historicalPerformance));
        } catch (error) {
            console.warn('⚠️ Failed to save performance history');
        }
    }

    /**
     * Get real-time portfolio performance with live market data
     */
    async getRealTimePerformance() {
        if (!this.marketDataService) {
            throw new Error('Market data service not available');
        }

        try {
            console.log('📊 Calculating real-time portfolio performance...');

            // Get all symbols
            const allInvestments = [...this.portfolioData.ostInvestments, ...this.portfolioData.aotInvestments];
            const symbols = [...new Set(allInvestments.map(inv => inv.symbol))];

            // Fetch current prices
            const currentPrices = await this.marketDataService.getPrices(symbols);

            // Calculate performance for each investment
            const ostPerformance = await this.calculateAccountPerformance(
                this.portfolioData.ostInvestments, 
                currentPrices, 
                'OST'
            );
            
            const aotPerformance = await this.calculateAccountPerformance(
                this.portfolioData.aotInvestments, 
                currentPrices, 
                'AOT'
            );

            // Calculate total portfolio metrics
            const totalCurrentValue = ostPerformance.currentValue + aotPerformance.currentValue;
            const totalInvested = ostPerformance.totalInvested + aotPerformance.totalInvested;
            const totalGainLoss = totalCurrentValue - totalInvested;
            const totalReturnPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

            // Calculate tax implications
            const taxImplications = this.calculateTaxImplications(ostPerformance, aotPerformance);

            // Calculate allocation drift
            const allocationDrift = this.calculateAllocationDrift(allInvestments, currentPrices, totalCurrentValue);

            // Build comprehensive performance object
            const performance = {
                timestamp: Date.now(),
                ostAccount: ostPerformance,
                aotAccount: aotPerformance,
                total: {
                    currentValue: totalCurrentValue,
                    totalInvested: totalInvested,
                    gainLoss: totalGainLoss,
                    returnPercent: totalReturnPercent,
                    dayChange: ostPerformance.dayChange + aotPerformance.dayChange,
                    dayChangePercent: totalCurrentValue > 0 ? 
                        ((ostPerformance.dayChange + aotPerformance.dayChange) / totalCurrentValue) * 100 : 0
                },
                taxImplications,
                allocationDrift,
                rebalancingNeeded: allocationDrift.maxDrift > this.rebalancingThreshold,
                lastUpdated: new Date().toISOString()
            };

            // Save performance snapshot
            this.savePerformanceSnapshot({
                totalValue: totalCurrentValue,
                totalInvested: totalInvested,
                gainLoss: totalGainLoss,
                returnPercent: totalReturnPercent
            });

            this.performanceMetrics = performance;
            console.log('✅ Real-time performance calculated successfully');
            
            return performance;

        } catch (error) {
            console.error('❌ Failed to calculate real-time performance:', error);
            throw error;
        }
    }

    /**
     * Calculate performance for a specific account (OST or AOT)
     */
    async calculateAccountPerformance(investments, currentPrices, accountType) {
        let currentValue = 0;
        let totalInvested = 0;
        let dayChange = 0;
        const holdings = [];

        for (const investment of investments) {
            const priceData = currentPrices[investment.symbol];
            
            if (priceData && priceData.price) {
                const marketValue = investment.shares * priceData.price;
                const gainLoss = marketValue - investment.totalInvested;
                const returnPercent = investment.totalInvested > 0 ? (gainLoss / investment.totalInvested) * 100 : 0;
                const dayChangeAmount = investment.shares * (priceData.change || 0);

                currentValue += marketValue;
                totalInvested += investment.totalInvested;
                dayChange += dayChangeAmount;

                holdings.push({
                    ...investment,
                    currentPrice: priceData.price,
                    currentValue: marketValue,
                    gainLoss: gainLoss,
                    returnPercent: returnPercent,
                    dayChange: dayChangeAmount,
                    priceChange: priceData.change || 0,
                    priceChangePercent: priceData.changePercent || 0,
                    source: priceData.source
                });
            } else {
                // Fallback to last known values
                const estimatedValue = investment.shares * investment.avgPrice;
                currentValue += estimatedValue;
                totalInvested += investment.totalInvested;

                holdings.push({
                    ...investment,
                    currentPrice: investment.avgPrice,
                    currentValue: estimatedValue,
                    gainLoss: estimatedValue - investment.totalInvested,
                    returnPercent: 0,
                    dayChange: 0,
                    priceChange: 0,
                    priceChangePercent: 0,
                    source: 'ESTIMATED'
                });
            }
        }

        const totalGainLoss = currentValue - totalInvested;
        const totalReturnPercent = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

        return {
            accountType,
            currentValue,
            totalInvested,
            gainLoss: totalGainLoss,
            returnPercent: totalReturnPercent,
            dayChange,
            dayChangePercent: currentValue > 0 ? (dayChange / currentValue) * 100 : 0,
            holdings
        };
    }

    /**
     * Calculate tax implications for Finnish investors
     */
    calculateTaxImplications(ostPerformance, aotPerformance) {
        // OST (Osakesäästötili) - Tax-free up to annual limit
        const ostTaxLiability = 0; // OST gains are tax-free

        // AOT (Regular taxable account) - 30% capital gains tax
        const aotRealizedGains = 0; // Would need transaction history for realized gains
        const aotUnrealizedGains = Math.max(0, aotPerformance.gainLoss);
        const aotPotentialTax = aotUnrealizedGains * this.taxSettings.capitalGainsRate;

        return {
            ostAccount: {
                gains: ostPerformance.gainLoss,
                taxLiability: ostTaxLiability,
                taxRate: 0
            },
            aotAccount: {
                unrealizedGains: aotUnrealizedGains,
                potentialTaxLiability: aotPotentialTax,
                taxRate: this.taxSettings.capitalGainsRate
            },
            totalPotentialTax: aotPotentialTax,
            taxEfficiency: {
                ostUtilization: (ostPerformance.currentValue / 50000) * 100, // Assuming 50k OST limit
                recommendation: aotPotentialTax > 1000 ? 
                    'Consider tax-loss harvesting or increasing OST allocation' : 
                    'Tax position looks optimal'
            }
        };
    }

    /**
     * Calculate allocation drift from target allocations
     */
    calculateAllocationDrift(investments, currentPrices, totalValue) {
        const drifts = [];
        let maxDrift = 0;

        for (const investment of investments) {
            const priceData = currentPrices[investment.symbol];
            const currentPrice = priceData ? priceData.price : investment.avgPrice;
            const currentValue = investment.shares * currentPrice;
            const currentAllocation = totalValue > 0 ? currentValue / totalValue : 0;
            const targetAllocation = investment.targetAllocation || 0;
            const drift = Math.abs(currentAllocation - targetAllocation);
            
            maxDrift = Math.max(maxDrift, drift);

            drifts.push({
                symbol: investment.symbol,
                name: investment.name,
                currentAllocation: currentAllocation * 100,
                targetAllocation: targetAllocation * 100,
                drift: drift * 100,
                currentValue: currentValue,
                needsRebalancing: drift > this.rebalancingThreshold
            });
        }

        return {
            maxDrift,
            drifts,
            needsRebalancing: maxDrift > this.rebalancingThreshold
        };
    }

    /**
     * Generate rebalancing recommendations
     */
    generateRebalancingRecommendations(performance) {
        if (!performance.rebalancingNeeded) {
            return {
                needed: false,
                message: 'Portfolio allocation is within target ranges'
            };
        }

        const recommendations = [];
        const totalValue = performance.total.currentValue;

        performance.allocationDrift.drifts.forEach(holding => {
            if (holding.needsRebalancing) {
                const targetValue = totalValue * (holding.targetAllocation / 100);
                const difference = holding.currentValue - targetValue;

                if (difference > 0) {
                    recommendations.push({
                        action: 'SELL',
                        symbol: holding.symbol,
                        name: holding.name,
                        amount: Math.abs(difference),
                        reason: `Overweight by €${Math.abs(difference).toLocaleString()}`
                    });
                } else {
                    recommendations.push({
                        action: 'BUY',
                        symbol: holding.symbol,
                        name: holding.name,
                        amount: Math.abs(difference),
                        reason: `Underweight by €${Math.abs(difference).toLocaleString()}`
                    });
                }
            }
        });

        return {
            needed: true,
            recommendations,
            totalRebalanceAmount: recommendations.reduce((sum, rec) => sum + rec.amount, 0) / 2,
            priority: performance.allocationDrift.maxDrift > 0.1 ? 'HIGH' : 'MEDIUM'
        };
    }

    /**
     * Get portfolio performance over time
     */
    getPerformanceHistory(timeframe = '1M') {
        const now = Date.now();
        let startTime;

        switch (timeframe) {
            case '1W':
                startTime = now - (7 * 24 * 60 * 60 * 1000);
                break;
            case '1M':
                startTime = now - (30 * 24 * 60 * 60 * 1000);
                break;
            case '3M':
                startTime = now - (90 * 24 * 60 * 60 * 1000);
                break;
            case '1Y':
                startTime = now - (365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startTime = this.trackingStartDate;
        }

        return this.historicalPerformance.filter(snapshot => snapshot.timestamp >= startTime);
    }

    /**
     * Calculate performance metrics vs benchmarks
     */
    async calculateBenchmarkComparison() {
        try {
            // Get benchmark data (MSCI World, OMX Helsinki)
            const benchmarks = await this.marketDataService.getPrices(['IWDA', 'OMXH25']);
            
            // This would require historical benchmark data for proper comparison
            // For now, return placeholder data
            return {
                vsWorld: {
                    portfolio: this.performanceMetrics.total.returnPercent,
                    benchmark: 8.5, // Placeholder
                    alpha: this.performanceMetrics.total.returnPercent - 8.5
                },
                vsFinnish: {
                    portfolio: this.performanceMetrics.total.returnPercent,
                    benchmark: 6.2, // Placeholder
                    alpha: this.performanceMetrics.total.returnPercent - 6.2
                }
            };
        } catch (error) {
            console.warn('⚠️ Benchmark comparison unavailable:', error);
            return null;
        }
    }

    /**
     * Save portfolio data to storage
     */
    savePortfolioData() {
        try {
            this.portfolioData.metadata.lastUpdated = Date.now();
            localStorage.setItem('portfolioData', JSON.stringify(this.portfolioData));
            console.log('💾 Portfolio data saved successfully');
        } catch (error) {
            console.error('❌ Failed to save portfolio data:', error);
        }
    }

    /**
     * Add new investment to portfolio
     */
    addInvestment(accountType, investment) {
        const account = accountType === 'OST' ? this.portfolioData.ostInvestments : this.portfolioData.aotInvestments;
        
        // Check if investment already exists
        const existingIndex = account.findIndex(inv => inv.symbol === investment.symbol);
        
        if (existingIndex >= 0) {
            // Update existing investment (average cost)
            const existing = account[existingIndex];
            const totalShares = existing.shares + investment.shares;
            const totalInvested = existing.totalInvested + investment.totalInvested;
            
            account[existingIndex] = {
                ...existing,
                shares: totalShares,
                avgPrice: totalInvested / totalShares,
                totalInvested: totalInvested,
                lastUpdated: Date.now()
            };
        } else {
            // Add new investment
            account.push({
                ...investment,
                addedAt: Date.now()
            });
        }

        this.savePortfolioData();
    }

    /**
     * Get portfolio summary
     */
    getPortfolioSummary() {
        return {
            totalInvestments: this.portfolioData.ostInvestments.length + this.portfolioData.aotInvestments.length,
            ostInvestments: this.portfolioData.ostInvestments.length,
            aotInvestments: this.portfolioData.aotInvestments.length,
            totalContributions: this.calculateTotalContributions(),
            trackingSince: new Date(this.trackingStartDate).toLocaleDateString(),
            lastUpdated: new Date(this.portfolioData.metadata.lastUpdated).toLocaleDateString()
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortfolioManager;
} else if (typeof window !== 'undefined') {
    window.PortfolioManager = PortfolioManager;
}