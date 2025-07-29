// UI Management Module - All DOM manipulation in one place

/**
 * Update the main dashboard display
 */
function updateDashboardUI(metrics, bestPerformer) {
    // Update total portfolio value
    document.getElementById('totalValue').textContent = '€' + formatNumber(metrics.totalValue);
    document.getElementById('totalInvestment').textContent = '€' + formatNumber(metrics.totalInvestment);
    
    // Show unrealized gains (not after-tax fiction)
    document.getElementById('totalReturns').textContent = '€' + formatNumber(metrics.unrealizedGains);
    
    // Update percentage changes
    const returnPercent = metrics.totalInvestment > 0 ? 
        (metrics.unrealizedGains / metrics.totalInvestment) * 100 : 0;
    
    document.getElementById('totalChange').textContent = 
        (metrics.unrealizedGains >= 0 ? '+' : '') + returnPercent.toFixed(2) + '%';
    document.getElementById('totalChange').className = 
        'change ' + (metrics.unrealizedGains >= 0 ? 'positive' : 'negative');
    
    // Show potential tax info separately
    const potentialTax = calculatePotentialTaxLiability(metrics.byAccount.aot.gains);
    const taxInfo = metrics.unrealizedGains > 0 ? 
        `+${returnPercent.toFixed(2)}% (Tax if sold: €${formatNumber(potentialTax)})` : 
        `${returnPercent.toFixed(2)}%`;
    
    document.getElementById('returnPercentage').textContent = taxInfo;
    document.getElementById('returnPercentage').className = 
        'change ' + (metrics.unrealizedGains >= 0 ? 'positive' : 'negative');
    
    // Update best performer
    document.getElementById('bestPerformer').textContent = bestPerformer.name;
    document.getElementById('bestPerformerReturn').textContent = 
        '+' + bestPerformer.return.toFixed(2) + '%';
}

/**
 * Update wealth phase display
 */
function updateWealthPhaseUI(wealthPhase) {
    document.getElementById('phaseFill').style.width = `${wealthPhase.percent}%`;
    document.getElementById('currentPhaseTitle').textContent = wealthPhase.title;
    document.getElementById('currentPhaseDesc').textContent = wealthPhase.description;
    
    // Update geo-arbitrage status
    const geoStatus = wealthPhase.geoArbitrageReady ? "Ready to explore" : "Not Yet";
    document.getElementById('geoArbitrageStatus').textContent = geoStatus;
}

/**
 * Update tax optimization display
 */
function updateTaxOptimizationUI(metrics, ostStatus) {
    // Update OST utilization
    document.getElementById('ostValue').textContent = 
        `€${formatNumber(ostStatus.totalDeposited)} / €${formatNumber(ostStatus.maxDeposit)}`;
    document.getElementById('ostProgress').style.width = `${ostStatus.utilizationPercent}%`;
    
    // Calculate effective tax rate on POTENTIAL tax liability
    const potentialTax = calculatePotentialTaxLiability(metrics.byAccount.aot.gains);
    const effectiveTaxRate = metrics.byAccount.aot.gains > 0 ? 
        (potentialTax / metrics.byAccount.aot.gains * 100) : 0;
    
    document.getElementById('effectiveTaxRate').textContent = `${effectiveTaxRate.toFixed(1)}%`;
    
    // Tax efficiency score
    let taxScore = calculateTaxEfficiencyScore(portfolio, ostStatus);
    document.getElementById('taxEfficiencyScore').textContent = `${taxScore}/10`;
}

/**
 * Calculate tax efficiency score
 */
function calculateTaxEfficiencyScore(portfolio, ostStatus) {
    let score = 5; // Base score
    
    // OST utilization bonus
    if (ostStatus.utilizationPercent >= 100) score += 2;
    else if (ostStatus.utilizationPercent >= 50) score += 1;
    
    // Check for tax-efficient investments
    if (hasAccumulatingETFs()) score += 2;
    if (hasLowCostFunds()) score += 1;
    
    return Math.min(score, 10);
}

/**
 * Update asset summary cards
 */
