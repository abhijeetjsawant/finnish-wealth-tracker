// Portfolio Management Functions - Now using centralized state

let editingId = null;
let editingType = null;
let editingAccountType = null;

// Initialize portfolio from state management
let portfolio = null;

function initPortfolio() {
    portfolio = loadPortfolio(); // From state.js
}

function updateDashboard() {
    // Get portfolio from state
    portfolio = getPortfolio();
    
    // Calculate metrics using calculator module
    const metrics = calculatePortfolioMetrics(portfolio);
    
    // Find best performer
    const bestPerformer = findBestPerformer();
    
    // Update UI using ui module
    updateDashboardUI(metrics, bestPerformer);
    
    // Update wealth phase
    const wealthPhase = calculateWealthPhase(metrics.totalValue);
    updateWealthPhaseUI(wealthPhase);
    
    // Update tax optimization
    const ostStatus = getOSTStatus();
    updateTaxOptimizationUI(metrics, ostStatus);
    
    // Update tax analytics
    updateTaxAnalyticsUI(metrics, ostStatus);
    
    // Update other UI components
    updateCharts();
    updateAssetSummary();
    updateAnalytics();
}

function findBestPerformer() {
    let bestPerformer = { name: '-', return: 0 };
    const allInvestments = getAllInvestments();
    
    // Check stocks
    allInvestments.stocks.forEach(stock => {
        const returnPercent = ((stock.quantity * stock.currentPrice - stock.quantity * stock.buyPrice) / 
                              (stock.quantity * stock.buyPrice)) * 100;
        if (returnPercent > bestPerformer.return) {
            bestPerformer = { name: stock.symbol, return: returnPercent };
        }
    });
    
    // Check mutual funds
    allInvestments.mutualFunds.forEach(mf => {
        const returnPercent = ((mf.units * mf.currentNAV - mf.units * mf.buyNAV) / 
                              (mf.units * mf.buyNAV)) * 100;
        if (returnPercent > bestPerformer.return) {
            bestPerformer = { name: mf.name, return: returnPercent };
        }
    });
    
    // Check other assets
    allInvestments.otherAssets.forEach(asset => {
        const returnPercent = ((asset.currentValue - asset.purchasePrice) / asset.purchasePrice) * 100;
        if (returnPercent > bestPerformer.return) {
            bestPerformer = { name: asset.name, return: returnPercent };
        }
    });
    
    return bestPerformer;
}

function updateAssetSummary() {
    const summary = calculateAssetSummary();
    updateAssetSummaryUI(summary);
}

function calculateAssetSummary() {
    const summary = {
        stocks: { count: 0, value: 0, investment: 0 },
        mutualFunds: { count: 0, value: 0, investment: 0 },
        fixedDeposits: { count: 0, value: 0, investment: 0 },
        otherAssets: { count: 0, value: 0, investment: 0 }
    };

    const allInvestments = getAllInvestments();
    
    allInvestments.stocks.forEach(stock => {
        summary.stocks.count++;
        summary.stocks.investment += stock.quantity * stock.buyPrice;
        summary.stocks.value += stock.quantity * stock.currentPrice;
    });

    allInvestments.mutualFunds.forEach(mf => {
        summary.mutualFunds.count++;
        summary.mutualFunds.investment += mf.units * mf.buyNAV;
        summary.mutualFunds.value += mf.units * mf.currentNAV;
    });

    allInvestments.fixedDeposits.forEach(fd => {
        summary.fixedDeposits.count++;
        summary.fixedDeposits.investment += fd.principal;
        summary.fixedDeposits.value += calculateMaturityValue(fd);
    });

    allInvestments.otherAssets.forEach(asset => {
        summary.otherAssets.count++;
        summary.otherAssets.investment += asset.purchasePrice;
        summary.otherAssets.value += asset.currentValue;
    });
    
    return summary;
}

