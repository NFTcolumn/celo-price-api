const axios = require('axios');

// Ubeswap V3 Subgraph
const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/ubeswap/ubeswap-v3';

const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07'.toLowerCase();
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438'.toLowerCase();

async function querySubgraph() {
  console.log('🔍 Querying Ubeswap V3 Subgraph for PONY pools\n');

  const query = `
    {
      pools(
        where: {
          or: [
            { token0: "${PONY_ADDRESS}" },
            { token1: "${PONY_ADDRESS}" }
          ]
        }
        first: 10
        orderBy: totalValueLockedUSD
        orderDirection: desc
      ) {
        id
        token0 {
          id
          symbol
          decimals
        }
        token1 {
          id
          symbol
          decimals
        }
        feeTier
        liquidity
        sqrtPrice
        token0Price
        token1Price
        volumeUSD
        totalValueLockedUSD
        tick
      }
    }
  `;

  try {
    const response = await axios.post(SUBGRAPH_URL, { query });

    if (response.data.errors) {
      console.log('❌ Subgraph errors:', response.data.errors);
      return;
    }

    const pools = response.data.data.pools;

    if (pools.length === 0) {
      console.log('❌ No PONY pools found in subgraph');
      return;
    }

    console.log(`✅ Found ${pools.length} PONY pool(s):\n`);

    pools.forEach((pool, index) => {
      console.log(`Pool ${index + 1}:`);
      console.log(`  Address: ${pool.id}`);
      console.log(`  Pair: ${pool.token0.symbol}/${pool.token1.symbol}`);
      console.log(`  Fee Tier: ${pool.feeTier / 10000}%`);
      console.log(`  Liquidity: ${pool.liquidity}`);
      console.log(`  TVL: $${parseFloat(pool.totalValueLockedUSD).toFixed(2)}`);
      console.log(`  Volume: $${parseFloat(pool.volumeUSD).toFixed(2)}`);

      // Check if this is the CELO pair
      if (pool.token0.id === CELO_ADDRESS || pool.token1.id === CELO_ADDRESS) {
        console.log(`  ⭐ This is the PONY/CELO pool!`);

        const isPonyToken0 = pool.token0.id === PONY_ADDRESS;

        if (isPonyToken0) {
          console.log(`  Price: 1 ${pool.token0.symbol} = ${pool.token0Price} ${pool.token1.symbol}`);
          console.log(`  Price: 1 ${pool.token1.symbol} = ${pool.token1Price} ${pool.token0.symbol}`);
        } else {
          console.log(`  Price: 1 ${pool.token1.symbol} = ${pool.token1Price} ${pool.token0.symbol}`);
          console.log(`  Price: 1 ${pool.token0.symbol} = ${pool.token0Price} ${pool.token1.symbol}`);
        }
      }

      console.log('');
    });

  } catch (error) {
    console.error('❌ Error querying subgraph:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

querySubgraph();
