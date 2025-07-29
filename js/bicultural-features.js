// Bicultural Features for Indian-Finnish Investors

// Currency conversion cache (24hr)
let exchangeRateCache = {
    rate: null,
    timestamp: null
};

// Global state for bicultural view
let biculturalViewActive = false;
let currentCurrencyView = 'EUR'; // EUR, INR, or BOTH

// Indian FD tax rates
const INDIAN_FD_TAX = {
    tdsRate: 0.10, // 10% TDS for NRIs
    surcharge: 0.0, // Varies by income
    educationCess: 0.04 // 4% on tax
};

// Finnish tax on foreign income
const FINNISH_FOREIGN_INCOME_TAX = 0.32; // Average rate

/**
 * Mental accounting for bicultural investors
 */
const MENTAL_ACCOUNTS = {
    finnish_life: {
        name: "Finnish Life",
        emoji: "🇫🇮",
        currency: "EUR",
        goals: ["Emergency Fund", "Finnish Home", "Retirement"]
    },
    indian_family: {
        name: "Family Security",
        emoji: "🇮🇳",
        currency: "INR",
        goals: ["Parents' Medical", "Property", "Siblings' Education"]
    },
    global_wealth: {
        name: "Global Freedom",
        emoji: "🌍",
        currency: "EUR",
        goals: ["Geographic Arbitrage", "Children's Education", "Early Retirement"]
    }
};

/**
 * Calculate real returns on Indian FD for Finnish tax resident
 */
function calculateIndianFDReturns(principal, interestRate, tenureYears, exchangeRate) {
    // Interest calculation
    const totalInterest = principal * interestRate * tenureYears;
    
    // Indian taxes
    const tds = totalInterest * INDIAN_FD_TAX.tdsRate;
    const tdsPlusCess = tds * (1 + INDIAN_FD_TAX.educationCess);
    
    // After Indian tax
    const afterIndianTax = totalInterest - tdsPlusCess;
    
    // Convert to EUR
    const interestInEUR = afterIndianTax / exchangeRate;
    
    // Finnish tax on foreign income (credit for tax paid in India)
    const finnishTaxCredit = tdsPlusCess / exchangeRate;
    const finnishTaxOwed = Math.max(0, (interestInEUR * FINNISH_FOREIGN_INCOME_TAX) - finnishTaxCredit);
    
    // Final returns
    const netReturnsEUR = interestInEUR - finnishTaxOwed;
    const effectiveTaxRate = ((totalInterest / exchangeRate) - netReturnsEUR) / (totalInterest / exchangeRate);
    
    return {
        grossInterestINR: totalInterest,
        indianTaxINR: tdsPlusCess,
        netInterestINR: afterIndianTax,
        grossInterestEUR: totalInterest / exchangeRate,
        finnishTaxEUR: finnishTaxOwed,
        netReturnsEUR: netReturnsEUR,
        effectiveTaxRate: effectiveTaxRate * 100,
        realReturnRate: (netReturnsEUR / (principal / exchangeRate)) * 100 / tenureYears
    };
}

/**
 * Behavioral nudge for currency conversion timing
 */
function getCurrencyConversionNudge(currentRate, historicalAvg) {
    const deviation = ((currentRate - historicalAvg) / historicalAvg) * 100;
    
    if (deviation > 5) {
        return {
            action: "Good time to convert EUR→INR",
            emoji: "💚",
            confidence: "high",
            message: `Rate is ${deviation.toFixed(1)}% above 6-month average`
        };
    } else if (deviation < -5) {
        return {
            action: "Wait if possible",
            emoji: "⏳",
            confidence: "medium",
            message: `Rate is ${Math.abs(deviation).toFixed(1)}% below average`
        };
    } else {
        return {
            action: "Neutral",
            emoji: "⚖️",
            confidence: "low",
            message: "Rate is near historical average"
        };
    }
}

/**
 * Family wealth aggregator
 */
function calculateFamilyWealth(personalPortfolio, familyAssets = []) {
    const totalPersonal = calculateTotalValue();
    
    let familyTotal = 0;
    familyAssets.forEach(asset => {
        if (asset.currency === 'INR') {
            familyTotal += asset.value / (exchangeRateCache.rate || 88);
        } else {
            familyTotal += asset.value;
        }
    });
    
    return {
        personal: totalPersonal,
        family: familyTotal,
        total: totalPersonal + familyTotal,
        breakdown: {
            finnish: totalPersonal * 0.7, // Estimate
            indian: totalPersonal * 0.3 + familyTotal
        }
    };
}

