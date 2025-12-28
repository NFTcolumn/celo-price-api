const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// Ubeswap V3 Factory
const FACTORY_V3 = '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc';

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

const POOL_ABI = [
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
  'function liquidity() external view returns (uint128)',
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

// Try ALL possible fee tiers including non-standard ones
const ALL_FEES = [
  100,    // 0.01%
  500,    // 0.05%
  2500,   // 0.25%
  3000,   // 0.3%
  10000,  // 1%
  30000,  // 3%
  100000  // 10%
];

async function findPoolContract() {
  console.log('🔍 Searching for CELO/PONY V3 Pool Contract\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_V3, FACTORY_ABI, provider);

  // Try both token orderings
  const pairs = [
    { name: 'CELO/PONY', token0: CELO_ADDRESS, token1: PONY_ADDRESS },
    { name: 'PONY/CELO', token0: PONY_ADDRESS, token1: CELO_ADDRESS },
  ];

  for (const pair of pairs) {
    console.log(`\nChecking ${pair.name}:`);

    for (const fee of ALL_FEES) {
      try {
        const poolAddress = await factory.getPool(pair.token0, pair.token1, fee);

        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`\n✅ FOUND POOL!`);
          console.log(`   Address: ${poolAddress}`);
          console.log(`   Fee: ${fee / 10000}%`);
          console.log(`   Pair: ${pair.name}`);

          // Get pool details
          const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);

          try {
            const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
              pool.token0(),
              pool.token1(),
              pool.fee(),
              pool.liquidity(),
              pool.slot0(),
            ]);

            console.log(`\n   Pool Details:`);
            console.log(`   Token0: ${token0}`);
            console.log(`   Token1: ${token1}`);
            console.log(`   Fee (confirmed): ${poolFee / 10000}%`);
            console.log(`   Liquidity: ${liquidity.toString()}`);
            console.log(`   Current Tick: ${slot0.tick}`);
            console.log(`   SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);

            // Calculate price
            const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96);
            const Q96 = 2n ** 96n;
            const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
            const price = sqrtPrice ** 2;

            const token0IsCelo = token0.toLowerCase() === CELO_ADDRESS.toLowerCase();

            console.log(`\n   Price Calculation:`);
            if (token0IsCelo) {
              const ponyPerCelo = price;
              console.log(`   1 CELO = ${ponyPerCelo.toExponential(6)} PONY`);
              console.log(`   1 PONY = ${(1 / ponyPerCelo).toExponential(6)} CELO`);
            } else {
              const celoPerPony = price;
              console.log(`   1 PONY = ${celoPerPony.toExponential(6)} CELO`);
              console.log(`   1 CELO = ${(1 / celoPerPony).toExponential(6)} PONY`);
            }

            return poolAddress;
          } catch (error) {
            console.log(`   ⚠️  Pool exists but couldn't read details: ${error.message}`);
          }
        }
      } catch (error) {
        // Pool doesn't exist for this fee
      }
    }
  }

  console.log('\n❌ No pool found with any standard fee tier');
  console.log('\nThe pool might be:');
  console.log('1. Using a custom non-standard fee tier');
  console.log('2. On a different factory contract');
  console.log('3. Created through a different mechanism');
}

findPoolContract().catch(console.error);