function updateAnalytics() {
    let totalReturns = 0;
    let totalInvestment = 0;
    let riskScore = 0;
    let liquidAssets = 0;

    // Calculate returns and risk
    portfolio.stocks.forEach(stock => {
        const investment = stock.quantity * stock.buyPrice;
        const currentValue = stock.quantity * stock.currentPrice;
        totalReturns += currentValue - investment;
        totalInvestment += investment;
        liquidAssets += currentValue;
        riskScore += 3; // Stocks have higher risk
    });

    portfolio.mutualFunds.forEach(mf => {
        const investment = mf.units * mf.buyNAV;
        const currentValue = mf.units * mf.currentNAV;
        totalReturns += currentValue - investment;
        totalInvestment += investment;
        liquidAssets += currentValue;
        riskScore += mf.category.includes('Equity') ? 2.5 : 1.5;
    });

    portfolio.fixedDeposits.forEach(fd => {
        const maturityValue = calculateMaturityValue(fd);
        totalReturns += maturityValue - fd.principal;
        totalInvestment += fd.principal;
        riskScore += 0.5; // FDs have low risk
    });

    portfolio.otherAssets.forEach(asset => {
        totalReturns += asset.currentValue - asset.purchasePrice;
        totalInvestment += asset.purchasePrice;
        if (asset.type === 'gold' || asset.type === 'bonds') {
            liquidAssets += asset.currentValue;
            riskScore += 1;
        } else if (asset.type === 'crypto') {
            liquidAssets += asset.currentValue;
            riskScore += 4;
        } else {
            riskScore += 2;
        }
    });

    const avgReturn = totalInvestment > 0 ? (totalReturns / totalInvestment) * 100 : 0;
    const totalAssets = portfolio.stocks.length + portfolio.mutualFunds.length + 
                      portfolio.fixedDeposits.length + portfolio.otherAssets.length;
    const avgRisk = totalAssets > 0 ? riskScore / totalAssets : 0;
    const liquidityRatio = totalInvestment > 0 ? (liquidAssets / (totalInvestment + totalReturns)) * 100 : 0;

    // Calculate diversification score
    const assetTypes = new Set();
    if (portfolio.stocks.length > 0) assetTypes.add('stocks');
    if (portfolio.mutualFunds.length > 0) assetTypes.add('mutualFunds');
    if (portfolio.fixedDeposits.length > 0) assetTypes.add('fixedDeposits');
    portfolio.otherAssets.forEach(asset => assetTypes.add(asset.type));
    const diversificationScore = Math.min(assetTypes.size * 2, 10);

    document.getElementById('avgReturn').textContent = avgReturn.toFixed(2) + '%';
    document.getElementById('riskScore').textContent = avgRisk < 1.5 ? 'Low' : avgRisk < 2.5 ? 'Medium' : 'High';
    document.getElementById('diversificationScore').textContent = diversificationScore + '/10';
    document.getElementById('liquidityRatio').textContent = liquidityRatio.toFixed(1) + '%';
}

function saveInvestment(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const accountType = document.getElementById('accountType').value;
    const investmentType = document.getElementById('investmentType').value;
    
    if (!accountType) {
        showError('Please select an account type');
        return;
    }
    
    const investment = { id: editingId || Date.now().toString() };
    
    // Parse form data
    for (let [key, value] of formData.entries()) {
        if (key !== 'investmentType' && key !== 'accountType') {
            // Handle different input types properly
            if (key.includes('Date')) {
                // Keep date fields as strings
                investment[key] = value;
            } else if (value.includes('.') || key.includes('Price') || key.includes('NAV') || key.includes('Rate') || key === 'principal' || key === 'currentValue' || key === 'purchasePrice') {
                // Parse as float for decimal values
                investment[key] = parseFloat(value);
            } else if (!isNaN(value) && value !== '') {
                // Parse as integer for whole numbers
                investment[key] = parseInt(value);
            } else {
                // Keep as string for text values
                investment[key] = value;
            }
        }
    }
    
    try {
        // Map investment type to asset type
        let assetType;
        switch(investmentType) {
            case 'stock':
                assetType = 'stocks';
                break;
            case 'mutual-fund':
                assetType = 'mutualFunds';
                break;
            case 'fixed-deposit':
                assetType = 'fixedDeposits';
                break;
            default:
                assetType = 'otherAssets';
                investment.type = investmentType;
                
                // Special handling for Indian FD
                if (investmentType === 'indian-fd') {
                    // Convert INR to EUR for storage
                    const principalEUR = investment.principalINR / investment.exchangeRate;
                    investment.principal = principalEUR;
                    investment.purchasePrice = principalEUR;
                    
                    // Calculate maturity value with tax
                    const fdReturns = calculateIndianFDReturns(
                        investment.principalINR,
                        investment.interestRate / 100,
                        investment.tenure,
                        investment.exchangeRate
                    );
                    
                    investment.currentValue = principalEUR + fdReturns.netReturnsEUR;
                    investment.taxInfo = fdReturns;
                }
        }
        
        if (editingId) {
            // Update existing investment
            updateInvestment(editingAccountType, assetType, editingId, investment);
        } else {
            // Add new investment
            addInvestment(accountType, assetType, investment);
        }
        
        showSuccess('Investment saved successfully!');
        closeModal();
        updateDashboard();
        renderAllTables();
        trackBehavior('investment_saved');
        
    } catch (error) {
        showError(error.message);
    }
}

