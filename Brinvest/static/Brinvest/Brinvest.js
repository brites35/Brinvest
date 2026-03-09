document.addEventListener('DOMContentLoaded', () => {

    // Navigation button handlers
    const ids = ['stocks_button','currency_button','news_button','watchlist_button'];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('click', () => {

            if (id === 'stocks_button') load_stocks_page();
            if (id === 'currency_button') load_currency_page();
            if (id === 'watchlist_button') load_watchlist_page();
            if (id === 'news_button') load_news_page();

        });
    });

    // Back / Forward browser buttons
    window.addEventListener('popstate', router);

    // Run router on initial load for loading correct page when user refreshes on a specific url like .com/stocks/AAPL
    router();
});

function router(){
    const path = window.location.pathname;

    if (path === '/stocks'){
        load_stocks_page(false);
    }

    else if (path.startsWith('/stocks/')){
        const symbol = path.split('/')[2];
        load_stock_page(symbol, false);
    }

    else if (path === '/currency'){
        load_currency_page(false);
    }

    else if (path === '/news'){
        load_news_page(false);
    }

    else if (path === '/watchlist'){
        load_watchlist_page(false);
    }

    else {
        load_home_page(false);
    }
}

function hideAllPages(){
    ['Main_page','Stocks_page','Stock_page','Watchlist_page','Currency_page','News_page']
    .forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function setActiveNav(activeId){
    const navIds = ['stocks_button','currency_button','news_button','watchlist_button'];

    navIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.background = 'transparent';
    });

    const active = document.getElementById(activeId);
    if (active) active.style.background = '#c7c7c7';
}

function load_home_page(push=true){
    hideAllPages();
    const main = document.getElementById('Main_page');
    if (main) main.style.display = 'block';

    setActiveNav(null);

    if (push){
        history.pushState({}, '', '/');
    }

    populateTopStocks();
}

function load_stocks_page(push=true){
    hideAllPages();

    const stocksPage = document.getElementById('Stocks_page');
    if (stocksPage) stocksPage.style.display = 'block';

    setActiveNav('stocks_button');
    
    if (push){
        history.pushState({}, '', '/stocks');
    }
    populateTopStocks('stocks');
}

function load_stock_page(symbol, push=true){
    hideAllPages();

    const stockPage = document.getElementById('Stock_page');
    if (stockPage) stockPage.style.display = 'block';

    setActiveNav('stocks_button');

    if (push){
        history.pushState({}, '', '/stocks/' + symbol);
    }

    // Fetch stock data
    fetch('/api/stocks/' + symbol)
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch stock');
            return res.json();
        })
        .then(data => {
            console.log("Stock data:", data);
            // TODO: render stock info into Stock_page
        })
        .catch(err => {
            console.error(err);
        });
}

function load_currency_page(push=true){
    hideAllPages();

    const el = document.getElementById('Currency_page');
    if (el) el.style.display = 'block';

    setActiveNav('currency_button');

    if (push){
        history.pushState({}, '', '/currency');
    }
}

function load_watchlist_page(push=true){
    hideAllPages();

    const el = document.getElementById('Watchlist_page');
    if (el) el.style.display = 'block';

    setActiveNav('watchlist_button');

    if (push){
        history.pushState({}, '', '/watchlist');
    }
}

function load_news_page(push=true){
    hideAllPages();

    const el = document.getElementById('News_page');
    if (el) el.style.display = 'block';

    setActiveNav('news_button');

    if (push){
        history.pushState({}, '', '/news');
    }
}

/* --------------------------
   API
-------------------------- */

function populateTopStocks(page='home'){
    let tbody = document.querySelector('#tops_container .tops-block#Stocks-block .tops-table tbody');
    let num_stocks = 15;
    if (page == 'stocks'){
        tbody = document.querySelector('#stocks_container .tops-block#Stocks-block .tops-table tbody');
        num_stocks = 0;
    }

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3">Loading…</td></tr>';

    fetch('/api/stocks')
        .then(response => {
            if (!response.ok) throw new Error('Network error');
            return response.json();
        })
        .then(arr => {

            if (!Array.isArray(arr) || !arr.length){
                tbody.innerHTML = '<tr><td colspan="3">No data</td></tr>';
                return;
            }

            tbody.innerHTML = '';

            (num_stocks == 0 ? arr: arr.slice(0, num_stocks)).forEach(item => {

                const symbol = item.symbol || '';
                const name = item.name || '';
                const price = item.price ? Number(item.price).toFixed(2) : '';

                const tr = document.createElement('tr');
                if (page == 'stocks'){
                    tr.innerHTML =`<td style="width:10%"><span class="stock-text"style="cursor:pointer; text-decoration:underline">${symbol}</span></td><td style="width:30%">${name}</td></td><td style="width:10%">${price}</td><td style="width:25%">P/E RATIO</td></td><td style="width:25%">Market Cap</td>`;
                }else if (page == 'home'){
                    tr.innerHTML =`<td style="width:20%"><span class="stock-text"style="cursor:pointer; text-decoration:underline">${symbol}</span></td><td style="width:50%">${name}</td><td style="width:30%">${price}</td>`;
                }
                

                tbody.appendChild(tr);

                tr.querySelector('.stock-text').addEventListener('click', () => load_stock_page(symbol));
            });

        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = '<tr><td colspan="3">Error loading data</td></tr>';
        });
}