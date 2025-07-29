// State Management Module - Single source of truth for portfolio data

// Enhanced portfolio structure with account type separation
let portfolio = {
    accounts: {
        aot: {  // Arvo-osuustili (Regular Trading Account)
            stocks: [],
            mutualFunds: [],
            fixedDeposits: [],
            otherAssets: []
        },
        ost: {  // Osakesäästötili (Equity Savings Account) 
            stocks: [],
            mutualFunds: [],
            currentValue: 0,
            totalDeposited: 0  // Track OST deposits (max €50k)
        }
    },
    // Keep legacy structure for backward compatibility during migration
    stocks: [],
    mutualFunds: [],
    fixedDeposits: [],
    otherAssets: []
};

// OST account limits and rules
const OST_RULES = {
    maxDeposit: 50000,  // Maximum lifetime deposit
    eligibleAssets: ['stocks', 'mutualFunds'],  // Only equities allowed
    taxDeferred: true,  // No tax on trades within OST
    withdrawalTax: true  // Tax paid on withdrawal gains
};

/**
 * Load portfolio from localStorage
 */
function loadPortfolio() {
    const saved = localStorage.getItem('portfolio');
    if (saved) {
        const parsed = JSON.parse(saved);
        
        // Check if it's the old format (no accounts structure)
        if (!parsed.accounts) {
            // Migrate from old format
            portfolio = migrateToNewFormat(parsed);
            savePortfolio(); // Save migrated data
        } else {
            portfolio = parsed;
        }
    }
    return portfolio;
}

/**
 * Save portfolio to localStorage
 */
function savePortfolio() {
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
}

/**
 * Get the current portfolio state
 */
function getPortfolio() {
    return portfolio;
}

/**
 * Add investment to specific account
 * @param {string} accountType - 'aot' or 'ost'
 * @param {string} assetType - 'stocks', 'mutualFunds', etc.
 * @param {Object} investment - Investment object
 */
function addInvestment(accountType, assetType, investment) {
    if (!portfolio.accounts[accountType]) {
        throw new Error(`Invalid account type: ${accountType}`);
    }
    
    // Validate OST rules
    if (accountType === 'ost') {
        if (!OST_RULES.eligibleAssets.includes(assetType)) {
            throw new Error(`Asset type ${assetType} not eligible for OST account`);
        }
        
        const investmentValue = calculateInvestmentValue(investment, assetType);
        if (portfolio.accounts.ost.totalDeposited + investmentValue > OST_RULES.maxDeposit) {
            throw new Error(`Investment would exceed OST deposit limit of €${OST_RULES.maxDeposit}`);
        }
        
        portfolio.accounts.ost.totalDeposited += investmentValue;
    }
    
    // Add to appropriate account and asset type
    if (!portfolio.accounts[accountType][assetType]) {
        portfolio.accounts[accountType][assetType] = [];
    }
    
    investment.id = investment.id || Date.now().toString();
    investment.accountType = accountType;
    
    portfolio.accounts[accountType][assetType].push(investment);
    
    // Also add to legacy structure for backward compatibility
    portfolio[assetType].push({...investment});
    
    savePortfolio();
}

/**
 * Update an existing investment
 */
function updateInvestment(accountType, assetType, investmentId, updates) {
    const account = portfolio.accounts[accountType];
    if (!account || !account[assetType]) {
        throw new Error(`Invalid account type or asset type`);
    }
    
    const index = account[assetType].findIndex(inv => inv.id === investmentId);
    if (index === -1) {
        throw new Error(`Investment not found`);
    }
    
    // Update in new structure
    account[assetType][index] = { ...account[assetType][index], ...updates };
    
    // Update in legacy structure
    const legacyIndex = portfolio[assetType].findIndex(inv => inv.id === investmentId);
    if (legacyIndex !== -1) {
        portfolio[assetType][legacyIndex] = { ...portfolio[assetType][legacyIndex], ...updates };
    }
    
    savePortfolio();
}

/**
 * Delete an investment
 */
function deleteInvestment(accountType, assetType, investmentId) {
    const account = portfolio.accounts[accountType];
    if (!account || !account[assetType]) {
        throw new Error(`Invalid account type or asset type`);
    }
    
    // Remove from new structure
    account[assetType] = account[assetType].filter(inv => inv.id !== investmentId);
    
    // Remove from legacy structure
    portfolio[assetType] = portfolio[assetType].filter(inv => inv.id !== investmentId);
    
    // Update OST deposit tracking if needed
    if (accountType === 'ost') {
        recalculateOSTDeposits();
    }
    
    savePortfolio();
}

