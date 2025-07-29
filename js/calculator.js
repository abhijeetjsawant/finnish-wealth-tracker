// Pure financial calculation functions for Finnish investors

/**
 * Calculate Finnish capital gains tax on REALIZED gains only
 * @param {number} realizedGains - Actual gains from sold assets
 * @returns {number} Tax amount in euros
 */
function calculateFinnishCapitalGainsTax(realizedGains) {
    if (realizedGains <= 0) {
        return 0;
    }
    
    const THRESHOLD = 30000;
    const TAX_RATE_LOW = 0.30;
    const TAX_RATE_HIGH = 0.34;
    
    if (realizedGains <= THRESHOLD) {
        return realizedGains * TAX_RATE_LOW;
    } else {
        return (THRESHOLD * TAX_RATE_LOW) + ((realizedGains - THRESHOLD) * TAX_RATE_HIGH);
    }
}

/**
 * Calculate POTENTIAL tax liability if all gains were realized today
 * This is for informational purposes only - not actual tax owed
 * @param {number} unrealizedGains - Paper gains from unsold assets
 * @returns {number} Potential tax liability
 */
function calculatePotentialTaxLiability(unrealizedGains) {
    if (unrealizedGains <= 0) {
        return 0;
    }
    return calculateFinnishCapitalGainsTax(unrealizedGains);
}

/**
 * Calculate total portfolio value and gains
 * @param {Object} portfolio - Portfolio object with all assets
 * @returns {Object} { totalValue, totalInvestment, unrealizedGains, byAccount }
 */
function calculatePortfolioMetrics(portfolio) {
    const metrics = {
        totalValue: 0,
        totalInvestment: 0,
        unrealizedGains: 0,
        byAccount: {
            aot: { value: 0, investment: 0, gains: 0 },
            ost: { value: 0, investment: 0, gains: 0 }
        }
    };
    
    // For now, assume all assets are in AOT (regular account)
    // In a real implementation, each asset would have an account type field
    
    // Calculate stocks
    portfolio.stocks?.forEach(stock => {
        const investment = stock.quantity * stock.buyPrice;
        const currentValue = stock.quantity * stock.currentPrice;
        
        metrics.totalInvestment += investment;
        metrics.totalValue += currentValue;
        metrics.byAccount.aot.investment += investment;
        metrics.byAccount.aot.value += currentValue;
    });
    
    // Calculate mutual funds/ETFs
    portfolio.mutualFunds?.forEach(fund => {
        const investment = fund.units * fund.buyNAV;
        const currentValue = fund.units * fund.currentNAV;
        
        metrics.totalInvestment += investment;
        metrics.totalValue += currentValue;
        metrics.byAccount.aot.investment += investment;
        metrics.byAccount.aot.value += currentValue;
    });
    
    // Calculate fixed deposits
    portfolio.fixedDeposits?.forEach(fd => {
        const maturityValue = calculateMaturityValue(fd);
        
        metrics.totalInvestment += fd.principal;
        metrics.totalValue += maturityValue;
        metrics.byAccount.aot.investment += fd.principal;
        metrics.byAccount.aot.value += maturityValue;
    });
    
    // Calculate other assets
    portfolio.otherAssets?.forEach(asset => {
        metrics.totalInvestment += asset.purchasePrice;
        metrics.totalValue += asset.currentValue;
        metrics.byAccount.aot.investment += asset.purchasePrice;
        metrics.byAccount.aot.value += asset.currentValue;
    });
    
    // Calculate gains
    metrics.unrealizedGains = metrics.totalValue - metrics.totalInvestment;
    metrics.byAccount.aot.gains = metrics.byAccount.aot.value - metrics.byAccount.aot.investment;
    metrics.byAccount.ost.gains = metrics.byAccount.ost.value - metrics.byAccount.ost.investment;
    
    return metrics;
}

/**
 * Calculate maturity value for fixed deposits
 * @param {Object} fd - Fixed deposit object
 * @returns {number} Maturity value
 */
function calculateMaturityValue(fd) {
    const startDate = new Date(fd.startDate);
    const maturityDate = new Date(fd.maturityDate);
    const daysElapsed = Math.max(0, (new Date() - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(1, (maturityDate - startDate) / (1000 * 60 * 60 * 24));
    
    // Simple interest calculation
    const totalInterest = fd.principal * (fd.interestRate / 100) * (totalDays / 365);
    const earnedInterest = totalInterest * Math.min(1, daysElapsed / totalDays);
    
    return fd.principal + earnedInterest;
}

/**
 * Calculate effective tax rate for display purposes
 * @param {number} gains - Total gains
 * @param {number} potentialTax - Potential tax liability
 * @returns {number} Effective tax rate as percentage
 */
function calculateEffectiveTaxRate(gains, potentialTax) {
    if (gains <= 0) return 0;
    return (potentialTax / gains) * 100;
}

/**
 * Determine wealth phase based on total portfolio value
 * @param {number} totalValue - Total portfolio value
 * @returns {Object} { phase, percent, title, description }
 */
function calculateWealthPhase(totalValue) {
    const phases = [
        {
            threshold: 50000,
            title: "Foundation Phase",
            description: "Focus: Emergency fund + OST account + Low-cost index funds"
        },
        {
            threshold: 200000,
            title: "Growth Phase",
            description: "Focus: Diversification + Tax optimization + Income growth"
        },
        {
            threshold: 500000,
            title: "Optimization Phase",
            description: "Focus: Geographic arbitrage planning + Alternative investments"
        },
        {
            threshold: Infinity,
            title: "Freedom Phase",
            description: "Focus: Wealth preservation + International diversification"
        }
    ];
    
    let phaseIndex = 0;
    let previousThreshold = 0;
    
    for (let i = 0; i < phases.length; i++) {
        if (totalValue < phases[i].threshold) {
            phaseIndex = i;
            break;
        }
        previousThreshold = phases[i].threshold;
    }
    
    const currentPhase = phases[phaseIndex];
    const phaseRange = currentPhase.threshold - previousThreshold;
    const progressInPhase = totalValue - previousThreshold;
    const percentInPhase = currentPhase.threshold === Infinity ? 100 : (progressInPhase / phaseRange) * 100;
    
    // Calculate overall progress (0-100%)
    const overallPercent = phaseIndex === 0 ? (totalValue / 50000) * 33 :
                          phaseIndex === 1 ? 33 + ((totalValue - 50000) / 150000) * 33 :
                          phaseIndex === 2 ? 66 + ((totalValue - 200000) / 300000) * 34 :
                          100;
    
    return {
        phase: phaseIndex + 1,
        percent: Math.min(100, overallPercent),
        title: currentPhase.title,
        description: currentPhase.description,
        nextThreshold: currentPhase.threshold === Infinity ? null : currentPhase.threshold,
        geoArbitrageReady: totalValue >= 200000
    };
}