// Main Application Initialization

function initializeApp() {
    initPortfolio(); // Initialize portfolio from state management
    updateDashboard();
    renderAllTables();
    initializeCharts();
    updateTheme();
    checkMorningCheckIn();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

function toggleTheme() {
    const html = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        toggle.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        toggle.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    }
}

function updateTheme() {
    const savedTheme = localStorage.getItem('theme');
    const toggle = document.getElementById('themeToggle');
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        toggle.classList.add('dark');
    }
}

// Initialize app on load
window.onload = initializeApp;

// Close modal on outside click
window.onclick = function(event) {
    const investmentModal = document.getElementById('investmentModal');
    const morningModal = document.getElementById('morningCheckInModal');
    const bibleModal = document.getElementById('investmentBibleModal');
    
    if (event.target === investmentModal) {
        closeModal();
    } else if (event.target === morningModal) {
        morningModal.style.display = 'none';
    } else if (event.target === bibleModal) {
        bibleModal.style.display = 'none';
    }
}