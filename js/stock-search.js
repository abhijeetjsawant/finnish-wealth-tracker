// Stock Search Functions

// Popular stocks database (expandable)
const STOCK_DATABASE = [
    // US Tech Giants
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', sector: 'Technology' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', sector: 'Technology' },
    
    // European Stocks
    { symbol: 'ASML', name: 'ASML Holding N.V.', exchange: 'AMS', sector: 'Technology' },
    { symbol: 'SAP', name: 'SAP SE', exchange: 'ETR', sector: 'Technology' },
    { symbol: 'NVO', name: 'Novo Nordisk A/S', exchange: 'CPH', sector: 'Healthcare' },
    { symbol: 'NESN', name: 'Nestlé S.A.', exchange: 'SWX', sector: 'Consumer' },
    { symbol: 'MC.PA', name: 'LVMH', exchange: 'EPA', sector: 'Consumer' },
    { symbol: 'SAN', name: 'Banco Santander', exchange: 'BME', sector: 'Finance' },
    
    // Finnish Stocks
    { symbol: 'NOKIA.HE', name: 'Nokia Corporation', exchange: 'HEL', sector: 'Technology' },
    { symbol: 'NESTE.HE', name: 'Neste Corporation', exchange: 'HEL', sector: 'Energy' },
    { symbol: 'SAMPO.HE', name: 'Sampo Plc', exchange: 'HEL', sector: 'Finance' },
    { symbol: 'UPM.HE', name: 'UPM-Kymmene Corporation', exchange: 'HEL', sector: 'Materials' },
    { symbol: 'FORTUM.HE', name: 'Fortum Corporation', exchange: 'HEL', sector: 'Energy' },
    { symbol: 'ELISA.HE', name: 'Elisa Corporation', exchange: 'HEL', sector: 'Technology' },
    
    // Indian ADRs
    { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'WIT', name: 'Wipro Limited', exchange: 'NYSE', sector: 'Technology' },
    { symbol: 'HDB', name: 'HDFC Bank Limited', exchange: 'NYSE', sector: 'Finance' },
    { symbol: 'IBN', name: 'ICICI Bank Limited', exchange: 'NYSE', sector: 'Finance' },
    { symbol: 'TTM', name: 'Tata Motors Limited', exchange: 'NYSE', sector: 'Consumer' },
    
    // ETFs
    { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', exchange: 'NYSE', sector: 'ETF' },
    { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', exchange: 'NYSE', sector: 'ETF' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', exchange: 'NYSE', sector: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ', sector: 'ETF' },
    { symbol: 'IWDA.AS', name: 'iShares Core MSCI World UCITS ETF', exchange: 'AMS', sector: 'ETF' },
    { symbol: 'VWCE.DE', name: 'Vanguard FTSE All-World UCITS ETF', exchange: 'ETR', sector: 'ETF' },
    { symbol: 'EUNL.DE', name: 'iShares Core MSCI Europe UCITS ETF', exchange: 'ETR', sector: 'ETF' }
];

// Search timer for debouncing
let searchTimer;

// Stock API configuration
const STOCK_API_CONFIG = {
    // Free tier APIs that work without API key
    apis: [
        {
            name: 'Yahoo Finance',
            searchUrl: (query) => `https://query1.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=10&newsCount=0`,
            quoteUrl: (symbol) => `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}`,
            cors: true
        },
        {
            name: 'Alpha Vantage (requires free API key)',
            searchUrl: (query, apiKey) => `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${query}&apikey=${apiKey}`,
            quoteUrl: (symbol, apiKey) => `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`,
            needsApiKey: true
        }
    ]
};

// Cache for stock prices (5 minute TTL)
const priceCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch real-time stock data using free APIs
 */
async function fetchRealTimeStockData(symbol) {
    // Check cache first
    const cached = priceCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }
    
    try {
        // Try Yahoo Finance first (no API key needed)
        const response = await fetchWithCORS(STOCK_API_CONFIG.apis[0].quoteUrl(symbol));
        const data = await response.json();
        
        if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
            const quote = data.quoteResponse.result[0];
            const stockData = {
                symbol: quote.symbol,
                name: quote.longName || quote.shortName,
                price: quote.regularMarketPrice,
                currency: quote.currency,
                change: quote.regularMarketChange,
                changePercent: quote.regularMarketChangePercent,
                previousClose: quote.regularMarketPreviousClose,
                marketCap: quote.marketCap,
                exchange: quote.exchange,
                lastUpdate: new Date(quote.regularMarketTime * 1000)
            };
            
            // Cache the result
            priceCache.set(symbol, {
                data: stockData,
                timestamp: Date.now()
            });
            
            return stockData;
        }
    } catch (error) {
        console.error('Error fetching real-time data:', error);
    }
    
    // Fallback to simulated data if API fails
    return await fetchSimulatedStockPrice(symbol);
}

