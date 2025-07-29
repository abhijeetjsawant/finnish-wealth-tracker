// Table Rendering Functions

function renderAllTables() {
    renderStocksTable();
    renderMutualFundsTable();
    renderFixedDepositsTable();
    renderOtherAssetsTable();
}

function renderStocksTable() {
    const tbody = document.querySelector('#stocksTable tbody');
    tbody.innerHTML = '';
    
    // Get all stocks from all accounts
    const allInvestments = getAllInvestments();
    
    allInvestments.stocks.forEach(stock => {
        const investment = stock.quantity * stock.buyPrice;
        const currentValue = stock.quantity * stock.currentPrice;
        const returns = currentValue - investment;
        const returnPercent = (returns / investment) * 100;
        const accountType = stock.accountType || 'aot';
        
        const row = `
            <tr>
                <td>${stock.symbol} ${createAccountBadge(accountType)}</td>
                <td>${stock.name}</td>
                <td>${stock.quantity}</td>
                <td>€${formatNumber(stock.buyPrice)}</td>
                <td>€${formatNumber(stock.currentPrice)}</td>
                <td>€${formatNumber(investment)}</td>
                <td>€${formatNumber(currentValue)}</td>
                <td class="${returns >= 0 ? 'positive' : 'negative'}">€${formatNumber(returns)}</td>
                <td class="${returns >= 0 ? 'positive' : 'negative'}">${returnPercent.toFixed(2)}%</td>
                <td class="action-buttons">
                    <button class="btn icon-btn btn-secondary" onclick="editInvestment('stock', '${stock.id}', '${accountType}')">✏️</button>
                    <button class="btn icon-btn btn-danger" onclick="handleDeleteInvestment('stock', '${stock.id}', '${accountType}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function createAccountBadge(accountType) {
    const color = accountType === 'ost' ? '#4CAF50' : '#2196F3';
    const label = accountType.toUpperCase();
    return `<span style="display: inline-block; padding: 2px 6px; margin-left: 8px; border-radius: 3px; font-size: 10px; font-weight: bold; background: ${color}; color: white;">${label}</span>`;
}

function renderMutualFundsTable() {
    const tbody = document.querySelector('#mutualFundsTable tbody');
    tbody.innerHTML = '';
    
    const allInvestments = getAllInvestments();
    
    allInvestments.mutualFunds.forEach(mf => {
        const investment = mf.units * mf.buyNAV;
        const currentValue = mf.units * mf.currentNAV;
        const returns = currentValue - investment;
        const xirr = calculateXIRR(mf);
        const accountType = mf.accountType || 'aot';
        
        const row = `
            <tr>
                <td>${mf.name} ${createAccountBadge(accountType)}</td>
                <td>${mf.category}</td>
                <td>${mf.units}</td>
                <td>€${formatNumber(mf.buyNAV)}</td>
                <td>€${formatNumber(mf.currentNAV)}</td>
                <td>€${formatNumber(investment)}</td>
                <td>€${formatNumber(currentValue)}</td>
                <td class="${returns >= 0 ? 'positive' : 'negative'}">€${formatNumber(returns)}</td>
                <td class="${xirr >= 0 ? 'positive' : 'negative'}">${xirr.toFixed(2)}%</td>
                <td class="action-buttons">
                    <button class="btn icon-btn btn-secondary" onclick="editInvestment('mutual-fund', '${mf.id}', '${accountType}')">✏️</button>
                    <button class="btn icon-btn btn-danger" onclick="handleDeleteInvestment('mutual-fund', '${mf.id}', '${accountType}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderFixedDepositsTable() {
    const tbody = document.querySelector('#fixedDepositsTable tbody');
    tbody.innerHTML = '';
    
    const allInvestments = getAllInvestments();
    
    allInvestments.fixedDeposits.forEach(fd => {
        const maturityValue = calculateMaturityValue(fd);
        const interestEarned = maturityValue - fd.principal;
        const daysRemaining = Math.max(0, Math.ceil((new Date(fd.maturityDate) - new Date()) / (1000 * 60 * 60 * 24)));
        const accountType = fd.accountType || 'aot';
        
        const row = `
            <tr>
                <td>${fd.bank} ${createAccountBadge(accountType)}</td>
                <td>€${formatNumber(fd.principal)}</td>
                <td>${fd.interestRate}%</td>
                <td>${formatDate(fd.startDate)}</td>
                <td>${formatDate(fd.maturityDate)}</td>
                <td>${daysRemaining} days</td>
                <td>€${formatNumber(maturityValue)}</td>
                <td class="positive">€${formatNumber(interestEarned)}</td>
                <td class="action-buttons">
                    <button class="btn icon-btn btn-secondary" onclick="editInvestment('fixed-deposit', '${fd.id}', '${accountType}')">✏️</button>
                    <button class="btn icon-btn btn-danger" onclick="handleDeleteInvestment('fixed-deposit', '${fd.id}', '${accountType}')">🗑️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function renderOtherAssetsTable(filter = 'all') {
    const tbody = document.querySelector('#otherAssetsTable tbody');
    tbody.innerHTML = '';
    
    const allInvestments = getAllInvestments();
    const assets = filter === 'all' 
        ? allInvestments.otherAssets 
        : allInvestments.otherAssets.filter(a => a.type === filter);
    
    assets.forEach(asset => {
        const returns = asset.currentValue - asset.purchasePrice;
        const returnPercent = (returns / asset.purchasePrice) * 100;
        const accountType = asset.accountType || 'aot';
        
        // Special handling for Indian FDs
        if (asset.type === 'indian-fd') {
            const row = `
                <tr>
                    <td>${asset.name} <span class="indian-fd-badge">🇮🇳 FD</span> ${createAccountBadge(accountType)}</td>
                    <td>${asset.type}</td>
                    <td>${asset.tenure} years</td>
                    <td>
                        €${formatNumber(asset.purchasePrice)}
                        <br><small>₹${formatNumber(asset.principalINR)}</small>
                    </td>
                    <td>
                        €${formatNumber(asset.currentValue)}
                        <br><small>After tax</small>
                    </td>
                    <td class="${returns >= 0 ? 'positive' : 'negative'}">
                        €${formatNumber(returns)}
                        <br><small>${asset.taxInfo ? `Tax: ${asset.taxInfo.effectiveTaxRate.toFixed(1)}%` : ''}</small>
                    </td>
                    <td class="${returns >= 0 ? 'positive' : 'negative'}">${returnPercent.toFixed(2)}%</td>
                    <td class="action-buttons">
                        <button class="btn icon-btn btn-secondary" onclick="editInvestment('${asset.type}', '${asset.id}', '${accountType}')">✏️</button>
                        <button class="btn icon-btn btn-danger" onclick="handleDeleteInvestment('${asset.type}', '${asset.id}', '${accountType}')">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        } else {
            const row = `
                <tr>
                    <td>${asset.name} ${createAccountBadge(accountType)}</td>
                    <td>${asset.type}</td>
                    <td>${asset.quantity}${asset.type === 'real-estate' ? ' sq m' : ''}</td>
                    <td>€${formatNumber(asset.purchasePrice)}</td>
                    <td>€${formatNumber(asset.currentValue)}</td>
                    <td class="${returns >= 0 ? 'positive' : 'negative'}">€${formatNumber(returns)}</td>
                    <td class="${returns >= 0 ? 'positive' : 'negative'}">${returnPercent.toFixed(2)}%</td>
                    <td class="action-buttons">
                        <button class="btn icon-btn btn-secondary" onclick="editInvestment('${asset.type}', '${asset.id}', '${accountType}')">✏️</button>
                        <button class="btn icon-btn btn-danger" onclick="handleDeleteInvestment('${asset.type}', '${asset.id}', '${accountType}')">🗑️</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        }
    });
}

function filterOtherAssets(type) {
    document.querySelectorAll('.asset-type-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    renderOtherAssetsTable(type);
}