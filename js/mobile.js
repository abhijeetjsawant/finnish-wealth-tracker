// Mobile-specific functionality

// Mobile menu state
let mobileMenuOpen = false;

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
    const headerControls = document.getElementById('headerControls');
    const menuBtn = document.getElementById('mobileMenuBtn');
    
    if (mobileMenuOpen) {
        headerControls.classList.add('mobile-menu-open');
        menuBtn.textContent = '✕';
    } else {
        headerControls.classList.remove('mobile-menu-open');
        menuBtn.textContent = '☰';
    }
}

/**
 * Close mobile menu when clicking outside
 */
document.addEventListener('click', function(event) {
    if (mobileMenuOpen && 
        !event.target.closest('.header-controls') && 
        !event.target.closest('.mobile-menu-btn')) {
        toggleMobileMenu();
    }
});

/**
 * Handle mobile table scrolling
 */
function initMobileTableScroll() {
    const tables = document.querySelectorAll('.table-responsive');
    
    tables.forEach(table => {
        let isScrolling = false;
        let startX;
        let scrollLeft;
        
        table.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - table.offsetLeft;
            scrollLeft = table.scrollLeft;
        });
        
        table.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - table.offsetLeft;
            const walk = (x - startX) * 2;
            table.scrollLeft = scrollLeft - walk;
        });
        
        table.addEventListener('touchend', () => {
            isScrolling = false;
        });
    });
}

/**
 * Optimize form inputs for mobile
 */
function optimizeMobileInputs() {
    // Prevent zoom on input focus
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (window.innerWidth < 768) {
                document.querySelector('meta[name="viewport"]').setAttribute(
                    'content', 
                    'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
                );
            }
        });
        
        input.addEventListener('blur', function() {
            document.querySelector('meta[name="viewport"]').setAttribute(
                'content', 
                'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes'
            );
        });
    });
}

/**
 * Handle mobile tab scrolling
 */
function initMobileTabScroll() {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;
    
    // Add scroll indicators
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'tab-scroll-indicator';
    tabsContainer.parentElement.insertBefore(scrollIndicator, tabsContainer);
    
    // Check scroll position
    function checkTabScroll() {
        const maxScroll = tabsContainer.scrollWidth - tabsContainer.clientWidth;
        const currentScroll = tabsContainer.scrollLeft;
        
        if (maxScroll > 0) {
            scrollIndicator.style.display = 'block';
            
            if (currentScroll > 0 && currentScroll < maxScroll) {
                scrollIndicator.className = 'tab-scroll-indicator both';
            } else if (currentScroll > 0) {
                scrollIndicator.className = 'tab-scroll-indicator left';
            } else {
                scrollIndicator.className = 'tab-scroll-indicator right';
            }
        } else {
            scrollIndicator.style.display = 'none';
        }
    }
    
    tabsContainer.addEventListener('scroll', checkTabScroll);
    window.addEventListener('resize', checkTabScroll);
    checkTabScroll();
}

/**
 * Improve mobile modal handling
 */
function optimizeMobileModals() {
    const modals = document.querySelectorAll('.modal');
    
    modals.forEach(modal => {
        // Prevent body scroll when modal is open
        modal.addEventListener('touchmove', function(e) {
            if (!e.target.closest('.modal-content')) {
                e.preventDefault();
            }
        });
        
        // Close modal on swipe down
        let touchStartY = 0;
        let touchEndY = 0;
        
        modal.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });
        
        modal.addEventListener('touchend', function(e) {
            touchEndY = e.changedTouches[0].clientY;
            
            // Swipe down to close
            if (touchStartY < touchEndY - 50 && 
                e.target.closest('.modal-header')) {
                closeModal();
            }
        });
    });
}

/**
 * Add pull-to-refresh functionality
 */
function initPullToRefresh() {
    let touchStartY = 0;
    let touchEndY = 0;
    
    document.addEventListener('touchstart', function(e) {
        if (window.scrollY === 0) {
            touchStartY = e.touches[0].clientY;
        }
    });
    
    document.addEventListener('touchend', function(e) {
        if (window.scrollY === 0) {
            touchEndY = e.changedTouches[0].clientY;
            
            // Pull down to refresh
            if (touchEndY > touchStartY + 100) {
                showRefreshIndicator();
                setTimeout(() => {
                    updateDashboard();
                    renderAllTables();
                    hideRefreshIndicator();
                    showSuccess('Data refreshed!');
                }, 1000);
            }
        }
    });
}

/**
 * Show refresh indicator
 */
function showRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'refresh-indicator';
    indicator.innerHTML = '<div class="refresh-spinner"></div> Refreshing...';
    document.body.appendChild(indicator);
}

