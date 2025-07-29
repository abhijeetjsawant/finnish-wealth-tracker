// Utility Functions

function formatNumber(num) {
    return new Intl.NumberFormat('fi-FI').format(Math.round(num));
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function calculateMaturityValue(fd) {
    const principal = fd.principal;
    const rate = fd.interestRate / 100;
    const years = (new Date(fd.maturityDate) - new Date(fd.startDate)) / (365 * 24 * 60 * 60 * 1000);
    
    let n = 1; // Yearly
    if (fd.compounding === 'quarterly') n = 4;
    else if (fd.compounding === 'monthly') n = 12;
    
    return principal * Math.pow(1 + rate/n, n * years);
}

function calculateXIRR(mf) {
    // Simplified XIRR calculation
    const investment = mf.units * mf.buyNAV;
    const currentValue = mf.units * mf.currentNAV;
    const years = (new Date() - new Date(mf.purchaseDate)) / (365 * 24 * 60 * 60 * 1000);
    
    if (years <= 0) return 0;
    
    return ((Math.pow(currentValue / investment, 1 / years) - 1) * 100);
}

function trackBehavior(action) {
    // Enhanced behavior tracking
    const behaviors = JSON.parse(localStorage.getItem('behaviors') || '[]');
    behaviors.push({
        action: action,
        timestamp: new Date().toISOString(),
        portfolioValue: calculateTotalValue()
    });
    localStorage.setItem('behaviors', JSON.stringify(behaviors));
}

function calculateTotalValue() {
    let total = 0;
    
    portfolio.stocks.forEach(stock => {
        total += stock.quantity * stock.currentPrice;
    });
    
    portfolio.mutualFunds.forEach(mf => {
        total += mf.units * mf.currentNAV;
    });
    
    portfolio.fixedDeposits.forEach(fd => {
        total += calculateMaturityValue(fd);
    });
    
    portfolio.otherAssets.forEach(asset => {
        total += asset.currentValue;
    });
    
    return total;
}

function calculateTotalInvestment() {
    let total = 0;
    
    portfolio.stocks.forEach(stock => {
        total += stock.quantity * stock.buyPrice;
    });
    
    portfolio.mutualFunds.forEach(mf => {
        total += mf.units * mf.buyNAV;
    });
    
    portfolio.fixedDeposits.forEach(fd => {
        total += fd.principal;
    });
    
    portfolio.otherAssets.forEach(asset => {
        total += asset.purchasePrice;
    });
    
    return total;
}

function hasAccumulatingETFs() {
    // Check if portfolio has accumulating ETFs (simplified)
    return portfolio.mutualFunds.some(mf => 
        mf.name.toLowerCase().includes('acc') || 
        mf.name.toLowerCase().includes('accumulating')
    );
}

function hasLowCostFunds() {
    // Check if funds have low expense ratios (simplified)
    return true; // Simplified for demo
}