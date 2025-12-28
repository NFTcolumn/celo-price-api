const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';

// CORRECT Ubeswap V3 Factory
const FACTORY_V3 = '0x67FEa58D5a5a4162cED847E13c2c81c73bf8aeC4';

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

const ALL_FEES = [100, 500, 3000, 10000, 30000];

async function findPool() {
  console.log('🔍 Finding CELO/PONY pool with CORRECT factory\n');
  console.log(`Factory: ${FACTORY_V3}\n`);

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_V3, FACTORY_ABI, provider);

  const pairs = [
    { name: 'CELO/PONY', token0: CELO_ADDRESS, token1: PONY_ADDRESS },
    { name: 'PONY/CELO', token0: PONY_ADDRESS, token1: CELO_ADDRESS },
  ];

  for (const pair of pairs) {
    console.log(`Checking ${pair.name}:`);

    for (const fee of ALL_FEES) {
      try {
        const poolAddress = await factory.getPool(pair.token0, pair.token1, fee);

        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`\n✅ FOUND POOL!`);
          console.log(`   Address: ${poolAddress}`);
          console.log(`   Fee: ${fee / 10000}%`);

          const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
          const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
            pool.token0(),
            pool.token1(),
            pool.fee(),
            pool.liquidity(),
            pool.slot0(),
          ]);

          console.log(`\n   Token0: ${token0}`);
          console.log(`   Token1: ${token1}`);
          console.log(`   Liquidity: ${liquidity.toString()}`);
          console.log(`   Tick: ${slot0.tick}`);

          // Calculate price
          const sqrtPriceX96 = BigInt(slot0.sqrtPriceX96);
          const Q96 = 2n ** 96n;
          const sqrtPrice = Number(sqrtPriceX96) / Number(Q96);
          const price = sqrtPrice ** 2;

          const token0IsCelo = token0.toLowerCase() === CELO_ADDRESS.toLowerCase();

          console.log(`\n   💰 Price:`);
          if (token0IsCelo) {
            console.log(`   1 CELO = ${price.toExponential(6)} PONY`);
            console.log(`   1 PONY = ${(1 / price).toExponential(6)} CELO`);
            const ponyUsd = (1 / price) * 0.1156;
            console.log(`   1 PONY = $${ponyUsd.toExponential(6)} USD`);
          } else {
            console.log(`   1 PONY = ${price.toExponential(6)} CELO`);
            console.log(`   1 CELO = ${(1 / price).toExponential(6)} PONY`);
            const ponyUsd = price * 0.1156;
            console.log(`   1 PONY = $${ponyUsd.toExponential(6)} USD`);
          }

          return poolAddress;
        }
      } catch (error) {
        // Continue
      }
    }
    console.log('  No pools found\n');
  }

  console.log('❌ No pool found');
}

findPool().catch(console.error);