/**
 * Hide refresh indicator
 */
function hideRefreshIndicator() {
    const indicator = document.querySelector('.refresh-indicator');
    if (indicator) {
        indicator.remove();
    }
}

/**
 * Optimize chart size for mobile
 */
function optimizeMobileCharts() {
    if (window.innerWidth < 768) {
        // Update chart options for mobile
        Chart.defaults.font.size = 10;
        Chart.defaults.plugins.legend.display = false;
        
        // Redraw charts
        if (window.portfolioChart) {
            window.portfolioChart.options.maintainAspectRatio = false;
            window.portfolioChart.update();
        }
        
        if (window.diversificationChart) {
            window.diversificationChart.options.maintainAspectRatio = false;
            window.diversificationChart.update();
        }
    }
}

/**
 * Handle orientation change
 */
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        updateDashboard();
        optimizeMobileCharts();
    }, 300);
});

/**
 * Show mobile section
 */
function showMobileSection(section) {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.target.closest('.nav-item').classList.add('active');
    
    // Show appropriate section
    switch(section) {
        case 'dashboard':
            // Scroll to top
            window.scrollTo(0, 0);
            // Hide tabs, show dashboard
            document.querySelector('.tabs').style.display = 'none';
            document.querySelector('.tab-content').style.display = 'none';
            document.querySelector('.dashboard-grid').style.display = 'grid';
            document.querySelector('.wealth-phase-section').style.display = 'block';
            break;
            
        case 'portfolio':
            // Show portfolio tabs
            document.querySelector('.dashboard-grid').style.display = 'none';
            document.querySelector('.wealth-phase-section').style.display = 'none';
            document.querySelector('.tabs').style.display = 'flex';
            document.querySelector('.tab-content').style.display = 'block';
            // Click stocks tab
            document.querySelector('.tab[onclick*="stocks"]').click();
            break;
            
        case 'analytics':
            // Show analytics tab
            document.querySelector('.dashboard-grid').style.display = 'none';
            document.querySelector('.wealth-phase-section').style.display = 'none';
            document.querySelector('.tabs').style.display = 'flex';
            document.querySelector('.tab-content').style.display = 'block';
            // Click analytics tab
            document.querySelector('.tab[onclick*="analytics"]').click();
            break;
            
        case 'more':
            // Show more options menu
            showMobileMoreMenu();
            break;
    }
}

/**
 * Show mobile more menu
 */
function showMobileMoreMenu() {
    const moreMenu = document.createElement('div');
    moreMenu.className = 'mobile-more-menu';
    moreMenu.innerHTML = `
        <div class="more-menu-overlay" onclick="closeMobileMoreMenu()"></div>
        <div class="more-menu-content">
            <h3>More Options</h3>
            <button class="more-menu-item" onclick="toggleBiculturalView(); closeMobileMoreMenu();">
                🇮🇳🇫🇮 Bicultural View
            </button>
            <button class="more-menu-item" onclick="showMorningCheckIn(); closeMobileMoreMenu();">
                ☀️ Morning Check-in
            </button>
            <button class="more-menu-item" onclick="showInvestmentBible(); closeMobileMoreMenu();">
                📖 Investment Bible
            </button>
            <button class="more-menu-item" onclick="exportData(); closeMobileMoreMenu();">
                📥 Export Data
            </button>
            <button class="more-menu-item" onclick="importData(); closeMobileMoreMenu();">
                📤 Import Data
            </button>
            <button class="more-menu-item" onclick="toggleTheme(); closeMobileMoreMenu();">
                🌓 Toggle Theme
            </button>
        </div>
    `;
    document.body.appendChild(moreMenu);
    
    // Animate in
    setTimeout(() => {
        moreMenu.classList.add('show');
    }, 10);
}

/**
 * Close mobile more menu
 */
function closeMobileMoreMenu() {
    const moreMenu = document.querySelector('.mobile-more-menu');
    if (moreMenu) {
        moreMenu.classList.remove('show');
        setTimeout(() => {
            moreMenu.remove();
        }, 300);
    }
}

/**
 * Initialize mobile features
 */
document.addEventListener('DOMContentLoaded', function() {
    if (window.innerWidth < 768) {
        initMobileTableScroll();
        optimizeMobileInputs();
        initMobileTabScroll();
        optimizeMobileModals();
        initPullToRefresh();
        optimizeMobileCharts();
        
        // Add mobile class to body
        document.body.classList.add('mobile');
    }
    
    // Check on resize
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth < 768) {
                document.body.classList.add('mobile');
            } else {
                document.body.classList.remove('mobile');
                // Close mobile menu if open
                if (mobileMenuOpen) {
                    toggleMobileMenu();
                }
            }
        }, 250);
    });
});