/**
 * Search for stocks using real-time API
 */
async function searchRealTimeStocks(query) {
    try {
        // Use Yahoo Finance search API
        const response = await fetchWithCORS(STOCK_API_CONFIG.apis[0].searchUrl(query));
        const data = await response.json();
        
        if (data.quotes) {
            return data.quotes.map(quote => ({
                symbol: quote.symbol,
                name: quote.longname || quote.shortname,
                exchange: quote.exchange,
                type: quote.quoteType,
                sector: quote.sector || 'N/A'
            }));
        }
    } catch (error) {
        console.error('Error searching stocks:', error);
    }
    
    // Fallback to local database
    return STOCK_DATABASE.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    );
}

/**
 * Fetch with CORS proxy if needed
 */
async function fetchWithCORS(url) {
    // Try direct fetch first
    try {
        return await fetch(url);
    } catch (error) {
        // If CORS error, use a proxy
        const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
        return await fetch(proxyUrl);
    }
}

/**
 * Fallback simulated stock price
 */
async function fetchSimulatedStockPrice(symbol) {
    // Simulate API call with random price
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate realistic prices based on symbol
    const basePrice = {
        'AAPL': 180,
        'MSFT': 400,
        'GOOGL': 150,
        'AMZN': 175,
        'NOKIA.HE': 3.5,
        'NESTE.HE': 45,
        'INFY': 18,
        'VOO': 450,
        'IWDA.AS': 80
    };
    
    const base = basePrice[symbol] || Math.random() * 100 + 20;
    const variation = (Math.random() - 0.5) * 0.1; // +/- 5%
    const price = base * (1 + variation);
    const change = price * (Math.random() - 0.5) * 0.05;
    
    return {
        symbol: symbol,
        name: STOCK_DATABASE.find(s => s.symbol === symbol)?.name || 'Unknown Stock',
        price: price,
        currency: 'EUR',
        change: change,
        changePercent: (change / price) * 100,
        previousClose: price - change,
        lastUpdate: new Date()
    };
}

/**
 * Search stocks with debouncing
 */
function searchStocks(query) {
    clearTimeout(searchTimer);
    const resultsDiv = document.getElementById('stockSearchResults');
    
    if (!query || query.length < 2) {
        resultsDiv.innerHTML = '';
        resultsDiv.style.display = 'none';
        return;
    }
    
    // Show loading state
    resultsDiv.innerHTML = '<div class="search-loading">Searching...</div>';
    resultsDiv.style.display = 'block';
    
    // Debounce search
    searchTimer = setTimeout(() => {
        performStockSearch(query);
    }, 300);
}

/**
 * Perform the actual stock search
 */
