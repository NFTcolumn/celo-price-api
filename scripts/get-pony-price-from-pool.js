const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Based on your data: ~624 CELO and ~14.37 trillion PONY
// Current price: 24,389,900,000 PONY per CELO

// V3 Factory
const FACTORY_V3 = '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc';

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
  'function fee() external view returns (uint24)',
];

// Try more fee tiers including non-standard ones
const ALL_FEES = [100, 500, 2500, 3000, 10000, 30000]; // Include 0.01%, 0.05%, 0.25%, 0.3%, 1%, 3%

async function getPonyPrice() {
  console.log('🔍 Finding PONY/CELO V3 Pool\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_V3, FACTORY_ABI, provider);

  // Try both token orders
  const pairs = [
    [CELO_ADDRESS, PONY_ADDRESS],
    [PONY_ADDRESS, CELO_ADDRESS],
  ];

  for (const [token0, token1] of pairs) {
    for (const fee of ALL_FEES) {
      try {
        const poolAddress = await factory.getPool(token0, token1, fee);

        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`✅ Found pool: ${poolAddress}`);
          console.log(`   Fee tier: ${fee / 10000}%\n`);

          const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

          const [slot0, poolToken0, poolToken1, liquidity, poolFee] = await Promise.all([
            pool.slot0(),
            pool.token0(),
            pool.token1(),
            pool.liquidity(),
            pool.fee(),
          ]);

          console.log('Pool Details:');
          console.log(`Token0: ${poolToken0}`);
          console.log(`Token1: ${poolToken1}`);
          console.log(`Liquidity: ${liquidity.toString()}`);
          console.log(`Fee: ${poolFee / 10000}%`);
          console.log(`Current Tick: ${slot0.tick}`);
          console.log(`SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}\n`);

          // Calculate price from sqrtPriceX96
          // price = (sqrtPriceX96 / 2^96)^2
          const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96);
          const Q96 = 2n ** 96n;

          // Convert to number for calculation
          const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
          const price = sqrtPrice ** 2;

          const token0IsCelo = poolToken0.toLowerCase() === CELO_ADDRESS.toLowerCase();

          console.log('Price Calculation:');
          if (token0IsCelo) {
            // price = token1/token0 = PONY/CELO
            const ponyPerCelo = price * (10 ** 0); // Both have 18 decimals
            console.log(`1 CELO = ${ponyPerCelo.toExponential(6)} PONY`);
            console.log(`1 PONY = ${(1 / ponyPerCelo).toExponential(6)} CELO\n`);

            // Calculate USD price
            const celoUsdPrice = 0.65; // Approximate
            const ponyUsdPrice = (1 / ponyPerCelo) * celoUsdPrice;
            console.log(`💰 PONY Price: $${ponyUsdPrice.toExponential(6)}`);
            console.log(`💰 PONY Price: $${ponyUsdPrice.toFixed(15)}`);
          } else {
            // price = token1/token0 = CELO/PONY
            const celoPerPony = price * (10 ** 0);
            console.log(`1 PONY = ${celoPerPony.toExponential(6)} CELO`);
            console.log(`1 CELO = ${(1 / celoPerPony).toExponential(6)} PONY\n`);

            const celoUsdPrice = 0.65;
            const ponyUsdPrice = celoPerPony * celoUsdPrice;
            console.log(`💰 PONY Price: $${ponyUsdPrice.toExponential(6)}`);
            console.log(`💰 PONY Price: $${ponyUsdPrice.toFixed(15)}`);
          }

          return;
        }
      } catch (error) {
        // Pool doesn't exist for this combo
      }
    }
  }

  console.log('❌ No pool found with standard fee tiers');
}

getPonyPrice().catch(console.error);
