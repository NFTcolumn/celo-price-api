const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';

// Let's try to find the pool by checking NonfungiblePositionManager
const POSITION_MANAGER = '0x3d79EdAaBC0EaB6F08ED885C05Fc0B014290D95A';

const POSITION_MANAGER_ABI = [
  'function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)',
  'function totalSupply() external view returns (uint256)',
];

async function checkPoolDirect() {
  console.log('🔍 Checking NonfungiblePositionManager for PONY pools\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const positionManager = new ethers.Contract(POSITION_MANAGER, POSITION_MANAGER_ABI, provider);

  const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07'.toLowerCase();

  try {
    const totalSupply = await positionManager.totalSupply();
    console.log(`Total LP positions: ${totalSupply}\n`);

    // Check recent positions (last 100)
    const startId = totalSupply > 100n ? totalSupply - 100n : 0n;

    console.log(`Checking positions from ${startId} to ${totalSupply}...\n`);

    for (let i = startId; i < totalSupply && i < startId + 100n; i++) {
      try {
        const position = await positionManager.positions(i);

        const token0 = position.token0.toLowerCase();
        const token1 = position.token1.toLowerCase();

        // Check if this position involves PONY
        if (token0 === PONY_ADDRESS || token1 === PONY_ADDRESS) {
          console.log(`✅ Found PONY position #${i}:`);
          console.log(`   Token0: ${position.token0}`);
          console.log(`   Token1: ${position.token1}`);
          console.log(`   Fee: ${position.fee / 10000}%`);
          console.log(`   Liquidity: ${position.liquidity.toString()}`);
          console.log(`   Tick Range: ${position.tickLower} to ${position.tickUpper}`);
          console.log('');
        }
      } catch (error) {
        // Position doesn't exist or error reading it
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPoolDirect().catch(console.error);
