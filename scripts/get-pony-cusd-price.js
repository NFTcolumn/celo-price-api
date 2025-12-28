const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 Quoter
const QUOTER_V3 = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';

const QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
];

const FEE_TIERS = [100, 500, 3000, 10000];

async function getPonyCusdPrice() {
  console.log('💡 Getting PONY price via PONY/cUSD pair\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const quoter = new ethers.Contract(QUOTER_V3, QUOTER_ABI, provider);

  const oneCusd = ethers.parseUnits('1', 18);

  console.log('Step 1: How much PONY can you get for 1 cUSD?\n');

  for (const fee of FEE_TIERS) {
    console.log(`Trying fee tier ${fee / 10000}%...`);

    try {
      // Try cUSD -> PONY
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        cUSD_ADDRESS,
        PONY_ADDRESS,
        fee,
        oneCusd,
        0
      );

      const ponyAmount = ethers.formatUnits(amountOut, 18);

      console.log(`✅ SUCCESS with fee ${fee / 10000}%!`);
      console.log(`   1 cUSD = ${ponyAmount} PONY`);
      console.log('');

      // Calculate PONY price
      const tokensPerCusd = parseFloat(ponyAmount);
      const ponyPriceUsd = 1 / tokensPerCusd;

      console.log('Step 2: Calculate PONY price in USD\n');
      console.log(`💰 1 PONY = $${ponyPriceUsd.toExponential(4)}`);
      console.log(`💰 1 PONY = $${ponyPriceUsd.toFixed(15)}`);
      console.log('');

      console.log('Step 3: Also calculate in CELO (1 cUSD ≈ 8.65 CELO)\n');
      const cUsdPerCelo = 0.1156; // From previous query
      const ponyPriceCelo = ponyPriceUsd / cUsdPerCelo;
      console.log(`💰 1 PONY = ${ponyPriceCelo.toExponential(4)} CELO`);
      console.log(`💰 1 CELO = ${(1 / ponyPriceCelo).toExponential(4)} PONY`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed`);
    }
  }

  // Try reverse direction: PONY -> cUSD
  console.log('\nTrying reverse direction: PONY -> cUSD\n');

  const onePony = ethers.parseUnits('1', 18);

  for (const fee of FEE_TIERS) {
    console.log(`Trying fee tier ${fee / 10000}%...`);

    try {
      const amountOut = await quoter.quoteExactInputSingle.staticCall(
        PONY_ADDRESS,
        cUSD_ADDRESS,
        fee,
        onePony,
        0
      );

      const cusdAmount = ethers.formatUnits(amountOut, 18);

      console.log(`✅ SUCCESS with fee ${fee / 10000}%!`);
      console.log(`   1 PONY = ${cusdAmount} cUSD`);
      console.log('');

      console.log('💰 PONY Price:');
      console.log(`   1 PONY = $${cusdAmount} USD`);
      console.log(`   1 PONY = $${parseFloat(cusdAmount).toExponential(4)} USD`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed`);
    }
  }

  console.log('\n❌ Could not get PONY/cUSD quote');
}

getPonyCusdPrice().catch(console.error);