function updateAssetSummaryUI(summary) {
    const summaryHtml = `
        <div class="summary-item">
            <h4>Stocks (${summary.stocks.count})</h4>
            <p>€${formatNumber(summary.stocks.value)}</p>
            <small class="${summary.stocks.value >= summary.stocks.investment ? 'positive' : 'negative'}">
                ${summary.stocks.investment > 0 ? 
                    ((summary.stocks.value - summary.stocks.investment) / summary.stocks.investment * 100).toFixed(2) : 
                    '0.00'}%
            </small>
        </div>
        <div class="summary-item">
            <h4>ETFs/Funds (${summary.mutualFunds.count})</h4>
            <p>€${formatNumber(summary.mutualFunds.value)}</p>
            <small class="${summary.mutualFunds.value >= summary.mutualFunds.investment ? 'positive' : 'negative'}">
                ${summary.mutualFunds.investment > 0 ?
                    ((summary.mutualFunds.value - summary.mutualFunds.investment) / summary.mutualFunds.investment * 100).toFixed(2) :
                    '0.00'}%
            </small>
        </div>
        <div class="summary-item">
            <h4>Fixed Deposits (${summary.fixedDeposits.count})</h4>
            <p>€${formatNumber(summary.fixedDeposits.value)}</p>
            <small class="positive">
                ${summary.fixedDeposits.investment > 0 ?
                    ((summary.fixedDeposits.value - summary.fixedDeposits.investment) / summary.fixedDeposits.investment * 100).toFixed(2) :
                    '0.00'}%
            </small>
        </div>
        <div class="summary-item">
            <h4>Other Assets (${summary.otherAssets.count})</h4>
            <p>€${formatNumber(summary.otherAssets.value)}</p>
            <small class="${summary.otherAssets.value >= summary.otherAssets.investment ? 'positive' : 'negative'}">
                ${summary.otherAssets.investment > 0 ?
                    ((summary.otherAssets.value - summary.otherAssets.investment) / summary.otherAssets.investment * 100).toFixed(2) :
                    '0.00'}%
            </small>
        </div>
    `;
    
    document.getElementById('assetSummary').innerHTML = summaryHtml;
}

/**
 * Update analytics display
 */
function updateAnalyticsUI(analytics) {
    document.getElementById('avgReturn').textContent = analytics.avgReturn.toFixed(2) + '%';
    document.getElementById('riskScore').textContent = 
        analytics.avgRisk < 1.5 ? 'Low' : analytics.avgRisk < 2.5 ? 'Medium' : 'High';
    document.getElementById('diversificationScore').textContent = analytics.diversificationScore + '/10';
    document.getElementById('liquidityRatio').textContent = analytics.liquidityRatio.toFixed(1) + '%';
}

/**
 * Display error message
 */
