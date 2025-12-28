const { ethers } = require('ethers');
const {
  UBESWAP_ROUTER,
  UBESWAP_V3_QUOTER,
  UBESWAP_FACTORY,
  UBESWAP_ROUTER_ABI,
  UBESWAP_V3_QUOTER_ABI,
  UBESWAP_FACTORY_ABI,
  PAIR_ABI,
  ERC20_ABI,
  TOKENS,
  V3_FEE_TIERS
} = require('../config/constants');

// Load manual prices for tokens without accessible liquidity
const manualPrices = require('../config/manual-prices.json');

class UbeswapService {
  constructor(rpcUrl) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.router = new ethers.Contract(UBESWAP_ROUTER, UBESWAP_ROUTER_ABI, this.provider);
    this.v3Quoter = new ethers.Contract(UBESWAP_V3_QUOTER, UBESWAP_V3_QUOTER_ABI, this.provider);
    this.factory = new ethers.Contract(UBESWAP_FACTORY, UBESWAP_FACTORY_ABI, this.provider);
    this.celoUsdPrice = null;
    this.lastCeloUpdate = 0;
  }

  /**
   * Get V3 quote for token swap
   */
  async getV3Quote(tokenIn, tokenOut, amountIn, tokenInDecimals) {
    const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInDecimals);

    // Try all fee tiers to find which one has liquidity
    for (const fee of V3_FEE_TIERS) {
      try {
        // Use callStatic to simulate the call without actually executing
        const amountOut = await this.v3Quoter.quoteExactInputSingle.staticCall(
          tokenIn,
          tokenOut,
          fee,
          amountInWei,
          0 // sqrtPriceLimitX96 = 0 means no limit
        );

        return {
          success: true,
          amountOut,
          fee,
          version: 'V3',
        };
      } catch (error) {
        // This fee tier doesn't have a pool, try next one
        continue;
      }
    }

    return { success: false, error: 'No V3 pool found for any fee tier' };
  }

  /**
   * Get token information (decimals, symbol, name)
   */
  async getTokenInfo(tokenAddress) {
    try {
      const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const [decimals, symbol, name] = await Promise.all([
        token.decimals(),
        token.symbol(),
        token.name(),
      ]);

      return {
        address: tokenAddress,
        decimals: Number(decimals),
        symbol,
        name,
      };
    } catch (error) {
      console.error(`Error getting token info for ${tokenAddress}:`, error.message);
      throw new Error(`Invalid token address or unable to fetch token info`);
    }
  }

  /**
   * Get CELO price in USD (using cUSD as proxy for USD)
   * Cache for 30 seconds to avoid excessive calls
   */
  async getCeloUsdPrice() {
    const now = Date.now();
    if (this.celoUsdPrice && (now - this.lastCeloUpdate) < 30000) {
      return this.celoUsdPrice;
    }

    try {
      // Swap 1 CELO for cUSD to get price
      const amountIn = ethers.parseUnits('1', 18); // 1 CELO (18 decimals)
      const path = [TOKENS.CELO, TOKENS.cUSD];

      const amounts = await this.router.getAmountsOut(amountIn, path);
      const cUsdOut = ethers.formatUnits(amounts[1], 18); // cUSD also has 18 decimals

      this.celoUsdPrice = parseFloat(cUsdOut);
      this.lastCeloUpdate = now;

      console.log(`CELO/USD price updated: $${this.celoUsdPrice}`);
      return this.celoUsdPrice;
    } catch (error) {
      console.error('Error getting CELO/USD price:', error.message);
      // Fallback to approximate price if call fails
      return 0.65; // Approximate CELO price
    }
  }

  /**
   * Get token price in USD
   * Strategy:
   * 1. Get CELO/USD price
   * 2. Swap 1 CELO for TOKEN to see how much TOKEN you get
   * 3. TOKEN_price = CELO_price / tokens_received
   * Tries both V2 and V3 pools
   */
  async getTokenPriceUsd(tokenAddress) {
    try {
      // Check for manual price first
      const normalizedAddress = tokenAddress.toLowerCase();
      if (manualPrices[normalizedAddress]) {
        const manual = manualPrices[normalizedAddress];
        const tokenInfo = await this.getTokenInfo(tokenAddress);

        return {
          success: true,
          source: 'Manual Price',
          token: tokenInfo,
          priceUsd: manual.priceUsd,
          priceCelo: manual.priceCelo,
          method: 'manual-configured',
          note: manual.note,
          lastUpdated: manual.lastUpdated,
          timestamp: Date.now(),
        };
      }

      // Step 1: Get CELO price in USD
      const celoUsdPrice = await this.getCeloUsdPrice();

      // Step 2: Simulate swap of 1 CELO for the token
      const oneCelo = ethers.parseUnits('1', 18);
      const tokenInfo = await this.getTokenInfo(tokenAddress);

      let tokensReceived;
      let path;
      let method = 'unknown';
      let version = 'V2';

      // Try V2 first
      try {
        // Try direct path: CELO -> TOKEN
        path = [TOKENS.CELO, tokenAddress];
        const amounts = await this.router.getAmountsOut(oneCelo, path);
        tokensReceived = ethers.formatUnits(amounts[1], tokenInfo.decimals);
        method = 'forward-swap-v2';
      } catch (error) {
        // Try path through cUSD: CELO -> cUSD -> TOKEN
        try {
          path = [TOKENS.CELO, TOKENS.cUSD, tokenAddress];
          const amounts = await this.router.getAmountsOut(oneCelo, path);
          tokensReceived = ethers.formatUnits(amounts[2], tokenInfo.decimals);
          method = 'forward-swap-v2-multi';
        } catch (error2) {
          // Try V3 pools
          console.log('V2 failed, trying V3...');
          const v3Quote = await this.getV3Quote(TOKENS.CELO, tokenAddress, 1, 18);

          if (v3Quote.success) {
            tokensReceived = ethers.formatUnits(v3Quote.amountOut, tokenInfo.decimals);
            method = `v3-direct-fee${v3Quote.fee}`;
            version = 'V3';
            path = [TOKENS.CELO, tokenAddress];
          } else {
            // Try V3 through cUSD
            const v3QuoteCUSD = await this.getV3Quote(TOKENS.CELO, TOKENS.cUSD, 1, 18);
            if (v3QuoteCUSD.success) {
              const cUsdAmount = ethers.formatUnits(v3QuoteCUSD.amountOut, 18);
              const v3QuoteToken = await this.getV3Quote(TOKENS.cUSD, tokenAddress, parseFloat(cUsdAmount), 18);

              if (v3QuoteToken.success) {
                tokensReceived = ethers.formatUnits(v3QuoteToken.amountOut, tokenInfo.decimals);
                method = `v3-multi-hop`;
                version = 'V3';
                path = [TOKENS.CELO, TOKENS.cUSD, tokenAddress];
              } else {
                // Try reverse: see how much CELO you need for 1 token
                const oneToken = ethers.parseUnits('1', tokenInfo.decimals);

                // Try V2 reverse
                try {
                  path = [tokenAddress, TOKENS.CELO];
                  const amounts = await this.router.getAmountsOut(oneToken, path);
                  const celoNeeded = ethers.formatUnits(amounts[1], 18);

                  return {
                    success: true,
                    source: 'Ubeswap V2',
                    token: tokenInfo,
                    priceUsd: parseFloat(celoNeeded) * celoUsdPrice,
                    priceCelo: parseFloat(celoNeeded),
                    method: 'reverse-swap-v2',
                    path,
                    timestamp: Date.now(),
                  };
                } catch (error3) {
                  // Try V3 reverse
                  const v3ReverseQuote = await this.getV3Quote(tokenAddress, TOKENS.CELO, 1, tokenInfo.decimals);
                  if (v3ReverseQuote.success) {
                    const celoNeeded = ethers.formatUnits(v3ReverseQuote.amountOut, 18);

                    return {
                      success: true,
                      source: 'Ubeswap V3',
                      token: tokenInfo,
                      priceUsd: parseFloat(celoNeeded) * celoUsdPrice,
                      priceCelo: parseFloat(celoNeeded),
                      method: `reverse-swap-v3-fee${v3ReverseQuote.fee}`,
                      path: [tokenAddress, TOKENS.CELO],
                      timestamp: Date.now(),
                    };
                  }

                  throw new Error('No liquidity found in V2 or V3 pools');
                }
              }
            } else {
              throw new Error('No V3 liquidity path found');
            }
          }
        }
      }

      // Step 3: Calculate price
      // If 1 CELO gets you X tokens, then 1 token = (1 CELO / X tokens) = (CELO_USD_price / X)
      const tokenPriceUsd = celoUsdPrice / parseFloat(tokensReceived);
      const tokenPriceCelo = 1 / parseFloat(tokensReceived);

      return {
        success: true,
        source: `Ubeswap ${version}`,
        token: tokenInfo,
        priceUsd: tokenPriceUsd,
        priceCelo: tokenPriceCelo,
        celoUsdPrice,
        tokensPerCelo: parseFloat(tokensReceived),
        method,
        path,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Error getting token price:', error.message);
      return {
        success: false,
        source: 'Ubeswap',
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Convert token price to any fiat currency
   */
  async getTokenPrice(tokenAddress, currency = 'USD', fiatRates) {
    const priceData = await this.getTokenPriceUsd(tokenAddress);

    if (!priceData.success) {
      return priceData;
    }

    const rate = fiatRates[currency.toUpperCase()] || 1;
    const convertedPrice = priceData.priceUsd / rate;

    return {
      ...priceData,
      currency: currency.toUpperCase(),
      price: convertedPrice,
      conversionRate: rate,
    };
  }

  /**
   * Get price for any amount of tokens
   */
  async getTokenValue(tokenAddress, amount, currency = 'USD', fiatRates) {
    const priceData = await this.getTokenPrice(tokenAddress, currency, fiatRates);

    if (!priceData.success) {
      return priceData;
    }

    return {
      ...priceData,
      amount: parseFloat(amount),
      totalValue: priceData.price * parseFloat(amount),
    };
  }

  /**
   * Get direct swap quote between any two tokens
   */
  async getSwapQuote(tokenIn, tokenOut, amountIn = 1) {
    try {
      const [tokenInInfo, tokenOutInfo] = await Promise.all([
        this.getTokenInfo(tokenIn),
        this.getTokenInfo(tokenOut),
      ]);

      const amountInWei = ethers.parseUnits(amountIn.toString(), tokenInInfo.decimals);

      // Try direct path first
      let path = [tokenIn, tokenOut];
      let amounts;

      try {
        amounts = await this.router.getAmountsOut(amountInWei, path);
      } catch (error) {
        // Try through CELO
        path = [tokenIn, TOKENS.CELO, tokenOut];
        try {
          amounts = await this.router.getAmountsOut(amountInWei, path);
        } catch (error2) {
          // Try through cUSD
          path = [tokenIn, TOKENS.cUSD, tokenOut];
          amounts = await this.router.getAmountsOut(amountInWei, path);
        }
      }

      const amountOut = ethers.formatUnits(amounts[amounts.length - 1], tokenOutInfo.decimals);
      const price = parseFloat(amountOut) / parseFloat(amountIn);

      return {
        success: true,
        source: 'Ubeswap',
        tokenIn: tokenInInfo,
        tokenOut: tokenOutInfo,
        amountIn: parseFloat(amountIn),
        amountOut: parseFloat(amountOut),
        price,
        path,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Swap quote error:', error.message);
      return {
        success: false,
        source: 'Ubeswap',
        error: error.message,
        timestamp: Date.now(),
      };
    }
  }
}

module.exports = UbeswapService;