/**
 * Get all investments across all accounts
 */
function getAllInvestments() {
    const all = {
        stocks: [],
        mutualFunds: [],
        fixedDeposits: [],
        otherAssets: []
    };
    
    // Aggregate from all accounts
    Object.values(portfolio.accounts).forEach(account => {
        Object.keys(all).forEach(assetType => {
            if (account[assetType]) {
                all[assetType].push(...account[assetType]);
            }
        });
    });
    
    return all;
}

/**
 * Get OST account status
 */
function getOSTStatus() {
    const ost = portfolio.accounts.ost;
    const totalValue = calculateAccountValue(ost);
    const totalGains = totalValue - ost.totalDeposited;
    const utilizationPercent = (ost.totalDeposited / OST_RULES.maxDeposit) * 100;
    const remainingDeposit = OST_RULES.maxDeposit - ost.totalDeposited;
    
    return {
        totalDeposited: ost.totalDeposited,
        currentValue: totalValue,
        unrealizedGains: totalGains,
        utilizationPercent,
        remainingDeposit,
        maxDeposit: OST_RULES.maxDeposit
    };
}

// Helper functions

function migrateToNewFormat(oldPortfolio) {
    // Create new format with all assets in AOT by default
    const newFormat = {
        accounts: {
            aot: {
                stocks: oldPortfolio.stocks || [],
                mutualFunds: oldPortfolio.mutualFunds || [],
                fixedDeposits: oldPortfolio.fixedDeposits || [],
                otherAssets: oldPortfolio.otherAssets || []
            },
            ost: {
                stocks: [],
                mutualFunds: [],
                currentValue: 0,
                totalDeposited: 0
            }
        },
        // Keep legacy structure for compatibility
        stocks: oldPortfolio.stocks || [],
        mutualFunds: oldPortfolio.mutualFunds || [],
        fixedDeposits: oldPortfolio.fixedDeposits || [],
        otherAssets: oldPortfolio.otherAssets || []
    };
    
    // Mark all migrated assets as AOT
    Object.values(newFormat.accounts.aot).forEach(assetArray => {
        assetArray.forEach(asset => {
            asset.accountType = 'aot';
        });
    });
    
    return newFormat;
}

function calculateInvestmentValue(investment, assetType) {
    switch (assetType) {
        case 'stocks':
            return investment.quantity * investment.buyPrice;
        case 'mutualFunds':
            return investment.units * investment.buyNAV;
        case 'fixedDeposits':
            return investment.principal;
        case 'otherAssets':
            return investment.purchasePrice;
        default:
            return 0;
    }
}

function calculateAccountValue(account) {
    let totalValue = 0;
    
    account.stocks?.forEach(stock => {
        totalValue += stock.quantity * stock.currentPrice;
    });
    
    account.mutualFunds?.forEach(fund => {
        totalValue += fund.units * fund.currentNAV;
    });
    
    account.fixedDeposits?.forEach(fd => {
        // Import calculateMaturityValue from calculator.js
        const maturityValue = calculateMaturityValue(fd);
        totalValue += maturityValue;
    });
    
    account.otherAssets?.forEach(asset => {
        totalValue += asset.currentValue;
    });
    
    return totalValue;
}

function calculateMaturityValue(fd) {
    const startDate = new Date(fd.startDate);
    const maturityDate = new Date(fd.maturityDate);
    const daysElapsed = Math.max(0, (new Date() - startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.max(1, (maturityDate - startDate) / (1000 * 60 * 60 * 24));
    
    const totalInterest = fd.principal * (fd.interestRate / 100) * (totalDays / 365);
    const earnedInterest = totalInterest * Math.min(1, daysElapsed / totalDays);
    
    return fd.principal + earnedInterest;
}

function recalculateOSTDeposits() {
    const ost = portfolio.accounts.ost;
    let totalDeposited = 0;
    
    ost.stocks?.forEach(stock => {
        totalDeposited += stock.quantity * stock.buyPrice;
    });
    
    ost.mutualFunds?.forEach(fund => {
        totalDeposited += fund.units * fund.buyNAV;
    });
    
    ost.totalDeposited = totalDeposited;
}