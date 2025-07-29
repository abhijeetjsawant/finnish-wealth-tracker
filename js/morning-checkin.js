// Morning Check-in Functions

function checkMorningCheckIn() {
    const lastCheckIn = localStorage.getItem('lastCheckIn');
    const today = new Date().toDateString();
    
    if (!lastCheckIn || lastCheckIn !== today) {
        setTimeout(() => {
            showMorningCheckIn();
        }, 1000); // Show after 1 second
    }
}

function showMorningCheckIn() {
    const portfolio = calculatePortfolioSummary();
    const worryScore = calculateWorryFreeScore();
    const insights = generateQuickInsights();
    
    // Get bicultural prompt if available
    const biculturalPrompt = typeof getBiculturalPrompt !== 'undefined' ? getBiculturalPrompt() : null;
    
    // Update modal content
    const sleepGainsElement = document.getElementById('sleepGains');
    const overnightGain = Math.random() * 500 - 100; // Simulated for now
    
    if (overnightGain >= 0) {
        sleepGainsElement.innerHTML = `Your portfolio grew <span class="amount">€${Math.abs(overnightGain).toLocaleString('fi-FI')}</span> while you slept 😴`;
    } else {
        sleepGainsElement.innerHTML = `Market movements overnight: <span class="amount">€${Math.abs(overnightGain).toLocaleString('fi-FI')}</span> - perfectly normal volatility`;
    }
    
    // Add bicultural prompt if available
    if (biculturalPrompt) {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'bicultural-prompt';
        promptDiv.innerHTML = `
            <h4>${biculturalPrompt.emoji} ${biculturalPrompt.prompt}</h4>
            <p>${biculturalPrompt.subtext}</p>
        `;
        sleepGainsElement.parentElement.appendChild(promptDiv);
    }
    
    // Update worry score
    document.getElementById('worryScoreFill').style.width = `${worryScore * 10}%`;
    document.getElementById('worryScoreText').textContent = `${worryScore}/10`;
    
    // Update insights
    document.getElementById('quickInsights').innerHTML = insights;
    
    // Show modal
    document.getElementById('morningCheckInModal').style.display = 'block';
}

function calculateWorryFreeScore() {
    let score = 5; // Baseline score
    
    // Check portfolio diversity
    const assetTypes = new Set();
    if (portfolio.stocks.length > 0) assetTypes.add('stocks');
    if (portfolio.mutualFunds.length > 0) assetTypes.add('mf');
    if (portfolio.fixedDeposits.length > 0) assetTypes.add('fd');
    if (portfolio.otherAssets.length > 0) assetTypes.add('other');
    
    if (assetTypes.size >= 3) score += 2;
    else if (assetTypes.size >= 2) score += 1;
    
    // Check if has fixed deposits (emergency fund proxy)
    if (portfolio.fixedDeposits.length > 0) score += 1;
    
    // Check portfolio size
    const totalValue = calculateTotalValue();
    if (totalValue > 500000) score += 1;
    if (totalValue > 1000000) score += 1;
    
    return Math.min(score, 10);
}

function generateQuickInsights() {
    const insights = [];
    const totalValue = calculateTotalValue();
    
    // Best performer
    let bestPerformer = null;
    let bestReturn = -Infinity;
    
    portfolio.stocks.forEach(stock => {
        const returnPercent = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
        if (returnPercent > bestReturn) {
            bestReturn = returnPercent;
            bestPerformer = { name: stock.symbol, return: returnPercent, type: 'stock' };
        }
    });
    
    portfolio.mutualFunds.forEach(mf => {
        const returnPercent = ((mf.currentNAV - mf.buyNAV) / mf.buyNAV) * 100;
        if (returnPercent > bestReturn) {
            bestReturn = returnPercent;
            bestPerformer = { name: mf.name, return: returnPercent, type: 'mf' };
        }
    });
    
    if (bestPerformer && bestReturn > 0) {
        insights.push({
            icon: '⭐',
            text: `${bestPerformer.name} is your star performer (+${bestReturn.toFixed(1)}%)`
        });
    }
    
    // Diversification insight
    const assetTypes = new Set();
    if (portfolio.stocks.length > 0) assetTypes.add('stocks');
    if (portfolio.mutualFunds.length > 0) assetTypes.add('mf');
    if (portfolio.fixedDeposits.length > 0) assetTypes.add('fd');
    if (portfolio.otherAssets.length > 0) assetTypes.add('other');
    
    if (assetTypes.size >= 3) {
        insights.push({
            icon: '🛡️',
            text: 'Well diversified portfolio - you\'re protected!'
        });
    } else {
        insights.push({
            icon: '💡',
            text: 'Consider diversifying into more asset types'
        });
    }
    
    // Action needed
    const hasRedInvestments = portfolio.stocks.some(s => s.currentPrice < s.buyPrice) ||
                             portfolio.mutualFunds.some(mf => mf.currentNAV < mf.buyNAV);
    
    if (!hasRedInvestments) {
        insights.push({
            icon: '✨',
            text: 'No action needed today - enjoy your day!'
        });
    } else {
        insights.push({
            icon: '💪',
            text: 'Some investments are down - stay the course!'
        });
    }
    
    // Check for Indian FDs
    const hasIndianFD = portfolio.otherAssets && portfolio.otherAssets.some(asset => asset.type === 'indian-fd');
    if (!hasIndianFD) {
        insights.push({
            icon: '🇮🇳',
            text: 'Consider Indian FDs - better than Finnish negative rates!'
        });
    }
    
    // Exchange rate insight if we have the function
    if (typeof getCurrencyConversionNudge !== 'undefined' && exchangeRateCache.rate) {
        const nudge = getCurrencyConversionNudge(exchangeRateCache.rate, 85); // Assuming 85 is historical avg
        if (nudge.confidence === 'high') {
            insights.push({
                icon: nudge.emoji,
                text: nudge.action + ': ' + nudge.message
            });
        }
    }
    
    return insights.map(insight => `
        <div class="insight-item">
            <span class="insight-icon">${insight.icon}</span>
            <span class="insight-text">${insight.text}</span>
        </div>
    `).join('');
}

function calculatePortfolioSummary() {
    // This would calculate real portfolio metrics
    return {
        totalValue: calculateTotalValue(),
        totalInvestment: calculateTotalInvestment(),
        dayChange: 0 // Calculate from portfolio
    };
}

function startDay() {
    // Save check-in date
    localStorage.setItem('lastCheckIn', new Date().toDateString());
    
    // Close modal
    document.getElementById('morningCheckInModal').style.display = 'none';
    
    // Track behavior
    trackBehavior('morning-checkin-completed');
}