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

    // Back/Forward browser buttons
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

function search_stock(instance){
    const search = document.getElementsByClassName('stock-search-input')[instance || 0];
    if (search){
        search.addEventListener('keypress', (e) => {
            if (e.key === 'Enter'){
                const symbol = search.value.trim().toUpperCase();
                fetch('/api/stocks').then(res => {
                    if (!res.ok) throw new Error('Failed to fetch stocks');
                    return res.json();
                }).then(arr => {
                    const found = arr.find(item => item.symbol.toUpperCase() === symbol) || arr.find(item => item.name.toUpperCase().includes(symbol));
                    if (found){
                        load_stock_page(found.symbol);
                    }
                });
            }
        });
    }
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

    search_stock(0);
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

    search_stock(1);
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
    fetch('/api/stocks')
        .then(res => {
            if (!res.ok) throw new Error('Failed to fetch stock');
            return res.json();
        })
        .then(data => {
            data = data.find(item => item.symbol.toUpperCase() === symbol.toUpperCase());
            console.log("Stock data:", data);
            const stkPage = document.querySelector('#Stock_page');
            if (stkPage){
                let watchlistUrl = data.is_watched ? '/static/Brinvest/starFilled.png' : '/static/Brinvest/starNotFill.png';
                const starClass = data.is_watched ? 'star-filled' : 'star-empty';
                let iconHtml = '';
                if (window.currentUser && window.currentUser !== "") {
                    iconHtml = `<img id="watchlist-icon" style="cursor: pointer;" class="${starClass}" src="${watchlistUrl}" alt="watchlist star">`;
                }
                stkPage.innerHTML = `
                    <div class="header-container" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <h2 style="margin: 0; padding-right: 15px;">
                            ${data.name} (${data.symbol}) - $${Number(data.price).toFixed(2)}
                        </h2>
                        ${iconHtml}
                    </div>
                    
                    <div style="display: flex; gap: 40px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
                        <div>
                            <p><strong>P/E Ratio:</strong> ${data.pe_ratio ? Number(data.pe_ratio).toFixed(2) : 'N/A'}</p>
                            <p><strong>Market Cap:</strong> ${data.market_cap ? Number(data.market_cap).toLocaleString() : 'N/A'}</p>
                            <p><strong>Exchange:</strong> ${data.exchange || 'N/A'}</p>
                        </div>
                    </div>`;

                // Add watchlist toggle handler if user is logged in

                if (iconHtml !== '') {
                    document.querySelector('#watchlist-icon').addEventListener('click', () => {

                        fetch('/stocks/' + symbol, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': getCookie('csrftoken')
                            },
                            body: JSON.stringify({watch: !document.querySelector('#watchlist-icon').src.includes('starFilled.png')})
                        }).then(res => {
                            if (!res.ok) throw new Error('Failed to update watchlist');
                            return res.json();
                        }).then(data => {
                            const icon = document.querySelector('#watchlist-icon');
                            icon.src = data.is_watched ? '/static/Brinvest/starFilled.png' : '/static/Brinvest/starNotFill.png';

                            if (data.is_watched) {
                                icon.classList.add('star-filled');
                                icon.classList.remove('star-empty');
                            } else {
                                icon.classList.add('star-empty');
                                icon.classList.remove('star-filled');
                            }
                        });
                    });
                }
            }
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

// API

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
                const marketCap = item.market_cap ? Number(item.market_cap).toLocaleString() : '';
                const peRatio = item.pe_ratio ? Number(item.pe_ratio).toFixed(2) : '';
                const shrOuts = item.shares_outs ? Number(item.shares_outs).toLocaleString() : '';
                const exchange = item.exchange?.split(' ').slice(0, 2).join(' ') || '';

                const tr = document.createElement('tr');
                if (page == 'stocks'){
                    tr.innerHTML =`<td style="width:10%"><span class="stock-text"style="cursor:pointer; text-decoration:underline">${symbol}</span></td><td style="width:35%">${name}</td></td><td style="width:12%; text-align: center">${price}</td><td style="width:12%; text-align: center;">${peRatio}</td></td><td style="width:15%; text-align: center;">${marketCap}</td><td style="width:16%; text-align: center; white-space: nowrap;">${exchange}</td>`;
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

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}