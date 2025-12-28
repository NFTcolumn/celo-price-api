const API_BASE = 'http://localhost:3005';

// Currency symbols
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CNY: '¥',
    INR: '₹',
    BRL: 'R$',
    CAD: 'C$',
    AUD: 'A$',
    MXN: '$',
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    loadCommonTokens();

    // Auto-refresh CELO price and stats every 30 seconds
    setInterval(() => {
        updateCELOPrice();
        checkAPIStatus();
    }, 30000);

    // Initial CELO price load
    updateCELOPrice();

    // Token select handlers
    document.getElementById('tokenIn').addEventListener('change', handleTokenSelectChange);
    document.getElementById('tokenOut').addEventListener('change', handleTokenSelectChange);
});

// Check API health status
async function checkAPIStatus() {
    try {
        const response = await fetch(`${API_BASE}/health`);
        const data = await response.json();

        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (data.status === 'healthy') {
            statusDot.classList.add('online');
            statusText.textContent = 'API Online';

            // Update stats
            document.getElementById('cacheHits').textContent = data.cache.keys || 0;
            document.getElementById('uptime').textContent = Math.floor(data.uptime) || 0;
        } else {
            statusDot.classList.remove('online');
            statusText.textContent = 'API Offline';
        }
    } catch (error) {
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        statusDot.classList.remove('online');
        statusText.textContent = 'API Offline';
        console.error('API health check failed:', error);
    }
}

// Update CELO price in quick stats
async function updateCELOPrice() {
    try {
        const currency = document.getElementById('currency').value;
        const response = await fetch(`${API_BASE}/price/0x471EcE3750Da237f93B8E339c536989b8978a438?currency=${currency}`);
        const data = await response.json();

        if (data.primaryPrice) {
            const symbol = CURRENCY_SYMBOLS[currency] || '';
            document.getElementById('celoPrice').textContent = `${symbol}${data.primaryPrice.toFixed(4)}`;
            document.getElementById('celoCurrency').textContent = currency;
        }
    } catch (error) {
        console.error('Failed to update CELO price:', error);
        document.getElementById('celoPrice').textContent = '--';
    }
}

// Get token price
async function getTokenPrice() {
    const tokenAddress = document.getElementById('tokenAddress').value.trim();
    const currency = document.getElementById('currency').value;

    if (!tokenAddress) {
        showError('priceError', 'Please enter a token address');
        return;
    }

    // Show loading
    showElement('priceLoading');
    hideElement('priceResult');
    hideElement('priceError');

    try {
        const response = await fetch(`${API_BASE}/price/${tokenAddress}?currency=${currency}`);
        const data = await response.json();

        hideElement('priceLoading');

        if (data.primaryPrice) {
            // Display main price
            const symbol = CURRENCY_SYMBOLS[currency] || '';
            document.getElementById('tokenSymbol').textContent = data.sources.ubeswap?.token?.symbol || 'Token';
            document.getElementById('sourceBadge').textContent = data.primarySource;
            document.getElementById('currencySymbol').textContent = symbol;
            document.getElementById('mainPrice').textContent = formatNumber(data.primaryPrice);

            // Display details
            if (data.sources.ubeswap?.success) {
                document.getElementById('priceUsd').textContent = `$${formatNumber(data.sources.ubeswap.priceUsd)}`;
                document.getElementById('priceCelo').textContent = `${formatNumber(data.sources.ubeswap.priceCelo)} CELO`;

                // Calculate tokensPerCelo: if 1 PONY = X CELO, then 1 CELO = (1/X) PONY
                const priceCelo = data.sources.ubeswap.priceCelo;
                const tokensPerCelo = priceCelo > 0 ? 1 / priceCelo : 0;

                // Format large numbers as B/M/K
                if (tokensPerCelo >= 1000000000) {
                    document.getElementById('tokensPerCelo').textContent = (tokensPerCelo / 1000000000).toFixed(2) + 'B';
                } else if (tokensPerCelo >= 1000000) {
                    document.getElementById('tokensPerCelo').textContent = (tokensPerCelo / 1000000).toFixed(2) + 'M';
                } else if (tokensPerCelo >= 1000) {
                    document.getElementById('tokensPerCelo').textContent = (tokensPerCelo / 1000).toFixed(2) + 'K';
                } else {
                    document.getElementById('tokensPerCelo').textContent = tokensPerCelo.toFixed(2);
                }

                document.getElementById('method').textContent = data.sources.ubeswap.method || '--';
            }

            // Display sources comparison
            displaySourcesComparison(data.sources, currency);

            showElement('priceResult');
        } else {
            showError('priceError', data.error || 'Failed to fetch price data');
        }
    } catch (error) {
        hideElement('priceLoading');
        showError('priceError', `Error: ${error.message}`);
        console.error('Price fetch error:', error);
    }
}

