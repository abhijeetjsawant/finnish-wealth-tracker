// Finnish-specific features

function updateWealthPhase() {
    const totalValue = calculateTotalValue();
    
    // Calculate wealth phase
    let phase, phasePercent, phaseTitle, phaseDesc;
    
    if (totalValue < 50000) {
        phase = 1;
        phasePercent = (totalValue / 50000) * 33;
        phaseTitle = "Foundation Phase";
        phaseDesc = "Focus: Emergency fund + OST account + Low-cost index funds";
    } else if (totalValue < 200000) {
        phase = 2;
        phasePercent = 33 + ((totalValue - 50000) / 150000) * 33;
        phaseTitle = "Growth Phase";
        phaseDesc = "Focus: Diversification + Tax optimization + Income growth";
    } else if (totalValue < 500000) {
        phase = 3;
        phasePercent = 66 + ((totalValue - 200000) / 300000) * 34;
        phaseTitle = "Optimization Phase";
        phaseDesc = "Focus: Geographic arbitrage planning + Alternative investments";
    } else {
        phase = 4;
        phasePercent = 100;
        phaseTitle = "Freedom Phase";
        phaseDesc = "Focus: Wealth preservation + International diversification";
    }
    
    document.getElementById('phaseFill').style.width = `${phasePercent}%`;
    document.getElementById('currentPhaseTitle').textContent = phaseTitle;
    document.getElementById('currentPhaseDesc').textContent = phaseDesc;
    
    // Update geo-arbitrage status
    const geoStatus = totalValue >= 200000 ? "Ready to explore" : "Not Yet";
    document.getElementById('geoArbitrageStatus').textContent = geoStatus;
}

function updateTaxOptimization() {
    const totalValue = calculateTotalValue();
    const totalInvestment = calculateTotalInvestment();
    const unrealizedGains = totalValue - totalInvestment;
    
    // Get OST status - check if portfolio has new structure
    let ostValue = 0;
    let ostUtilization = 0;
    
    if (portfolio.accounts && portfolio.accounts.ost) {
        // New structure with proper OST tracking
        ostValue = portfolio.accounts.ost.totalDeposited || 0;
        ostUtilization = (ostValue / 50000) * 100;
    } else {
        // Legacy structure - estimate OST usage
        ostValue = Math.min(totalValue * 0.3, 50000); // Assume 30% in OST
        ostUtilization = (ostValue / 50000) * 100;
    }
    
    document.getElementById('ostValue').textContent = `€${formatNumber(ostValue)} / €50,000`;
    document.getElementById('ostProgress').style.width = `${ostUtilization}%`;
    
    // Calculate POTENTIAL tax rate (not actual tax owed)
    const potentialTaxRate = unrealizedGains > 30000 ? 34 : 30;
    const potentialTax = unrealizedGains > 0 ? unrealizedGains * (potentialTaxRate / 100) : 0;
    const effectiveTaxRate = unrealizedGains > 0 ? (potentialTax / unrealizedGains * 100) : 0;
    
    document.getElementById('effectiveTaxRate').textContent = `${effectiveTaxRate.toFixed(1)}%`;
    
    // Tax efficiency score
    let taxScore = 5; // Base score
    
    // OST utilization bonus
    if (ostUtilization >= 100) taxScore += 2;
    else if (ostUtilization >= 50) taxScore += 1;
    
    // Check for tax-efficient investments
    if (hasAccumulatingETFs()) taxScore += 2;
    if (hasLowCostFunds()) taxScore += 1;
    
    document.getElementById('taxEfficiencyScore').textContent = `${Math.min(taxScore, 10)}/10`;
}

function showInvestmentBible() {
    document.getElementById('investmentBibleModal').style.display = 'block';
}

function closeBibleModal() {
    document.getElementById('investmentBibleModal').style.display = 'none';
}

function switchBibleSection(section) {
    document.querySelectorAll('.bible-nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.bible-section').forEach(sec => sec.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(section).classList.add('active');
}