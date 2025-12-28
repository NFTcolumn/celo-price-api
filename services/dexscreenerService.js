const axios = require('axios');

class DexScreenerService {
  constructor() {
    this.baseUrl = 'https://api.dexscreener.com/latest/dex';
  }

  /**
   * Search for token pairs on DexScreener
   */
  async searchToken(tokenAddress, chainId = 'celo') {
    try {
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: { q: tokenAddress },
        timeout: 5000,
      });

      if (!response.data || !response.data.pairs) {
        return {
          success: false,
          error: 'No data found',
        };
      }

      // Filter for the specific chain
      const pairs = response.data.pairs.filter(pair =>
        pair.chainId.toLowerCase() === chainId.toLowerCase()
      );

      if (pairs.length === 0) {
        return {
          success: false,
          error: `No pairs found on ${chainId}`,
        };
      }

      // Get the most liquid pair
      const bestPair = pairs.sort((a, b) =>
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

      return {
        success: true,
        source: 'DexScreener',
        chainId: bestPair.chainId,
        dexId: bestPair.dexId,
        pairAddress: bestPair.pairAddress,
        baseToken: {
          address: bestPair.baseToken.address,
          symbol: bestPair.baseToken.symbol,
          name: bestPair.baseToken.name,
        },
        quoteToken: {
          address: bestPair.quoteToken.address,
          symbol: bestPair.quoteToken.symbol,
          name: bestPair.quoteToken.name,
        },
        priceUsd: parseFloat(bestPair.priceUsd || 0),
        priceNative: parseFloat(bestPair.priceNative || 0),
        volume24h: bestPair.volume?.h24 || 0,
        liquidity: bestPair.liquidity?.usd || 0,
        priceChange24h: bestPair.priceChange?.h24 || 0,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('DexScreener API error:', error.message);
      return {
        success: false,
        source: 'DexScreener',
        error: error.message,
      };
    }
  }

  /**
   * Get token pairs by address
   */
  async getTokenPairs(tokenAddress, chainId = 'celo') {
    try {
      const response = await axios.get(`${this.baseUrl}/tokens/${tokenAddress}`, {
        timeout: 5000,
      });

      if (!response.data || !response.data.pairs) {
        return {
          success: false,
          error: 'No pairs found',
        };
      }

      // Filter for the specific chain
      const pairs = response.data.pairs.filter(pair =>
        pair.chainId.toLowerCase() === chainId.toLowerCase()
      );

      return {
        success: true,
        source: 'DexScreener',
        chainId,
        pairs: pairs.map(pair => ({
          dexId: pair.dexId,
          pairAddress: pair.pairAddress,
          baseToken: pair.baseToken.symbol,
          quoteToken: pair.quoteToken.symbol,
          priceUsd: parseFloat(pair.priceUsd || 0),
          priceNative: parseFloat(pair.priceNative || 0),
          volume24h: pair.volume?.h24 || 0,
          liquidity: pair.liquidity?.usd || 0,
        })),
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('DexScreener API error:', error.message);
      return {
        success: false,
        source: 'DexScreener',
        error: error.message,
      };
    }
  }
}

module.exports = DexScreenerService;