// Display sources comparison
function displaySourcesComparison(sources, currency) {
    const container = document.getElementById('sourcesComparison');
    container.innerHTML = '';

    Object.entries(sources).forEach(([sourceName, sourceData]) => {
        const card = document.createElement('div');
        card.className = `source-card ${sourceData.success ? 'success' : 'error'}`;

        const name = document.createElement('div');
        name.className = 'source-name';
        name.textContent = sourceName.charAt(0).toUpperCase() + sourceName.slice(1);

        if (sourceData.success) {
            const price = document.createElement('div');
            price.className = 'source-price';
            const symbol = CURRENCY_SYMBOLS[currency] || '';
            price.textContent = `${symbol}${formatNumber(sourceData.price)}`;
            card.appendChild(name);
            card.appendChild(price);

            if (sourceData.liquidity) {
                const liquidity = document.createElement('div');
                liquidity.className = 'source-name';
                liquidity.textContent = `Liquidity: $${formatNumber(sourceData.liquidity)}`;
                card.appendChild(liquidity);
            }
        } else {
            const error = document.createElement('div');
            error.className = 'source-error';
            error.textContent = sourceData.error || 'Failed';
            card.appendChild(name);
            card.appendChild(error);
        }

        container.appendChild(card);
    });
}

// Calculate token value
async function calculateValue() {
    const tokenAddress = document.getElementById('valueTokenAddress').value.trim();
    const amount = parseFloat(document.getElementById('tokenAmount').value);
    const currency = document.getElementById('valueCurrency').value;

    if (!tokenAddress) {
        showError('valueError', 'Please enter a token address');
        return;
    }

    if (isNaN(amount) || amount <= 0) {
        showError('valueError', 'Please enter a valid amount');
        return;
    }

    showElement('valueLoading');
    hideElement('valueResult');
    hideElement('valueError');

    try {
        const response = await fetch(`${API_BASE}/value/${tokenAddress}/${amount}?currency=${currency}`);
        const data = await response.json();

        hideElement('valueLoading');

        if (data.totalValue) {
            const symbol = CURRENCY_SYMBOLS[currency] || '';
            const tokenSymbol = data.sources.ubeswap?.token?.symbol || 'tokens';

            document.getElementById('valueAmount').textContent = formatNumber(amount);
            document.getElementById('valueTokenSymbol').textContent = tokenSymbol;
            document.getElementById('valueCurrencySymbol').textContent = symbol;
            document.getElementById('totalValue').textContent = formatNumber(data.totalValue);

            showElement('valueResult');
        } else {
            showError('valueError', data.error || 'Failed to calculate value');
        }
    } catch (error) {
        hideElement('valueLoading');
        showError('valueError', `Error: ${error.message}`);
        console.error('Value calculation error:', error);
    }
}

