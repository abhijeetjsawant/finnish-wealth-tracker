# Finnish Wealth Tracker

A comprehensive portfolio tracking application designed specifically for Finnish investors, focusing on tax optimization and behavioral finance principles.

## Features

### 🇫🇮 Finnish-Specific
- **Wealth Phase Tracking**: Visual journey from €0 to €500k+
- **OST Account Tracking**: Monitor your tax-deferred investment limit
- **Tax Optimization Dashboard**: Real-time effective tax rate calculation
- **Geographic Arbitrage Planning**: Know when you're ready to explore international options

### 📊 Core Portfolio Management
- Multi-asset tracking (Stocks, ETFs, Fixed Deposits, Real Estate, Gold, Crypto)
- After-tax returns calculation (30-34% capital gains tax)
- Performance analytics and charts
- Import/Export functionality
- Dark mode support

### 🧠 Behavioral Finance Features
- Morning Check-in with worry-free score
- Investment Bible with Finnish tax wisdom
- Calming UI design to prevent panic selling
- Behavioral tracking for better decision making

## File Structure

```
/Finance/
├── index.html                    # Main HTML file
├── css/
│   ├── styles.css               # Core styles
│   └── finnish-features.css     # Finnish-specific UI styles
├── js/
│   ├── app.js                   # Main application initialization
│   ├── portfolio.js             # Portfolio management functions
│   ├── finnish-features.js      # Tax optimization & wealth phases
│   ├── morning-checkin.js       # Behavioral check-in feature
│   ├── charts.js                # Chart management
│   ├── modals.js                # Modal handling
│   ├── tables.js                # Table rendering
│   └── utils.js                 # Utility functions
└── *.md                         # Investment bible documents
```

## Usage

1. Open `index.html` in a modern web browser
2. Start by adding your investments using the "+ Add Investment" button
3. Check your wealth phase progress and tax optimization status
4. Use the Investment Bible (📖) for guidance on Finnish investing
5. Enable Morning Check-in for behavioral support

## Key Concepts

### Wealth Phases
1. **Foundation (€0-50k)**: Emergency fund + OST + Index funds
2. **Growth (€50k-200k)**: Diversification + Tax optimization
3. **Optimization (€200k-500k)**: Geographic arbitrage planning
4. **Freedom (€500k+)**: International diversification

### Tax Strategy
- Prioritize OST account (€50k tax-deferred limit)
- Use accumulating ETFs to defer taxes
- Hold investments forever (selling = 30%+ tax)
- Consider geographic arbitrage at €200k+

### Investment Rules
- UCITS ETFs only (no US-domiciled funds)
- Low-cost everything (fees compound with taxes)
- Use Nordnet/Degiro (avoid Finnish bank fees)
- Simple portfolio structure (complexity = tax nightmare)

## Technical Notes

- Data stored in browser localStorage
- No external dependencies except Chart.js
- Fully responsive design
- Euro formatting with Finnish locale
- Modular JavaScript architecture for maintainability

## Future Enhancements

- Income vs investment tracking
- API integration for real-time prices
- Local encryption for sensitive data
- Progressive disclosure for beginners
- Milestone celebrations
- Geographic arbitrage calculator

---

*Remember: In Finland, avoiding taxes legally is the highest return investment.*