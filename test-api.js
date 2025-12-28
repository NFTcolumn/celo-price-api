const axios = require('axios');

const API_URL = 'http://localhost:3005';

// Common Celo token addresses for testing
const TEST_TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
};

async function testAPI() {
  console.log('🧪 Testing Crypto Price Aggregator API\n');

  try {
    // Test 1: Get API info
    console.log('1️⃣  Testing GET /');
    const infoResponse = await axios.get(API_URL);
    console.log('✅ API Info:', infoResponse.data.name);
    console.log('');

    // Test 2: Get CELO price in USD
    console.log('2️⃣  Testing GET /price/:tokenAddress (CELO in USD)');
    const celoPriceResponse = await axios.get(`${API_URL}/price/${TEST_TOKENS.CELO}`);
    console.log('✅ CELO Price:', JSON.stringify(celoPriceResponse.data, null, 2));
    console.log('');

    // Test 3: Get CELO price in EUR
    console.log('3️⃣  Testing GET /price/:tokenAddress?currency=EUR (CELO in EUR)');
    const celoPriceEurResponse = await axios.get(`${API_URL}/price/${TEST_TOKENS.CELO}?currency=EUR`);
    console.log('✅ CELO Price (EUR):', JSON.stringify(celoPriceEurResponse.data, null, 2));
    console.log('');

    // Test 4: Get value of 100 CELO
    console.log('4️⃣  Testing GET /value/:tokenAddress/:amount (100 CELO)');
    const celoValueResponse = await axios.get(`${API_URL}/value/${TEST_TOKENS.CELO}/100`);
    console.log('✅ 100 CELO Value:', JSON.stringify(celoValueResponse.data, null, 2));
    console.log('');

    // Test 5: Get swap quote
    console.log('5️⃣  Testing GET /quote (1 CELO -> cUSD)');
    const quoteResponse = await axios.get(`${API_URL}/quote`, {
      params: {
        tokenIn: TEST_TOKENS.CELO,
        tokenOut: TEST_TOKENS.cUSD,
        amountIn: 1,
      },
    });
    console.log('✅ Swap Quote:', JSON.stringify(quoteResponse.data, null, 2));
    console.log('');

    // Test 6: List tokens
    console.log('6️⃣  Testing GET /tokens');
    const tokensResponse = await axios.get(`${API_URL}/tokens`);
    console.log('✅ Available Tokens:', Object.keys(tokensResponse.data.tokens).join(', '));
    console.log('');

    // Test 7: List currencies
    console.log('7️⃣  Testing GET /currencies');
    const currenciesResponse = await axios.get(`${API_URL}/currencies`);
    console.log('✅ Supported Currencies:', currenciesResponse.data.currencies.join(', '));
    console.log('');

    // Test 8: Health check
    console.log('8️⃣  Testing GET /health');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Health:', healthResponse.data.status);
    console.log('');

    console.log('🎉 All tests passed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testAPI();
