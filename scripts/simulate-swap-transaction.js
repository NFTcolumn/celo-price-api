const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 SwapRouter
const SWAP_ROUTER_V3 = '0x5615CDAb10dc425a742d643d949a7F474C01abc4';

// SwapRouter ABI
const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256 amountOut)',
];

const FEE_TIERS = [100, 500, 3000, 10000];

async function simulateSwap() {
  console.log('🔄 Simulating CELO -> PONY swap transaction\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  // Create a random wallet (we won't actually send, just simulate)
  const wallet = ethers.Wallet.createRandom().connect(provider);
  console.log(`Test wallet: ${wallet.address}\n`);

  const swapRouter = new ethers.Contract(SWAP_ROUTER_V3, SWAP_ROUTER_ABI, wallet);

  const oneCelo = ethers.parseUnits('1', 18);
  const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

  console.log('Step 1: Get CELO/cUSD price\n');

  // Get CELO price first using V2
  const ROUTER_V2 = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121';
  const ROUTER_V2_ABI = [
    'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  ];

  const routerV2 = new ethers.Contract(ROUTER_V2, ROUTER_V2_ABI, provider);
  const celoToCusd = await routerV2.getAmountsOut(oneCelo, [CELO_ADDRESS, cUSD_ADDRESS]);
  const celoUsdPrice = ethers.formatUnits(celoToCusd[1], 18);

  console.log(`✅ 1 CELO = $${celoUsdPrice}\n`);

  console.log('Step 2: Simulate CELO -> PONY swap\n');

  // Try each fee tier
  for (const fee of FEE_TIERS) {
    console.log(`Trying ${fee / 10000}% fee tier...`);

    try {
      const params = {
        tokenIn: CELO_ADDRESS,
        tokenOut: PONY_ADDRESS,
        fee: fee,
        recipient: wallet.address,
        deadline: deadline,
        amountIn: oneCelo,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      // Use staticCall to simulate without sending
      const amountOut = await swapRouter.exactInputSingle.staticCall(params);
      const ponyAmount = ethers.formatUnits(amountOut, 18);

      console.log(`✅ SUCCESS!`);
      console.log(`   Would receive: ${ponyAmount} PONY`);
      console.log('');

      // Calculate price
      const tokensPerCelo = parseFloat(ponyAmount);
      const ponyPriceCelo = 1 / tokensPerCelo;
      const ponyPriceUsd = ponyPriceCelo * parseFloat(celoUsdPrice);

      console.log('Step 3: Calculate PONY Price\n');
      console.log(`💰 1 PONY = ${ponyPriceCelo.toExponential(4)} CELO`);
      console.log(`💰 1 PONY = $${ponyPriceUsd.toExponential(4)}`);
      console.log(`💰 1 PONY = $${ponyPriceUsd.toFixed(15)}`);
      console.log('');
      console.log(`📊 1 CELO = ${tokensPerCelo.toExponential(4)} PONY`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.shortMessage || error.reason || 'Pool not found'}`);
    }
  }

  // Try cUSD -> PONY
  console.log('\nTrying cUSD -> PONY swap\n');

  const oneCusd = ethers.parseUnits('1', 18);

  for (const fee of FEE_TIERS) {
    console.log(`Trying ${fee / 10000}% fee tier...`);

    try {
      const params = {
        tokenIn: cUSD_ADDRESS,
        tokenOut: PONY_ADDRESS,
        fee: fee,
        recipient: wallet.address,
        deadline: deadline,
        amountIn: oneCusd,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      const amountOut = await swapRouter.exactInputSingle.staticCall(params);
      const ponyAmount = ethers.formatUnits(amountOut, 18);

      console.log(`✅ SUCCESS!`);
      console.log(`   1 cUSD = ${ponyAmount} PONY`);
      console.log('');

      const tokensPerUsd = parseFloat(ponyAmount);
      const ponyPriceUsd = 1 / tokensPerUsd;

      console.log('💰 PONY Price:');
      console.log(`   $${ponyPriceUsd.toExponential(4)}`);
      console.log(`   $${ponyPriceUsd.toFixed(15)}`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.shortMessage || error.reason || 'Pool not found'}`);
    }
  }

  console.log('\n❌ Could not simulate swap on any pool');
}

simulateSwap().catch(console.error);
