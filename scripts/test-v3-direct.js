const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 Quoter
const QUOTER_V3 = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';

// V3 Quoter ABI
const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

// Fee tiers
const FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

async function testV3Quote() {
  console.log('🧪 Testing Ubeswap V3 Quoter directly\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const quoter = new ethers.Contract(QUOTER_V3, QUOTER_ABI, provider);

  const oneCelo = ethers.parseUnits('1', 18);

  console.log('Testing CELO -> PONY swaps:\n');

  // Try each fee tier
  for (const fee of FEE_TIERS) {
    console.log(`Testing fee tier ${fee / 10000}%...`);

    try {
      // Try using staticCall
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        CELO_ADDRESS,
        PONY_ADDRESS,
        fee,
        oneCelo,
        0
      );

      console.log(`✅ SUCCESS with fee ${fee / 10000}%`);
      console.log(`   1 CELO = ${ethers.formatUnits(amountOut, 18)} PONY`);
      console.log(`   1 PONY = ${(1 / parseFloat(ethers.formatUnits(amountOut, 18))).toFixed(8)} CELO`);
      console.log('');

      // Calculate USD price (assuming CELO = $0.65)
      const celoUsdPrice = 0.65;
      const ponyPriceUsd = celoUsdPrice / parseFloat(ethers.formatUnits(amountOut, 18));
      console.log(`   💰 PONY Price: $${ponyPriceUsd.toFixed(8)}`);
      console.log('');
      break;
    } catch (error) {
      console.log(`   ❌ No pool for fee ${fee / 10000}%`);
      console.log(`   Error: ${error.shortMessage || error.message}`);
      console.log('');
    }
  }

  console.log('\nTesting reverse: PONY -> CELO:\n');

  const onePony = ethers.parseUnits('1', 18);

  for (const fee of FEE_TIERS) {
    console.log(`Testing fee tier ${fee / 10000}%...`);

    try {
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        PONY_ADDRESS,
        CELO_ADDRESS,
        fee,
        onePony,
        0
      );

      console.log(`✅ SUCCESS with fee ${fee / 10000}%`);
      console.log(`   1 PONY = ${ethers.formatUnits(amountOut, 18)} CELO`);
      console.log('');

      // Calculate USD price
      const celoUsdPrice = 0.65;
      const ponyPriceUsd = parseFloat(ethers.formatUnits(amountOut, 18)) * celoUsdPrice;
      console.log(`   💰 PONY Price: $${ponyPriceUsd.toFixed(8)}`);
      console.log('');
      break;
    } catch (error) {
      console.log(`   ❌ No pool for fee ${fee / 10000}%`);
      console.log(`   Error: ${error.shortMessage || error.message}`);
      console.log('');
    }
  }

  // Also try PONY -> cUSD
  console.log('\nTesting PONY -> cUSD:\n');

  for (const fee of FEE_TIERS) {
    console.log(`Testing fee tier ${fee / 10000}%...`);

    try {
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        PONY_ADDRESS,
        cUSD_ADDRESS,
        fee,
        onePony,
        0
      );

      console.log(`✅ SUCCESS with fee ${fee / 10000}%`);
      console.log(`   1 PONY = ${ethers.formatUnits(amountOut, 18)} cUSD`);
      console.log(`   💰 PONY Price: $${ethers.formatUnits(amountOut, 18)}`);
      console.log('');
      break;
    } catch (error) {
      console.log(`   ❌ No pool for fee ${fee / 10000}%`);
      console.log('');
    }
  }
}

testV3Quote().catch(console.error);