function showError(message) {
    // Create error toast
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    // Remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Display success message
 */
function showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'success-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Update tax analytics tab content
 */
function updateTaxAnalyticsUI(metrics, ostStatus) {
    const aotGains = metrics.byAccount.aot.gains;
    const ostGains = metrics.byAccount.ost.gains;
    const aotTaxLiability = calculatePotentialTaxLiability(aotGains);
    const ostTaxLiability = calculatePotentialTaxLiability(ostGains);
    
    const analyticsHtml = `
        <div class="tax-analytics-grid">
            <div class="tax-card detailed">
                <h3>📊 Account Breakdown</h3>
                <div class="account-section">
                    <h4>AOT (Regular Trading Account)</h4>
                    <p>Value: €${formatNumber(metrics.byAccount.aot.value)}</p>
                    <p>Investment: €${formatNumber(metrics.byAccount.aot.investment)}</p>
                    <p>Unrealized Gains: €${formatNumber(aotGains)}</p>
                    <p class="tax-warning">Potential Tax: €${formatNumber(aotTaxLiability)}</p>
                </div>
                <div class="account-section">
                    <h4>OST (Equity Savings Account)</h4>
                    <p>Value: €${formatNumber(metrics.byAccount.ost.value)}</p>
                    <p>Deposited: €${formatNumber(ostStatus.totalDeposited)}</p>
                    <p>Unrealized Gains: €${formatNumber(ostGains)}</p>
                    <p class="tax-info">Tax-deferred until withdrawal</p>
                    <p>Remaining capacity: €${formatNumber(ostStatus.remainingDeposit)}</p>
                </div>
            </div>
            
            <div class="tax-card detailed">
                <h3>💰 Tax Scenarios</h3>
                <div class="scenario">
                    <h4>If you sold everything today:</h4>
                    <p>Total gains: €${formatNumber(metrics.unrealizedGains)}</p>
                    <p>Tax on AOT: €${formatNumber(aotTaxLiability)}</p>
                    <p>Tax on OST withdrawal: €${formatNumber(ostTaxLiability)}</p>
                    <p class="total">Total tax: €${formatNumber(aotTaxLiability + ostTaxLiability)}</p>
                    <p class="after-tax">After-tax proceeds: €${formatNumber(metrics.totalValue - aotTaxLiability - ostTaxLiability)}</p>
                </div>
            </div>
            
            <div class="tax-card detailed">
                <h3>🎯 Optimization Tips</h3>
                <ul class="optimization-tips">
                    ${ostStatus.remainingDeposit > 0 ? 
                        `<li>✅ Move €${formatNumber(Math.min(ostStatus.remainingDeposit, metrics.byAccount.aot.value))} to OST for tax deferral</li>` : 
                        '<li>⚠️ OST fully utilized - excellent!</li>'}
                    ${!hasAccumulatingETFs() ? 
                        '<li>📈 Switch to accumulating ETFs to defer dividend taxes</li>' : 
                        '<li>✅ Using accumulating ETFs - good strategy!</li>'}
                    ${metrics.unrealizedGains > 100000 ? 
                        '<li>🌍 Consider geographic arbitrage options</li>' : ''}
                    <li>💡 Hold forever - selling triggers ${aotGains > 30000 ? '34%' : '30%'} tax</li>
                </ul>
            </div>
        </div>
    `;
    
    // Update the analytics tab if it exists, or create it
    let analyticsTab = document.getElementById('analytics');
    if (!analyticsTab) {
        // Add analytics content to the page
        const tabContent = document.createElement('div');
        tabContent.id = 'analytics';
        tabContent.className = 'tab-content';
        tabContent.innerHTML = `
            <div class="section-card">
                <h2>Tax Analytics & Optimization</h2>
                ${analyticsHtml}
            </div>
        `;
        document.querySelector('.tabs').parentElement.appendChild(tabContent);
    } else {
        analyticsTab.innerHTML = `
            <div class="section-card">
                <h2>Tax Analytics & Optimization</h2>
                ${analyticsHtml}
            </div>
        `;
    }
}

/**
 * Add account type indicator to table rows
 */
function addAccountTypeToRow(row, accountType) {
    const badge = document.createElement('span');
    badge.className = `account-badge ${accountType}`;
    badge.textContent = accountType.toUpperCase();
    badge.style.cssText = `
        display: inline-block;
        padding: 2px 8px;
        margin-left: 10px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: bold;
        background: ${accountType === 'ost' ? '#4CAF50' : '#2196F3'};
        color: white;
    `;
    return badge;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .tax-analytics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        margin-top: 20px;
    }
    .tax-card.detailed {
        background: var(--bg-secondary);
        padding: 20px;
        border-radius: 8px;
        border: 1px solid var(--border-color);
    }
    .account-section {
        margin: 15px 0;
        padding: 15px;
        background: var(--bg-primary);
        border-radius: 4px;
    }
    .tax-warning {
        color: #ff9800;
        font-weight: bold;
    }
    .tax-info {
        color: #4CAF50;
        font-style: italic;
    }
    .scenario {
        padding: 15px;
        background: var(--bg-primary);
        border-radius: 4px;
    }
    .scenario .total {
        font-weight: bold;
        color: #ff5252;
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid var(--border-color);
    }
    .scenario .after-tax {
        font-weight: bold;
        color: #4CAF50;
        font-size: 1.1em;
    }
    .optimization-tips {
        list-style: none;
        padding: 0;
    }
    .optimization-tips li {
        padding: 10px 0;
        border-bottom: 1px solid var(--border-color);
    }
    .optimization-tips li:last-child {
        border-bottom: none;
    }
`;
document.head.appendChild(style);