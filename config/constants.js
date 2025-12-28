// Celo Network Configuration
const CELO_CHAIN_ID = 42220;

// Ubeswap V2 Router
const UBESWAP_ROUTER = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121';

// Ubeswap V3 Addresses (CORRECT FROM UBESWAP DOCS)
const UBESWAP_V3_FACTORY = '0x67FEa58D5a5a4162cED847E13c2c81c73bf8aeC4';
const UBESWAP_V3_SWAP_ROUTER = '0xE389f92B47d913F773254962eD638E12C28aA82d';
const UBESWAP_V3_QUOTER = '0x82825d0554fA07f7FC52Ab63c961F330fdEFa8E8';
const UBESWAP_V3_POSITION_MANAGER = '0x897387c7B996485c3AAa85c94272Cd6C506f8c8F';

// Common Celo token addresses
const TOKENS = {
  CELO: '0x471EcE3750Da237f93B8E339c536989b8978a438',
  cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a',
  cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73',
  cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787',
  USDC: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C',
  USDT: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e',
  WETH: '0x66803FB87aBd4aaC3cbB3fAd7C3aa01f6F3FB207',
  // Add more tokens as needed
};

// Ubeswap V2 Router ABI (minimal for getAmountsOut)
const UBESWAP_ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function factory() external pure returns (address)',
];

// Ubeswap V3 Quoter ABI
const UBESWAP_V3_QUOTER_ABI = [
  'function quoteExactInputSingle(address tokenIn, address tokenOut, uint24 fee, uint256 amountIn, uint160 sqrtPriceLimitX96) external returns (uint256 amountOut)',
  'function quoteExactInput(bytes memory path, uint256 amountIn) external returns (uint256 amountOut)',
];

// Ubeswap Factory ABI
const UBESWAP_FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

// Uniswap V2 Pair ABI (Ubeswap uses same interface)
const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function price0CumulativeLast() external view returns (uint)',
  'function price1CumulativeLast() external view returns (uint)',
];

// ERC20 ABI (minimal for decimals and symbol)
const ERC20_ABI = [
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
  'function balanceOf(address) view returns (uint256)',
];

// Forex conversion rates (approximate, can be made dynamic later)
const FIAT_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.50,
  CNY: 7.24,
  INR: 83.12,
  BRL: 4.97,
  CAD: 1.36,
  AUD: 1.52,
  MXN: 17.08,
};

// Ubeswap V2 Factory Address
const UBESWAP_FACTORY = '0x62d5b84bE28a183aBB507E125B384122D2C25fAE';

// Ubeswap V3 Fee Tiers
const V3_FEE_TIERS = [500, 3000, 10000]; // 0.05%, 0.3%, 1%

module.exports = {
  CELO_CHAIN_ID,
  UBESWAP_ROUTER,
  UBESWAP_V3_FACTORY,
  UBESWAP_V3_SWAP_ROUTER,
  UBESWAP_V3_QUOTER,
  UBESWAP_V3_POSITION_MANAGER,
  UBESWAP_FACTORY,
  TOKENS,
  UBESWAP_ROUTER_ABI,
  UBESWAP_V3_QUOTER_ABI,
  UBESWAP_FACTORY_ABI,
  PAIR_ABI,
  ERC20_ABI,
  FIAT_RATES,
  V3_FEE_TIERS,
};