/**
 * Festival/Goal based savings tracker
 */
const INDIAN_FINANCIAL_CALENDAR = {
    diwali: {
        month: 10,
        savingsTarget: "Gold/Gifts",
        culturalNote: "Traditional gold buying season"
    },
    aprilTaxes: {
        month: 3,
        savingsTarget: "Indian Tax Planning",
        culturalNote: "Indian FY ends March 31"
    },
    education: {
        month: 5,
        savingsTarget: "Education Fees",
        culturalNote: "Academic year planning"
    }
};

/**
 * Bicultural behavioral prompts
 */
function getBiculturalPrompt() {
    const month = new Date().getMonth();
    const hour = new Date().getHours();
    const isWinter = month >= 10 || month <= 2;
    
    // Morning check-in prompts
    if (hour < 10) {
        if (isWinter) {
            return {
                prompt: "How's your financial energy despite the darkness?",
                subtext: "Indians in Finland invest 30% more in winter - channel that energy wisely",
                emoji: "🌅"
            };
        } else {
            return {
                prompt: "Summer planning mode activated?",
                subtext: "Best time to plan Indian property/FD investments",
                emoji: "☀️"
            };
        }
    }
    
    // Cultural milestone reminders
    const upcomingFestival = Object.entries(INDIAN_FINANCIAL_CALENDAR)
        .find(([_, data]) => data.month === month + 1);
    
    if (upcomingFestival) {
        return {
            prompt: `Ready for ${upcomingFestival[0]}?`,
            subtext: upcomingFestival[1].culturalNote,
            emoji: "🎉"
        };
    }
    
    return {
        prompt: "Building wealth across two worlds",
        subtext: "Your Indian resilience + Finnish systems = Success",
        emoji: "🌍"
    };
}

/**
 * Simplified tax impact visualizer
 */
function getSimplifiedTaxView(investment) {
    if (investment.type === 'indian-fd') {
        return {
            visual: "🇮🇳 → 🇫🇮",
            steps: [
                { country: "India", tax: "10% TDS", impact: "Automatic" },
                { country: "Finland", tax: "~22% extra", impact: "On declaration" },
                { country: "Total", tax: "~32%", impact: "Similar to Finnish tax" }
            ],
            advice: "✅ Still better than Finnish negative rates!"
        };
    }
    
    return {
        visual: "🇫🇮",
        steps: [
            { country: "Finland", tax: "30-34%", impact: "On sale only" }
        ],
        advice: "✅ Tax-deferred growth in OST"
    };
}

/**
 * Smart defaults for bicultural investors
 */
function getBiculturalDefaults() {
    return {
        emergencyFund: {
            finnish: 3, // months in Finland
            indian: 6,  // months for family in India
            location: "Split: 70% Finnish bank, 30% Indian FD"
        },
        assetAllocation: {
            finnishEquity: 40,
            globalEquity: 30,
            indianFD: 20,
            gold: 10
        },
        ostStrategy: "Start with €10k, not €50k - overcome mental barrier",
        remittanceStrategy: "Fixed monthly amount, ignore exchange rate fluctuations"
    };
}

/**
 * Toggle bicultural dashboard visibility
 */
function toggleBiculturalView() {
    const dashboard = document.getElementById('biculturalDashboard');
    biculturalViewActive = !biculturalViewActive;
    
    if (biculturalViewActive) {
        dashboard.style.display = 'block';
        updateBiculturalDashboard();
        fetchExchangeRate();
    } else {
        dashboard.style.display = 'none';
    }
}

/**
 * Toggle currency display
 */
function toggleCurrency(currency) {
    currentCurrencyView = currency;
    
    // Update button states
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent === currency) {
            btn.classList.add('active');
        }
    });
    
    // Update all value displays
    updateCurrencyDisplays();
}

/**
 * Fetch current exchange rate
 */
async function fetchExchangeRate() {
    // Check cache first
    if (exchangeRateCache.rate && exchangeRateCache.timestamp) {
        const hoursSinceUpdate = (Date.now() - exchangeRateCache.timestamp) / (1000 * 60 * 60);
        if (hoursSinceUpdate < 24) {
            updateExchangeRateDisplay();
            return;
        }
    }
    
    // Simulate fetching exchange rate
    // In production, this would call a real API
    exchangeRateCache.rate = 88.50 + (Math.random() * 2 - 1); // Simulated rate
    exchangeRateCache.timestamp = Date.now();
    
    updateExchangeRateDisplay();
}

