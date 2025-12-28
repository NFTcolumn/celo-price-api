const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 Quoter V2 (might be different)
const QUOTER_V2 = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';

// Try QuoterV2 ABI
const QUOTER_V2_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
];

const FEE_TIERS = [100, 500, 3000, 10000];

async function queryV3Swap() {
  console.log('Step 1: Get CELO price in cUSD\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // First, get CELO price using V2 (cUSD/CELO pair exists in V2)
  const ROUTER_V2 = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121';
  const ROUTER_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  ];

  const router = new ethers.Contract(ROUTER_V2, ROUTER_ABI, provider);

  // Get 1 CELO -> cUSD
  const oneCelo = ethers.parseUnits('1', 18);
  const amounts = await router.getAmountsOut(oneCelo, [CELO_ADDRESS, cUSD_ADDRESS]);
  const celoUsdPrice = ethers.formatUnits(amounts[1], 18);

  console.log(`✅ 1 CELO = ${celoUsdPrice} cUSD (≈ $${celoUsdPrice})`);
  console.log('');

  console.log('Step 2: Get PONY price by simulating 1 CELO -> PONY swap\n');

  // Try V3 quoter with different approaches
  const quoter = new ethers.Contract(QUOTER_V2, QUOTER_V2_ABI, provider);

  for (const fee of FEE_TIERS) {
    console.log(`Trying fee tier ${fee / 10000}%...`);

    try {
      const params = {
        tokenIn: CELO_ADDRESS,
        tokenOut: PONY_ADDRESS,
        amountIn: oneCelo,
        fee: fee,
        sqrtPriceLimitX96: 0
      };

      const result = await quoter.quoteExactInputSingle.staticCall(params);
      const ponyAmount = ethers.formatUnits(result.amountOut || result[0], 18);

      console.log(`✅ SUCCESS!`);
      console.log(`   1 CELO = ${ponyAmount} PONY`);
      console.log('');

      // Calculate PONY price
      const tokensPerCelo = parseFloat(ponyAmount);
      const ponyPriceCelo = 1 / tokensPerCelo;
      const ponyPriceUsd = ponyPriceCelo * parseFloat(celoUsdPrice);

      console.log('Step 3: Calculate PONY price in USD\n');
      console.log(`💰 1 PONY = ${ponyPriceCelo.toExponential(4)} CELO`);
      console.log(`💰 1 PONY = $${ponyPriceUsd.toExponential(4)}`);
      console.log(`💰 1 PONY = $${ponyPriceUsd.toFixed(15)}`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.shortMessage || error.message.substring(0, 100)}`);
    }
  }

  console.log('\n❌ Could not get quote from V3 quoter');
}

queryV3Swap().catch(console.error);
