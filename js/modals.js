// Modal Handling Functions

function openAddInvestmentModal() {
    editingId = null;
    editingType = null;
    document.getElementById('modalTitle').textContent = 'Add Investment';
    document.getElementById('investmentForm').reset();
    document.getElementById('accountType').value = '';
    document.getElementById('investmentType').value = '';
    document.getElementById('dynamicFields').innerHTML = '';
    document.getElementById('accountTypeHint').textContent = '';
    document.getElementById('investmentModal').style.display = 'block';
}

function updateAccountTypeOptions() {
    const accountType = document.getElementById('accountType').value;
    const investmentTypeSelect = document.getElementById('investmentType');
    const hintElement = document.getElementById('accountTypeHint');
    
    if (accountType === 'ost') {
        // OST - Only stocks and ETFs/funds allowed
        hintElement.textContent = '⚠️ OST allows only stocks and ETFs. Tax-deferred until withdrawal.';
        hintElement.style.color = '#4CAF50';
        
        // Disable non-eligible options
        const options = investmentTypeSelect.options;
        for (let i = 0; i < options.length; i++) {
            const value = options[i].value;
            if (value && value !== 'stock' && value !== 'mutual-fund') {
                options[i].disabled = true;
            } else {
                options[i].disabled = false;
            }
        }
        
        // Reset selection if current selection is not allowed
        const currentValue = investmentTypeSelect.value;
        if (currentValue && currentValue !== 'stock' && currentValue !== 'mutual-fund') {
            investmentTypeSelect.value = '';
            document.getElementById('dynamicFields').innerHTML = '';
        }
    } else if (accountType === 'aot') {
        // AOT - All investment types allowed
        hintElement.textContent = 'ℹ️ Regular account. Capital gains tax applies on sale (30-34%).';
        hintElement.style.color = '#666';
        
        // Enable all options
        const options = investmentTypeSelect.options;
        for (let i = 0; i < options.length; i++) {
            options[i].disabled = false;
        }
    } else {
        hintElement.textContent = '';
        // Enable all options when no account type selected
        const options = investmentTypeSelect.options;
        for (let i = 0; i < options.length; i++) {
            options[i].disabled = false;
        }
    }
}

function closeModal() {
    document.getElementById('investmentModal').style.display = 'none';
}