// Get swap quote
async function getSwapQuote() {
    let tokenIn = document.getElementById('tokenIn').value;
    let tokenOut = document.getElementById('tokenOut').value;
    const amountIn = parseFloat(document.getElementById('amountIn').value);

    // Check for custom addresses
    if (tokenIn === '') {
        tokenIn = document.getElementById('tokenInCustom').value.trim();
    }
    if (tokenOut === '') {
        tokenOut = document.getElementById('tokenOutCustom').value.trim();
    }

    if (!tokenIn || !tokenOut) {
        showError('swapError', 'Please select or enter both tokens');
        return;
    }

    if (isNaN(amountIn) || amountIn <= 0) {
        showError('swapError', 'Please enter a valid amount');
        return;
    }

    showElement('swapLoading');
    hideElement('swapResult');
    hideElement('swapError');

    try {
        const response = await fetch(`${API_BASE}/quote?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}`);
        const data = await response.json();

        hideElement('swapLoading');

        if (data.success) {
            document.getElementById('swapAmountIn').textContent = formatNumber(data.amountIn);
            document.getElementById('swapTokenIn').textContent = data.tokenIn.symbol;
            document.getElementById('swapAmountOut').textContent = formatNumber(data.amountOut);
            document.getElementById('swapTokenOut').textContent = data.tokenOut.symbol;
            document.getElementById('swapRate').textContent = `1 ${data.tokenIn.symbol} = ${formatNumber(data.price)} ${data.tokenOut.symbol}`;

            // Display path
            const pathText = data.path.length === 2 ? 'Direct' : `Multi-hop (${data.path.length - 1} hops)`;
            document.getElementById('swapPath').textContent = pathText;

            showElement('swapResult');
        } else {
            showError('swapError', data.error || 'Failed to get swap quote');
        }
    } catch (error) {
        hideElement('swapLoading');
        showError('swapError', `Error: ${error.message}`);
        console.error('Swap quote error:', error);
    }
}

// Load common tokens
async function loadCommonTokens() {
    const container = document.getElementById('commonTokens');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading tokens...</p></div>';

    try {
        const response = await fetch(`${API_BASE}/tokens`);
        const data = await response.json();

        if (data.success && data.tokens) {
            container.innerHTML = '';

            Object.entries(data.tokens).forEach(([symbol, address]) => {
                const card = document.createElement('div');
                card.className = 'token-card';
                card.onclick = () => {
                    document.getElementById('tokenAddress').value = address;
                    getTokenPrice();
                };

                const name = document.createElement('div');
                name.className = 'token-name';
                name.textContent = symbol;

                const addr = document.createElement('div');
                addr.className = 'token-address';
                addr.textContent = `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

                card.appendChild(name);
                card.appendChild(addr);
                container.appendChild(card);
            });
        }
    } catch (error) {
        container.innerHTML = '<div class="error-message">Failed to load tokens</div>';
        console.error('Failed to load tokens:', error);
    }
}

// Handle token select change (show custom input if needed)
function handleTokenSelectChange(event) {
    const select = event.target;
    const customInputId = select.id + 'Custom';
    const customInput = document.getElementById(customInputId);

    if (select.value === '') {
        customInput.style.display = 'block';
    } else {
        customInput.style.display = 'none';
    }
}

// Utility functions
function formatNumber(num) {
    if (num === null || num === undefined) return '--';
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    // For very small numbers (like PONY price), show more precision
    if (num < 0.000000000001 && num > 0) {
        // Show as: "0.0000000000048" instead of scientific notation
        return num.toFixed(15);
    }
    if (num < 0.0001 && num > 0) {
        return num.toFixed(12);
    }
    return num.toFixed(num < 1 ? 8 : 2);
}

function showElement(id) {
    document.getElementById(id).style.display = 'block';
}

function hideElement(id) {
    document.getElementById(id).style.display = 'none';
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    element.textContent = message;
    element.style.display = 'block';
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.id === 'tokenAddress') {
        getTokenPrice();
    }
    if (e.key === 'Enter' && (e.target.id === 'valueTokenAddress' || e.target.id === 'tokenAmount')) {
        calculateValue();
    }
    if (e.key === 'Enter' && (e.target.id === 'tokenIn' || e.target.id === 'tokenOut' || e.target.id === 'amountIn')) {
        getSwapQuote();
    }
});