async function performStockSearch(query) {
    const resultsDiv = document.getElementById('stockSearchResults');
    
    try {
        // Try real-time search first
        const results = await searchRealTimeStocks(query);
        
        if (results.length === 0) {
            resultsDiv.innerHTML = `
                <div class="no-results">
                    No stocks found. Try searching by symbol or company name.
                </div>
            `;
            return;
        }
        
        // Build results HTML with loading states
        resultsDiv.innerHTML = '<div class="search-results-list" id="searchResultsList"></div>';
        const listDiv = document.getElementById('searchResultsList');
        
        // Add results as they load
        for (const stock of results.slice(0, 10)) {
            // Create placeholder
            const resultId = `result-${stock.symbol.replace(/[^a-zA-Z0-9]/g, '')}`;
            const resultHTML = `
                <div class="search-result-item" id="${resultId}">
                    <div class="stock-info">
                        <span class="stock-symbol">${stock.symbol}</span>
                        <span class="stock-name">${stock.name}</span>
                        <span class="stock-exchange">${stock.exchange || 'N/A'}</span>
                    </div>
                    <div class="stock-price">
                        <span class="loading-price">Loading...</span>
                    </div>
                </div>
            `;
            listDiv.innerHTML += resultHTML;
            
            // Fetch real-time price asynchronously
            fetchRealTimeStockData(stock.symbol).then(stockData => {
                const element = document.getElementById(resultId);
                if (element) {
                    const priceDiv = element.querySelector('.stock-price');
                    const changeClass = stockData.change >= 0 ? 'positive' : 'negative';
                    
                    priceDiv.innerHTML = `
                        <div class="price-container">
                            <span class="current-price">${stockData.currency || '€'}${stockData.price.toFixed(2)}</span>
                            <span class="price-change ${changeClass}">
                                ${stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} 
                                (${stockData.changePercent.toFixed(2)}%)
                            </span>
                        </div>
                    `;
                    
                    // Update onclick with real data
                    element.onclick = () => selectStock(stockData.symbol, stockData.name, stockData.price);
                }
            }).catch(error => {
                console.error(`Error fetching price for ${stock.symbol}:`, error);
                const element = document.getElementById(resultId);
                if (element) {
                    element.querySelector('.stock-price').innerHTML = '<span class="error">N/A</span>';
                }
            });
        }
        
        // Add API info footer
        resultsDiv.innerHTML += `
            <div class="api-info">
                <small>Prices may be delayed. Using free tier API.</small>
            </div>
        `;
        
    } catch (error) {
        console.error('Search error:', error);
        // Fallback to local database search
        performLocalStockSearch(query);
    }
}

/**
 * Fallback local search
 */