function editInvestment(type, id, accountType) {
    editingId = id;
    editingType = type;
    editingAccountType = accountType || 'aot'; // Default to AOT for backward compatibility
    
    // Find investment in the appropriate account
    let investment;
    const allInvestments = getAllInvestments();
    
    switch(type) {
        case 'stock':
            investment = allInvestments.stocks.find(s => s.id === id);
            break;
        case 'mutual-fund':
            investment = allInvestments.mutualFunds.find(mf => mf.id === id);
            break;
        case 'fixed-deposit':
            investment = allInvestments.fixedDeposits.find(fd => fd.id === id);
            break;
        default:
            investment = allInvestments.otherAssets.find(a => a.id === id);
            type = investment.type;
    }
    
    if (!investment) {
        showError('Investment not found');
        return;
    }
    
    // Set up modal for editing
    document.getElementById('modalTitle').textContent = 'Edit Investment';
    document.getElementById('accountType').value = investment.accountType || editingAccountType;
    document.getElementById('investmentType').value = type;
    
    // Update account type options based on current selection
    updateAccountTypeOptions();
    updateFormFields();
    
    // Fill in the form fields
    setTimeout(() => {
        for (let key in investment) {
            if (key !== 'id' && key !== 'type' && key !== 'accountType') {
                const input = document.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = investment[key];
                }
            }
        }
    }, 100);
    
    document.getElementById('investmentModal').style.display = 'block';
}

function handleDeleteInvestment(type, id, accountType) {
    if (!confirm('Are you sure you want to delete this investment?')) return;
    
    try {
        // Map display type to asset type
        let assetType;
        switch(type) {
            case 'stock':
                assetType = 'stocks';
                break;
            case 'mutual-fund':
                assetType = 'mutualFunds';
                break;
            case 'fixed-deposit':
                assetType = 'fixedDeposits';
                break;
            default:
                assetType = 'otherAssets';
        }
        
        // Find the investment to get its account type
        const allInvestments = getAllInvestments();
        const investment = allInvestments[assetType].find(inv => inv.id === id);
        
        if (investment) {
            const invAccountType = investment.accountType || accountType || 'aot';
            // Call state management delete function (from state.js)
            window.deleteInvestment(invAccountType, assetType, id);
            
            showSuccess('Investment deleted successfully');
            updateDashboard();
            renderAllTables();
            trackBehavior('investment_deleted');
        } else {
            showError('Investment not found');
        }
    } catch (error) {
        showError(error.message);
    }
}

function exportData() {
    // Get the full portfolio structure from state
    const fullPortfolio = getPortfolio();
    const exportData = {
        version: '2.0', // New version with account structure
        exportDate: new Date().toISOString(),
        portfolio: fullPortfolio
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finnish_portfolio_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Portfolio exported successfully!');
    trackBehavior('portfolio_exported');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Handle different import formats
            let portfolioData;
            
            if (imported.version === '2.0') {
                // New format with version
                portfolioData = imported.portfolio;
            } else if (imported.accounts) {
                // New format without version wrapper
                portfolioData = imported;
            } else {
                // Old format - needs migration
                portfolioData = {
                    accounts: {
                        aot: {
                            stocks: imported.stocks || [],
                            mutualFunds: imported.mutualFunds || [],
                            fixedDeposits: imported.fixedDeposits || [],
                            otherAssets: imported.otherAssets || []
                        },
                        ost: {
                            stocks: [],
                            mutualFunds: [],
                            currentValue: 0,
                            totalDeposited: 0
                        }
                    },
                    // Keep legacy structure for backward compatibility
                    stocks: imported.stocks || [],
                    mutualFunds: imported.mutualFunds || [],
                    fixedDeposits: imported.fixedDeposits || [],
                    otherAssets: imported.otherAssets || []
                };
                
                // Mark all imported assets as AOT
                Object.values(portfolioData.accounts.aot).forEach(assetArray => {
                    assetArray.forEach(asset => {
                        asset.accountType = 'aot';
                    });
                });
            }
            
            // Save imported data
            localStorage.setItem('portfolio', JSON.stringify(portfolioData));
            
            // Reload portfolio from storage
            portfolio = loadPortfolio();
            
            updateDashboard();
            renderAllTables();
            showSuccess('Portfolio imported successfully!');
            trackBehavior('portfolio_imported');
            
        } catch (error) {
            console.error('Import error:', error);
            showError('Error importing file. Please ensure it\'s a valid portfolio JSON file.');
        }
    };
    reader.readAsText(file);
}