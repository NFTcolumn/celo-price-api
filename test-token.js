const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const TOKEN_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';

const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function totalSupply() view returns (uint256)',
];

async function testToken() {
  console.log('Testing token:', TOKEN_ADDRESS);
  console.log('');

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const token = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);

  try {
    console.log('Fetching token info...');
    const [decimals, symbol, name, totalSupply] = await Promise.all([
      token.decimals(),
      token.symbol(),
      token.name(),
      token.totalSupply(),
    ]);

    console.log('✅ Token found!');
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Decimals:', decimals.toString());
    console.log('Total Supply:', ethers.formatUnits(totalSupply, decimals));
    console.log('');

    // Try to get code at address
    const code = await provider.getCode(TOKEN_ADDRESS);
    console.log('Contract Code Length:', code.length, 'bytes');
    console.log('');

    // Check balance of a few addresses to see if it has distribution
    const testAddresses = [
      '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121', // Ubeswap router
      '0x471EcE3750Da237f93B8E339c536989b8978a438', // CELO
      '0x765DE816845861e75A25fCA122bb6898B8B1282a', // cUSD
    ];

    console.log('Checking if token has any liquidity pairs...');
    const balanceABI = ['function balanceOf(address) view returns (uint256)'];
    const tokenForBalance = new ethers.Contract(TOKEN_ADDRESS, balanceABI, provider);

    for (const addr of testAddresses) {
      const balance = await tokenForBalance.balanceOf(addr);
      if (balance > 0) {
        console.log(`Found balance at ${addr}:`, ethers.formatUnits(balance, decimals));
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('This might not be a valid token on Celo network.');
  }
}

testToken();
