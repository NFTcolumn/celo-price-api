const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 Factory
const FACTORY_V3 = '0xAfE208a311B21f13EF87E33A90049fC17A7acDEc';

// V3 Factory ABI
const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

// V3 Pool ABI
const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function liquidity() external view returns (uint128)',
  'function fee() external view returns (uint24)',
];

const FEE_TIERS = [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%

async function findV3Pool() {
  console.log('🔍 Searching for PONY V3 pools on Ubeswap\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(FACTORY_V3, FACTORY_ABI, provider);

  const pairs = [
    { name: 'PONY/CELO', token0: PONY_ADDRESS, token1: CELO_ADDRESS },
    { name: 'PONY/cUSD', token0: PONY_ADDRESS, token1: cUSD_ADDRESS },
    { name: 'CELO/PONY', token0: CELO_ADDRESS, token1: PONY_ADDRESS },
    { name: 'cUSD/PONY', token0: cUSD_ADDRESS, token1: PONY_ADDRESS },
  ];

  for (const pair of pairs) {
    console.log(`Checking ${pair.name}:`);

    for (const fee of FEE_TIERS) {
      try {
        const poolAddress = await factory.getPool(pair.token0, pair.token1, fee);

        if (poolAddress !== '0x0000000000000000000000000000000000000000') {
          console.log(`  ✅ Found pool at ${poolAddress} (fee: ${fee / 10000}%)`);

          // Get pool details
          const pool = new ethers.Contract(poolAddress, POOL_ABI, provider);
          const [slot0, token0, token1, liquidity] = await Promise.all([
            pool.slot0(),
            pool.token0(),
            pool.token1(),
            pool.liquidity(),
          ]);

          console.log(`     Token0: ${token0}`);
          console.log(`     Token1: ${token1}`);
          console.log(`     Liquidity: ${liquidity.toString()}`);
          console.log(`     Tick: ${slot0.tick}`);
          console.log(`     SqrtPriceX96: ${slot0.sqrtPriceX96.toString()}`);

          // Calculate price from sqrtPriceX96
          const sqrtPrice = Number(slot0.sqrtPriceX96);
          const price = (sqrtPrice / (2 ** 96)) ** 2;

          // Adjust for decimals (both are 18)
          const token0IsPony = token0.toLowerCase() === PONY_ADDRESS.toLowerCase();

          if (token0IsPony) {
            console.log(`     Price: 1 PONY = ${price.toFixed(18)} ${pair.name.split('/')[1]}`);
            const ponyPrice = price;
            console.log(`     💰 PONY Price: $${(ponyPrice * 0.65).toFixed(8)} (assuming CELO=$0.65)`);
          } else {
            console.log(`     Price: 1 ${pair.name.split('/')[1]} = ${price.toFixed(18)} PONY`);
            const ponyPrice = 1 / price;
            console.log(`     💰 PONY Price: $${(ponyPrice * 0.65).toFixed(8)} (assuming CELO=$0.65)`);
          }
          console.log('');
        }
      } catch (error) {
        // Pool doesn't exist for this fee tier
      }
    }
  }
}

findV3Pool().catch(console.error);