function updateFormFields() {
    const type = document.getElementById('investmentType').value;
    const fieldsContainer = document.getElementById('dynamicFields');
    
    let fieldsHTML = '';
    
    switch(type) {
        case 'stock':
            fieldsHTML = `
                <div class="stock-search-container">
                    <div class="form-group">
                        <label>Search Stock</label>
                        <div class="search-input-wrapper">
                            <input type="text" class="form-control" id="stockSearchInput" 
                                   placeholder="Search by symbol or company name..." 
                                   oninput="searchStocks(this.value)">
                            <button type="button" class="search-btn" onclick="searchStocks(document.getElementById('stockSearchInput').value)">
                                🔍
                            </button>
                        </div>
                        <div id="stockSearchResults" class="search-results"></div>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Stock Symbol</label>
                        <input type="text" class="form-control" name="symbol" id="stockSymbol" required>
                    </div>
                    <div class="form-group">
                        <label>Company Name</label>
                        <input type="text" class="form-control" name="name" id="stockName" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Quantity</label>
                        <input type="number" class="form-control" name="quantity" step="1" required>
                    </div>
                    <div class="form-group">
                        <label>Buy Price (€)</label>
                        <input type="number" class="form-control" name="buyPrice" step="0.01" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Current Price (€)</label>
                        <input type="number" class="form-control" name="currentPrice" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Purchase Date</label>
                        <input type="date" class="form-control" name="purchaseDate" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Sector</label>
                    <select class="form-control" name="sector">
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Consumer">Consumer</option>
                        <option value="Energy">Energy</option>
                        <option value="Others">Others</option>
                    </select>
                </div>
            `;
            break;
            
        case 'mutual-fund':
            fieldsHTML = `
                <div class="form-group">
                    <label>Fund Name</label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category</label>
                        <select class="form-control" name="category" required>
                            <option value="UCITS ETF - World">UCITS ETF - World</option>
                            <option value="UCITS ETF - Europe">UCITS ETF - Europe</option>
                            <option value="UCITS ETF - Emerging">UCITS ETF - Emerging</option>
                            <option value="UCITS ETF - Bonds">UCITS ETF - Bonds</option>
                            <option value="UCITS ETF - REIT">UCITS ETF - REIT</option>
                            <option value="Index Fund">Index Fund</option>
                            <option value="Active Fund">Active Fund</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Purchase Date</label>
                        <input type="date" class="form-control" name="purchaseDate" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Units</label>
                        <input type="number" class="form-control" name="units" step="0.001" required>
                    </div>
                    <div class="form-group">
                        <label>Buy NAV (€)</label>
                        <input type="number" class="form-control" name="buyNAV" step="0.01" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Current NAV (€)</label>
                    <input type="number" class="form-control" name="currentNAV" step="0.01" required>
                </div>
            `;
            break;
            
        case 'fixed-deposit':
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Bank Name</label>
                        <input type="text" class="form-control" name="bank" required>
                    </div>
                    <div class="form-group">
                        <label>Principal Amount (€)</label>
                        <input type="number" class="form-control" name="principal" step="1000" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Interest Rate (%)</label>
                        <input type="number" class="form-control" name="interestRate" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Compounding</label>
                        <select class="form-control" name="compounding" required>
                            <option value="yearly">Yearly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" class="form-control" name="startDate" required>
                    </div>
                    <div class="form-group">
                        <label>Maturity Date</label>
                        <input type="date" class="form-control" name="maturityDate" required>
                    </div>
                </div>
            `;
            break;
            
        case 'indian-fd':
            fieldsHTML = `
                <div class="form-row">
                    <div class="form-group">
                        <label>Bank Name (Indian)</label>
                        <input type="text" class="form-control" name="bank" placeholder="e.g., SBI, HDFC, ICICI" required>
                    </div>
                    <div class="form-group">
                        <label>Principal Amount (₹ INR)</label>
                        <input type="number" class="form-control" name="principalINR" step="10000" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Interest Rate (% p.a.)</label>
                        <input type="number" class="form-control" name="interestRate" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Tenure (Years)</label>
                        <input type="number" class="form-control" name="tenure" step="0.5" min="1" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>EUR/INR Exchange Rate</label>
                        <input type="number" class="form-control" name="exchangeRate" step="0.01" value="88.50" required>
                        <small class="form-text">Current rate for conversion</small>
                    </div>
                    <div class="form-group">
                        <label>TDS Deducted (%)</label>
                        <input type="number" class="form-control" name="tdsRate" value="10" step="0.1" required>
                        <small class="form-text">Standard NRI rate: 10%</small>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Start Date</label>
                        <input type="date" class="form-control" name="startDate" required>
                    </div>
                    <div class="form-group">
                        <label>Maturity Date</label>
                        <input type="date" class="form-control" name="maturityDate" required>
                    </div>
                </div>
                <div class="tax-info-box">
                    <h5>Tax Impact Preview</h5>
                    <p>• Indian Tax (TDS): 10% on interest</p>
                    <p>• Finnish Tax: ~22% on remaining interest</p>
                    <p>• Effective Tax: ~32% total</p>
                    <small>Still better than Finnish negative rates!</small>
                </div>
            `;
            break;
            
        case 'gold':
        case 'real-estate':
        case 'bonds':
        case 'crypto':
            fieldsHTML = `
                <div class="form-group">
                    <label>Asset Name</label>
                    <input type="text" class="form-control" name="name" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${type === 'real-estate' ? 'Area (sq m)' : 'Quantity'}</label>
                        <input type="number" class="form-control" name="quantity" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label>Purchase Date</label>
                        <input type="date" class="form-control" name="purchaseDate" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Purchase Price (€)</label>
                        <input type="number" class="form-control" name="purchasePrice" step="100" required>
                    </div>
                    <div class="form-group">
                        <label>Current Value (€)</label>
                        <input type="number" class="form-control" name="currentValue" step="100" required>
                    </div>
                </div>
                ${type === 'real-estate' ? `
                    <div class="form-group">
                        <label>Location</label>
                        <input type="text" class="form-control" name="location">
                    </div>
                ` : ''}
            `;
            break;
    }
    
    fieldsContainer.innerHTML = fieldsHTML;
}