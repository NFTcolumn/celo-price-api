const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const UBESWAP_FACTORY = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE';

const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
  'function allPairsLength() external view returns (uint)',
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

const COMMON_BASES = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
};

async function findPonyPairs() {
  console.log('🔍 Searching for PONY token pairs...\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const factory = new ethers.Contract(UBESWAP_FACTORY, FACTORY_ABI, provider);

  console.log('Checking common pairs on Ubeswap:\n');

  for (const [name, address] of Object.entries(COMMON_BASES)) {
    try {
      const pairAddress = await factory.getPair(PONY_ADDRESS, address);

      if (pairAddress === '0x0000000000000000000000000000000000000000') {
        console.log(`❌ PONY/${name}: No pair found`);
      } else {
        console.log(`✅ PONY/${name}: Pair found at ${pairAddress}`);

        // Check reserves
        const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
        const reserves = await pair.getReserves();
        const token0 = await pair.token0();

        const isPonyToken0 = token0.toLowerCase() === PONY_ADDRESS.toLowerCase();
        const ponyReserve = isPonyToken0 ? reserves[0] : reserves[1];
        const baseReserve = isPonyToken0 ? reserves[1] : reserves[0];

        console.log(`   PONY Reserve: ${ethers.formatUnits(ponyReserve, 18)}`);
        console.log(`   ${name} Reserve: ${ethers.formatUnits(baseReserve, 18)}`);

        if (ponyReserve > 0 && baseReserve > 0) {
          const price = Number(baseReserve) / Number(ponyReserve);
          console.log(`   💰 Price: 1 PONY = ${price.toFixed(8)} ${name}`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`❌ PONY/${name}: Error - ${error.message}`);
    }
  }

  // Check total pairs in factory
  const totalPairs = await factory.allPairsLength();
  console.log(`\nTotal pairs in Ubeswap factory: ${totalPairs}`);
}

findPonyPairs().catch(console.error);
