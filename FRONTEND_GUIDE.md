# Frontend Guide

## 🎨 Beautiful Web Interface for Crypto Price Aggregator

The frontend provides a modern, dark-themed interface to interact with your Celo token price API.

## 🚀 Quick Start

1. **Start the server** (if not already running):
   ```bash
   npm start
   ```

2. **Open in browser**:
   ```
   http://localhost:3005
   ```

## ✨ Features

### 1. Token Price Lookup
- Enter any Celo token address
- Select your preferred currency (USD, EUR, GBP, JPY, etc.)
- See price from multiple sources (Ubeswap + DexScreener)
- View detailed pricing information:
  - Price in USD
  - Price in CELO
  - Tokens per CELO
  - Calculation method

### 2. Token Value Calculator
- Enter token address and amount
- Instantly calculate total value in any currency
- Perfect for portfolio tracking

### 3. Swap Quote Simulator
- Simulate swaps between any two tokens
- See exact output amounts before swapping
- View the swap path (direct or multi-hop)
- Choose from common tokens or enter custom addresses

### 4. Common Tokens Quick Access
- Click any common token to instantly check its price
- Pre-loaded with CELO, cUSD, cEUR, cREAL, USDC, USDT, WETH

### 5. Real-time Stats
- Live CELO price ticker
- API health status
- Cache statistics
- Auto-refresh every 30 seconds

## 🎯 How to Use

### Check Token Price
1. Paste token address in "Token Price Lookup"
2. Select currency
3. Click "Get Price"
4. View comprehensive pricing data from multiple sources

### Calculate Portfolio Value
1. Go to "Token Value Calculator"
2. Enter token address
3. Enter amount you own
4. Select currency
5. Click "Calculate Value"
6. See total value instantly

### Simulate a Swap
1. Go to "Swap Quote"
2. Select or enter token you want to swap FROM
3. Enter amount
4. Select or enter token you want to swap TO
5. Click "Get Quote"
6. See how much you'll receive

## 🎨 Design Features

- **Dark Theme**: Easy on the eyes for extended use
- **Responsive**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Auto-refreshing stats
- **Loading States**: Clear feedback while fetching data
- **Error Handling**: Helpful error messages
- **Gradient Accents**: Modern purple/blue gradients
- **Smooth Animations**: Professional transitions and effects

## ⌨️ Keyboard Shortcuts

- Press **Enter** in any input field to submit that form
- Quick navigation between sections

## 🔧 Customization

### Update Colors
Edit `public/styles.css` and modify the CSS variables:
```css
:root {
    --primary: #6366f1;
    --secondary: #8b5cf6;
    --success: #10b981;
    /* etc. */
}
```

### Add More Currencies
Edit `public/app.js` and add to `CURRENCY_SYMBOLS`:
```javascript
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    YourCurrency: 'Symbol',
};
```

### Change API Port
If you change the API port, update `public/app.js`:
```javascript
const API_BASE = 'http://localhost:YOUR_PORT';
```

## 🌐 API Integration

The frontend automatically connects to your API at `http://localhost:3005`.

All API endpoints are accessible:
- `GET /price/:tokenAddress`
- `GET /value/:tokenAddress/:amount`
- `GET /quote`
- `GET /tokens`
- `GET /currencies`
- `GET /health`

## 📱 Mobile Friendly

The interface is fully responsive and works great on:
- Desktop browsers
- Tablets
- Mobile phones

## 🐛 Troubleshooting

**Frontend shows "API Offline":**
- Make sure the server is running on port 3005
- Check console for errors
- Verify `.env` file has correct PORT setting

**Prices not loading:**
- Check browser console for errors
- Verify you're using valid Celo token addresses
- Ensure Celo RPC endpoint is accessible

**Styling looks broken:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that `styles.css` loaded correctly

## 🎯 Next Steps

1. Bookmark `http://localhost:3005` for quick access
2. Try different tokens and currencies
3. Customize the theme to your liking
4. Share with your team!

## 💡 Pro Tips

- Use the common tokens section for quick price checks
- The value calculator is perfect for tracking your holdings
- Swap quotes update in real-time - no need to refresh
- CELO price in the header auto-updates every 30 seconds
