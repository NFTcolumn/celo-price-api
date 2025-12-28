require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const NodeCache = require('node-cache');
const PriceAggregator = require('./services/priceAggregator');
const { TOKENS, FIAT_RATES } = require('./config/constants');

const app = express();
const PORT = process.env.PORT || 3000;
const RPC_URL = process.env.CELO_RPC_URL || 'https://forno.celo.org';
const CACHE_TTL = parseInt(process.env.CACHE_TTL) || 30;

// Initialize cache
const cache = new NodeCache({ stdTTL: CACHE_TTL });

// Initialize price aggregator
const priceAggregator = new PriceAggregator(RPC_URL);

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/**
 * GET /api
 * API documentation (moved from root to /api)
 */
app.get('/api', (req, res) => {
  res.json({
    name: 'Crypto Price Aggregator API',
    version: '1.0.0',
    description: 'Multi-source token price aggregation for Celo/Ubeswap',
    endpoints: {
      'GET /price/:tokenAddress': 'Get token price in USD or other currency',
      'GET /value/:tokenAddress/:amount': 'Get value of specific token amount',
      'GET /quote': 'Get swap quote between two tokens',
      'GET /tokens': 'List common token addresses',
      'GET /currencies': 'List supported currencies',
      'GET /health': 'Health check',
    },
    examples: {
      price: '/price/0x471EcE3750Da237f93B8E339c536989b8978a438?currency=EUR',
      value: '/value/0x471EcE3750Da237f93B8E339c536989b8978a438/100?currency=USD',
      quote: '/quote?tokenIn=0x471EcE3750Da237f93B8E339c536989b8978a438&tokenOut=0x765DE816845861e75A25fCA122bb6898B8B1282a&amountIn=1',
    },
  });
});

/**
 * GET /price/:tokenAddress
 * Get token price
 */
app.get('/price/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const { currency = 'USD' } = req.query;

    // Check cache
    const cacheKey = `price:${tokenAddress}:${currency}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    // Get fresh data
    const result = await priceAggregator.getAggregatedPrice(tokenAddress, currency.toUpperCase());

    // Cache result
    if (result.primaryPrice) {
      cache.set(cacheKey, result);
    }

    res.json({ ...result, cached: false });
  } catch (error) {
    console.error('Error in /price:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /value/:tokenAddress/:amount
 * Get value of specific amount of tokens
 */
app.get('/value/:tokenAddress/:amount', async (req, res) => {
  try {
    const { tokenAddress, amount } = req.params;
    const { currency = 'USD' } = req.query;

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const result = await priceAggregator.getTokenValue(tokenAddress, amount, currency.toUpperCase());
    res.json(result);
  } catch (error) {
    console.error('Error in /value:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /quote
 * Get swap quote between two tokens
 */
app.get('/quote', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn = 1 } = req.query;

    if (!tokenIn || !tokenOut) {
      return res.status(400).json({
        success: false,
        error: 'tokenIn and tokenOut are required',
      });
    }

    if (isNaN(amountIn) || parseFloat(amountIn) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amountIn',
      });
    }

    const result = await priceAggregator.getSwapQuote(tokenIn, tokenOut, parseFloat(amountIn));
    res.json(result);
  } catch (error) {
    console.error('Error in /quote:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /tokens
 * List common token addresses
 */
app.get('/tokens', (req, res) => {
  res.json({
    success: true,
    chain: 'Celo',
    tokens: TOKENS,
  });
});

/**
 * GET /currencies
 * List supported fiat currencies
 */
app.get('/currencies', (req, res) => {
  res.json({
    success: true,
    currencies: Object.keys(FIAT_RATES),
    rates: FIAT_RATES,
    note: 'Rates are approximate and updated periodically',
  });
});

/**
 * GET /health
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    uptime: process.uptime(),
    cache: {
      keys: cache.keys().length,
      stats: cache.getStats(),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: ['/price/:token', '/value/:token/:amount', '/quote', '/tokens', '/currencies', '/health'],
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Crypto Price Aggregator`);
  console.log(`📍 Frontend: http://localhost:${PORT}`);
  console.log(`📍 API Docs: http://localhost:${PORT}/api`);
  console.log(`🔗 RPC: ${RPC_URL}`);
  console.log(`⏱️  Cache TTL: ${CACHE_TTL}s\n`);
});
