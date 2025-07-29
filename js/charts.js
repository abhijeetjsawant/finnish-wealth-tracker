// Chart Management Functions

let charts = {};

function initializeCharts() {
    // Allocation Chart
    const allocationCtx = document.getElementById('allocationChart').getContext('2d');
    charts.allocation = new Chart(allocationCtx, {
        type: 'doughnut',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [
                    '#2563eb', '#7c3aed', '#10b981', '#f59e0b', 
                    '#ef4444', '#8b5cf6', '#3b82f6', '#14b8a6'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                }
            }
        }
    });

    // Performance Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    charts.performance = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Portfolio Value',
                data: [],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '€' + formatNumber(value);
                        }
                    }
                }
            }
        }
    });

    // Sector Chart
    const sectorCtx = document.getElementById('sectorChart').getContext('2d');
    charts.sector = new Chart(sectorCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Sector Allocation',
                data: [],
                backgroundColor: '#7c3aed'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Timeline Chart
    const timelineCtx = document.getElementById('timelineChart').getContext('2d');
    charts.timeline = new Chart(timelineCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Monthly Investment',
                data: [],
                backgroundColor: '#10b981'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function updateCharts() {
    // Update Allocation Chart
    const allocationData = {};
    let totalValue = 0;

    portfolio.stocks.forEach(stock => {
        const value = stock.quantity * stock.currentPrice;
        allocationData['Stocks'] = (allocationData['Stocks'] || 0) + value;
        totalValue += value;
    });

    portfolio.mutualFunds.forEach(mf => {
        const value = mf.units * mf.currentNAV;
        allocationData['ETFs/Funds'] = (allocationData['ETFs/Funds'] || 0) + value;
        totalValue += value;
    });

    portfolio.fixedDeposits.forEach(fd => {
        const value = calculateMaturityValue(fd);
        allocationData['Fixed Deposits'] = (allocationData['Fixed Deposits'] || 0) + value;
        totalValue += value;
    });

    portfolio.otherAssets.forEach(asset => {
        allocationData[asset.type] = (allocationData[asset.type] || 0) + asset.currentValue;
        totalValue += asset.currentValue;
    });

    charts.allocation.data.labels = Object.keys(allocationData);
    charts.allocation.data.datasets[0].data = Object.values(allocationData);
    charts.allocation.update();

    // Update Performance Chart (Mock data for demo)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const performanceData = months.map((_, i) => totalValue * (0.9 + i * 0.02 + Math.random() * 0.1));
    
    charts.performance.data.labels = months;
    charts.performance.data.datasets[0].data = performanceData;
    charts.performance.update();

    // Update Sector Chart (for stocks)
    const sectorData = {};
    portfolio.stocks.forEach(stock => {
        const sector = stock.sector || 'Others';
        const value = stock.quantity * stock.currentPrice;
        sectorData[sector] = (sectorData[sector] || 0) + value;
    });

    charts.sector.data.labels = Object.keys(sectorData);
    charts.sector.data.datasets[0].data = Object.values(sectorData);
    charts.sector.update();

    // Update Timeline Chart
    const timelineData = {};
    const allInvestments = [
        ...portfolio.stocks.map(s => ({ date: s.purchaseDate, value: s.quantity * s.buyPrice })),
        ...portfolio.mutualFunds.map(mf => ({ date: mf.purchaseDate, value: mf.units * mf.buyNAV })),
        ...portfolio.fixedDeposits.map(fd => ({ date: fd.startDate, value: fd.principal })),
        ...portfolio.otherAssets.map(a => ({ date: a.purchaseDate, value: a.purchasePrice }))
    ];

    allInvestments.forEach(inv => {
        if (inv.date) {
            const month = new Date(inv.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            timelineData[month] = (timelineData[month] || 0) + inv.value;
        }
    });

    charts.timeline.data.labels = Object.keys(timelineData).slice(-6);
    charts.timeline.data.datasets[0].data = Object.values(timelineData).slice(-6);
    charts.timeline.update();
}