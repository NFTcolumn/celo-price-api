# Crypto Price Aggregator API

A multi-source token price aggregation API focused on Celo and Ubeswap. Get real-time token prices by simulating DEX swaps and aggregating data from multiple sources.

## Features

- 💱 **Swap Simulation**: Simulates Ubeswap swaps to get accurate token prices
- 🌐 **Multi-Currency**: Convert prices to USD, EUR, GBP, JPY, and more
- 📊 **Multiple Sources**: Aggregates data from Ubeswap and DexScreener
- ⚡ **Fast**: Built-in caching for quick responses
- 🔄 **Smart Routing**: Automatically finds best swap paths (direct or multi-hop)

## How It Works

1. **Get CELO/USD base price** - Simulates CELO→cUSD swap
2. **Simulate token swap** - Swaps 1 CELO for your token to see output
3. **Calculate price** - `token_price_usd = celo_price_usd / tokens_received`
4. **Convert currency** - Multiply by forex rates for other currencies

## Installation

```bash
cd crypto-price-aggregator
npm install
cp .env.example .env
```

## Usage

Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

Test the API:
```bash
npm test
```

## API Endpoints

### GET /price/:tokenAddress
Get token price in any supported currency.

**Example:**
```bash
# CELO price in USD
curl http://localhost:3005/price/0x471EcE3750Da237f93B8E339c536989b8978a438

# CELO price in EUR
curl http://localhost:3005/price/0x471EcE3750Da237f93B8E339c536989b8978a438?currency=EUR
```

**Response:**
```json
{
  "tokenAddress": "0x471EcE3750Da237f93B8E339c536989b8978a438",
  "currency": "USD",
  "primaryPrice": 0.6523,
  "primarySource": "Ubeswap",
  "sources": {
    "ubeswap": {
      "success": true,
      "price": 0.6523,
      "priceUsd": 0.6523,
      "priceCelo": 1,
      "token": {
        "symbol": "CELO",
        "name": "Celo native asset",
        "decimals": 18
      }
    },
    "dexscreener": {
      "success": true,
      "price": 0.6531,
      "priceUsd": 0.6531,
      "liquidity": 1234567
    }
  },
  "averagePrice": 0.6527,
  "timestamp": 1703123456789
}
```

### GET /value/:tokenAddress/:amount
Get the total value of a specific amount of tokens.

**Example:**
```bash
# Value of 100 CELO in USD
curl http://localhost:3005/value/0x471EcE3750Da237f93B8E339c536989b8978a438/100
```

### GET /quote
Get a swap quote between two tokens.

**Example:**
```bash
# How much cUSD for 1 CELO?
curl "http://localhost:3005/quote?tokenIn=0x471EcE3750Da237f93B8E339c536989b8978a438&tokenOut=0x765DE816845861e75A25fCA122bb6898B8B1282a&amountIn=1"
```

**Response:**
```json
{
  "success": true,
  "source": "Ubeswap",
  "tokenIn": {
    "symbol": "CELO",
    "address": "0x471EcE3750Da237f93B8E339c536989b8978a438"
  },
  "tokenOut": {
    "symbol": "cUSD",
    "address": "0x765DE816845861e75A25fCA122bb6898B8B1282a"
  },
  "amountIn": 1,
  "amountOut": 0.6523,
  "price": 0.6523,
  "path": ["0x471EcE3750Da237f93B8E339c536989b8978a438", "0x765DE816845861e75A25fCA122bb6898B8B1282a"]
}
```

### GET /tokens
List common Celo token addresses.

### GET /currencies
List supported fiat currencies and conversion rates.

### GET /health
API health check.

## Common Token Addresses

```javascript
CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438'
cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a'
cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73'
cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787'
USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C'
```

## Supported Currencies

USD, EUR, GBP, JPY, CNY, INR, BRL, CAD, AUD, MXN

## Configuration

Edit `.env` file:

```env
PORT=3005
CELO_RPC_URL=https://forno.celo.org
CACHE_TTL=30
```

## Architecture

```
services/
  ├── ubeswapService.js      # Ubeswap swap simulation
  ├── dexscreenerService.js  # DexScreener API integration
  └── priceAggregator.js     # Aggregates multiple sources

config/
  └── constants.js           # Token addresses, ABIs, constants

server.js                    # Express API server
```

## Price Calculation Method

The API uses **swap simulation** to get accurate prices:

1. **Base Price**: Simulate `1 CELO → cUSD` to get CELO price in USD
2. **Token Price**: Simulate `1 CELO → TOKEN` to see how much TOKEN you get
3. **Calculate**: `token_price = celo_price / tokens_received`

This method is more reliable than liquidity pool ratios for new/low-liquidity tokens.

## Future Enhancements

- [ ] Add more DEX sources (Sushiswap, etc.)
- [ ] Live forex rates via API
- [ ] WebSocket support for real-time prices
- [ ] Historical price data
- [ ] Support for other chains (Polygon, BSC, Base)
- [ ] Rate limiting and API keys
- [ ] GraphQL endpoint

## License

MIT