/**
 * Update exchange rate display
 */
function updateExchangeRateDisplay() {
    const rateElement = document.getElementById('currentExchangeRate');
    const nudgeElement = document.getElementById('exchangeNudge');
    
    if (exchangeRateCache.rate) {
        rateElement.textContent = `1 EUR = ₹${exchangeRateCache.rate.toFixed(2)}`;
        
        // Get conversion nudge
        const nudge = getCurrencyConversionNudge(exchangeRateCache.rate, 85);
        nudgeElement.innerHTML = `${nudge.emoji} ${nudge.action}<br><small>${nudge.message}</small>`;
    }
}

/**
 * Update bicultural dashboard
 */
function updateBiculturalDashboard() {
    // Update family wealth
    const familyWealth = calculateFamilyWealth();
    document.getElementById('familyWealth').textContent = formatCurrency(familyWealth.total, 'EUR');
    
    // Update next goal
    updateNextGoal();
    
    // Update festival savings
    updateFestivalSavings();
}

/**
 * Update currency displays based on current view
 */
function updateCurrencyDisplays() {
    const totalValue = calculateTotalValue();
    
    // Update all currency-sensitive elements
    const elements = document.querySelectorAll('.value');
    elements.forEach(el => {
        const euroValue = parseFloat(el.getAttribute('data-euro-value') || el.textContent.replace(/[^0-9.-]/g, ''));
        
        if (currentCurrencyView === 'EUR') {
            el.textContent = formatCurrency(euroValue, 'EUR');
        } else if (currentCurrencyView === 'INR') {
            el.textContent = formatCurrency(euroValue * exchangeRateCache.rate, 'INR');
        } else { // BOTH
            el.innerHTML = `
                <div class="dual-currency">
                    <span class="currency-eur">${formatCurrency(euroValue, 'EUR')}</span>
                    <span class="currency-separator">|</span>
                    <span class="currency-inr">${formatCurrency(euroValue * exchangeRateCache.rate, 'INR')}</span>
                </div>
            `;
        }
    });
}

/**
 * Format currency with proper symbols
 */
function formatCurrency(amount, currency) {
    if (currency === 'INR') {
        return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    } else {
        return `€${amount.toLocaleString('fi-FI', { maximumFractionDigits: 0 })}`;
    }
}

/**
 * Update next goal display
 */
function updateNextGoal() {
    const totalValue = calculateTotalValue();
    let nextGoal, progress;
    
    if (totalValue < 50000) {
        nextGoal = 'OST Account Full';
        progress = (totalValue / 50000) * 100;
    } else if (totalValue < 100000) {
        nextGoal = 'First Lakh EUR';
        progress = ((totalValue - 50000) / 50000) * 100;
    } else if (totalValue < 200000) {
        nextGoal = 'Geo-Arbitrage Ready';
        progress = ((totalValue - 100000) / 100000) * 100;
    } else {
        nextGoal = 'Half Million';
        progress = ((totalValue - 200000) / 300000) * 100;
    }
    
    document.getElementById('nextGoal').textContent = nextGoal;
    
    // Create progress bar if not exists
    const progressElement = document.getElementById('goalProgress');
    if (!progressElement.innerHTML) {
        progressElement.innerHTML = '<div class="goal-progress-fill"></div>';
    }
    progressElement.querySelector('.goal-progress-fill').style.width = `${Math.min(progress, 100)}%`;
}

/**
 * Update festival savings display
 */
function updateFestivalSavings() {
    const month = new Date().getMonth();
    const upcomingFestival = Object.entries(INDIAN_FINANCIAL_CALENDAR)
        .find(([_, data]) => data.month >= month + 1) || 
        Object.entries(INDIAN_FINANCIAL_CALENDAR)[0];
    
    if (upcomingFestival) {
        const [festivalName, festivalData] = upcomingFestival;
        document.getElementById('festivalSavings').textContent = festivalData.savingsTarget;
        document.getElementById('nextFestival').textContent = `Next: ${festivalName} (${getMonthName(festivalData.month)})`;
    }
}

/**
 * Get month name from number
 */
function getMonthName(monthNumber) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthNumber - 1];
}