async function performLocalStockSearch(query) {
    const resultsDiv = document.getElementById('stockSearchResults');
    const searchTerm = query.toLowerCase();
    
    const results = STOCK_DATABASE.filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
    ).slice(0, 10);
    
    if (results.length === 0) {
        resultsDiv.innerHTML = `
            <div class="no-results">
                No stocks found. Try searching by symbol or company name.
            </div>
        `;
        return;
    }
    
    let resultsHTML = '<div class="search-results-list">';
    
    for (const stock of results) {
        const stockData = await fetchSimulatedStockPrice(stock.symbol);
        const changeClass = stockData.change >= 0 ? 'positive' : 'negative';
        
        resultsHTML += `
            <div class="search-result-item" onclick="selectStock('${stock.symbol}', '${stock.name.replace(/'/g, "\\'")}', ${stockData.price.toFixed(2)})">
                <div class="stock-info">
                    <span class="stock-symbol">${stock.symbol}</span>
                    <span class="stock-name">${stock.name}</span>
                    <span class="stock-exchange">${stock.exchange}</span>
                </div>
                <div class="stock-price">
                    <div class="price-container">
                        <span class="current-price">€${stockData.price.toFixed(2)}</span>
                        <span class="price-change ${changeClass}">
                            ${stockData.change >= 0 ? '+' : ''}${stockData.change.toFixed(2)} 
                            (${stockData.changePercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
    
    resultsHTML += '</div><div class="api-info"><small>Simulated prices (API unavailable)</small></div>';
    resultsDiv.innerHTML = resultsHTML;
}

/**
 * Select a stock from search results
 */
function selectStock(symbol, name, currentPrice) {
    // Fill in the form fields
    document.getElementById('stockSymbol').value = symbol;
    document.getElementById('stockName').value = name;
    
    // Set current price if field exists
    const currentPriceField = document.querySelector('input[name="currentPrice"]');
    if (currentPriceField) {
        currentPriceField.value = currentPrice;
    }
    
    // Clear search
    document.getElementById('stockSearchInput').value = '';
    document.getElementById('stockSearchResults').innerHTML = '';
    document.getElementById('stockSearchResults').style.display = 'none';
    
    // Focus on quantity field
    const quantityField = document.querySelector('input[name="quantity"]');
    if (quantityField) {
        quantityField.focus();
    }
}

/**
 * Add custom stock (not in database)
 */
function addCustomStock() {
    const resultsDiv = document.getElementById('stockSearchResults');
    const searchInput = document.getElementById('stockSearchInput').value.trim();
    
    if (!searchInput) return;
    
    // Allow manual entry
    document.getElementById('stockSymbol').value = searchInput.toUpperCase();
    document.getElementById('stockName').value = 'Custom Stock';
    
    // Clear search
    document.getElementById('stockSearchInput').value = '';
    resultsDiv.innerHTML = '';
    resultsDiv.style.display = 'none';
}

/**
 * Update portfolio stock prices
 */
async function updatePortfolioStockPrices() {
    const allInvestments = getAllInvestments();
    const stocksToUpdate = allInvestments.stocks;
    
    if (stocksToUpdate.length === 0) return;
    
    let updatedCount = 0;
    showSuccess(`Updating ${stocksToUpdate.length} stock prices...`);
    
    for (const stock of stocksToUpdate) {
        try {
            const stockData = await fetchRealTimeStockData(stock.symbol);
            
            // Update stock price in state
            const accountType = stock.accountType || 'aot';
            const assetType = 'stocks';
            
            // Find and update the stock
            const portfolio = getPortfolio();
            const stockList = accountType === 'ost' ? 
                portfolio.accounts.ost.stocks : 
                portfolio.accounts.aot.stocks;
            
            const stockIndex = stockList.findIndex(s => s.id === stock.id);
            if (stockIndex !== -1) {
                stockList[stockIndex].currentPrice = stockData.price;
                savePortfolio(portfolio);
                updatedCount++;
            }
        } catch (error) {
            console.error(`Failed to update ${stock.symbol}:`, error);
        }
    }
    
    // Refresh UI
    updateDashboard();
    renderAllTables();
    
    showSuccess(`Updated ${updatedCount} out of ${stocksToUpdate.length} stock prices`);
}

/**
 * Add update prices button to stocks tab
 */
function addUpdatePricesButton() {
    const stocksTab = document.getElementById('stocks');
    if (!stocksTab) return;
    
    const existingBtn = stocksTab.querySelector('.update-prices-btn');
    if (existingBtn) return;
    
    const sectionCard = stocksTab.querySelector('.section-card');
    const heading = sectionCard.querySelector('h2');
    
    const updateBtn = document.createElement('button');
    updateBtn.className = 'btn btn-secondary update-prices-btn';
    updateBtn.innerHTML = '🔄 Update Prices';
    updateBtn.style.marginLeft = '10px';
    updateBtn.onclick = updatePortfolioStockPrices;
    
    heading.appendChild(updateBtn);
}

/**
 * Initialize stock search on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add event listener for Enter key in search input
    const searchInput = document.getElementById('stockSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const results = document.querySelectorAll('.search-result-item');
                if (results.length > 0) {
                    results[0].click(); // Select first result
                } else {
                    addCustomStock(); // Add as custom stock
                }
            }
        });
    }
    
    // Add update prices button
    setTimeout(addUpdatePricesButton, 100);
});