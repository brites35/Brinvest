document.addEventListener('DOMContentLoaded', () => {
    const ids = ['stocks_button','etfs_button','currency_button','news_button', 'watchlist_button'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', () => {
            if (id === 'stocks_button') load_stocks_page();
            if (id === 'currency_button') load_currency_page();
            if (id === 'watchlist_button') load_watchlist_page();
            if (id === 'news_button') load_news_page();
        });
    });
    // Load default page: if index (Main_page) is visible at load, populate Top Stocks
    const main = document.getElementById('Main_page');
    const tableBody = document.querySelector('#tops_container .tops-block:first-of-type .tops-table tbody');
    try {
        if (main && tableBody && window.getComputedStyle(main).display !== 'none'){
            populateTopStocks();
        }
    } catch (e){
        console.warn('Could not auto-load top stocks at startup', e);
    }
});

function hideAllPages(){
    ['Main_page','Stocks_page','Watchlist_page','Currency_page','News_page'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function setActiveNav(activeId){
    const navIds = ['stocks_button','currency_button','news_button', 'watchlist_button'];
    navIds.forEach(id => {
        const el = document.querySelector('.vertical-navbar #' + id);
        if (el) el.style.background = 'transparent';
    });
    const active = document.querySelector('.vertical-navbar #' + activeId);
    if (active) active.style.background = '#c7c7c7';
}

function load_stocks_page(){
    hideAllPages();
    const stocksPage = document.getElementById('Stocks_page');
    if (stocksPage) stocksPage.style.display = 'block';
    setActiveNav('stocks_button');
    //populateTopStocks();
}

function load_currency_page(){
    hideAllPages();
    const el = document.getElementById('Currency_page'); 
    if (el) el.style.display = 'block';
    setActiveNav('currency_button');
}

function load_watchlist_page(){
    hideAllPages();
    const el = document.getElementById('Watchlist_page'); 
    if (el) el.style.display = 'block';
    setActiveNav('watchlist_button');
}

function load_news_page(){
    hideAllPages();
    const el = document.getElementById('News_page'); 
    if (el) el.style.display = 'block';
    setActiveNav('news_button');
}

function populateTopStocks(){
    //target the first tops-block table body
    const tbody = document.querySelector('#tops_container .tops-block#Stocks-block .tops-table tbody');
    if (!tbody) { console.warn('Top Stocks table body not found'); return; }

    //show a loading row
    tbody.innerHTML = '<tr><td colspan="3">Loading…</td></tr>';

    //fetch from the DB-backed API endpoint
    fetch('/api/stocks')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(arr => {
            if (!Array.isArray(arr) || !arr.length){ tbody.innerHTML = '<tr><td colspan="3">No data</td></tr>'; return; }

            tbody.innerHTML = '';
            arr.slice(0, 15).forEach(item => {
                const symbol = item.symbol || '';
                const name = item.name;
                const price = (item.price !== undefined && item.price !== null) ? Number(item.price).toFixed(2) : '';
                const tr = document.createElement('tr');
                tr.innerHTML = `<td style="width:20%">${symbol}</td><td>${name}</td><td>${price}</td>`;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            console.error('Failed to load /api/stocks', err);
            tbody.innerHTML = '<tr><td colspan="3">Error loading data</td></tr>';
        });
}