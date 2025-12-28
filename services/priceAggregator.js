const UbeswapService = require('./ubeswapService');
const DexScreenerService = require('./dexscreenerService');
const { FIAT_RATES } = require('../config/constants');

class PriceAggregator {
  constructor(rpcUrl) {
    this.ubeswap = new UbeswapService(rpcUrl);
    this.dexscreener = new DexScreenerService();
  }

  /**
   * Get token price from multiple sources and aggregate
   */
  async getAggregatedPrice(tokenAddress, currency = 'USD') {
    const results = await Promise.allSettled([
      this.ubeswap.getTokenPrice(tokenAddress, currency, FIAT_RATES),
      this.dexscreener.searchToken(tokenAddress, 'celo'),
    ]);

    const ubeswapResult = results[0].status === 'fulfilled' ? results[0].value : null;
    const dexscreenerResult = results[1].status === 'fulfilled' ? results[1].value : null;

    // Prepare response
    const response = {
      tokenAddress,
      currency,
      timestamp: Date.now(),
      sources: {},
    };

    // Add Ubeswap data
    if (ubeswapResult && ubeswapResult.success) {
      response.sources.ubeswap = {
        success: true,
        price: ubeswapResult.price,
        priceUsd: ubeswapResult.priceUsd,
        priceCelo: ubeswapResult.priceCelo,
        token: ubeswapResult.token,
        method: ubeswapResult.method,
      };
      response.primaryPrice = ubeswapResult.price;
      response.primarySource = 'Ubeswap';
    } else {
      response.sources.ubeswap = {
        success: false,
        error: ubeswapResult?.error || 'Unknown error',
      };
    }

    // Add DexScreener data
    if (dexscreenerResult && dexscreenerResult.success) {
      const dexPrice = dexscreenerResult.priceUsd / (FIAT_RATES[currency] || 1);
      response.sources.dexscreener = {
        success: true,
        price: dexPrice,
        priceUsd: dexscreenerResult.priceUsd,
        liquidity: dexscreenerResult.liquidity,
        volume24h: dexscreenerResult.volume24h,
        dexId: dexscreenerResult.dexId,
      };

      // Use DexScreener as primary if Ubeswap failed
      if (!response.primaryPrice) {
        response.primaryPrice = dexPrice;
        response.primarySource = 'DexScreener';
      }
    } else {
      response.sources.dexscreener = {
        success: false,
        error: dexscreenerResult?.error || 'Unknown error',
      };
    }

    // Calculate average if both sources available
    if (response.sources.ubeswap.success && response.sources.dexscreener.success) {
      response.averagePrice = (response.sources.ubeswap.price + response.sources.dexscreener.price) / 2;
      response.priceDifference = Math.abs(response.sources.ubeswap.price - response.sources.dexscreener.price);
      response.priceDifferencePercent = (response.priceDifference / response.averagePrice) * 100;
    }

    return response;
  }

  /**
   * Get token value for a specific amount
   */
  async getTokenValue(tokenAddress, amount, currency = 'USD') {
    const priceData = await this.getAggregatedPrice(tokenAddress, currency);

    return {
      ...priceData,
      amount: parseFloat(amount),
      totalValue: priceData.primaryPrice ? priceData.primaryPrice * parseFloat(amount) : null,
    };
  }

  /**
   * Get swap quote from Ubeswap
   */
  async getSwapQuote(tokenIn, tokenOut, amountIn) {
    return await this.ubeswap.getSwapQuote(tokenIn, tokenOut, amountIn);
  }
}

module.exports = PriceAggregator;
