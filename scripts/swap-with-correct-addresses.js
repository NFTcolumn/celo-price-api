const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// CORRECT Ubeswap V3 SwapRouter
const SWAP_ROUTER = '0xE389f92B47d913F773254962eD638E12C28aA82d';

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

async function executeSwap() {
  console.log('🔄 Executing CELO -> PONY swap with CORRECT addresses\n');

  const walletFiles = fs.readdirSync(path.join(__dirname, '../wallets'));
  const latestWallet = walletFiles.sort().reverse()[0];
  const walletData = JSON.parse(fs.readFileSync(path.join(__dirname, '../wallets', latestWallet)));

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(walletData.privateKey, provider);

  console.log(`Wallet: ${wallet.address}`);
  console.log(`SwapRouter: ${SWAP_ROUTER}\n`);

  const celoToken = new ethers.Contract(CELO_ADDRESS, ERC20_ABI, wallet);
  const celoBalance = await celoToken.balanceOf(wallet.address);
  console.log(`CELO Balance: ${ethers.formatUnits(celoBalance, 18)}\n`);

  const swapAmount = ethers.parseUnits('0.1', 18);
  console.log(`Swapping 0.1 CELO for PONY\n`);

  // Approve
  console.log('Approving...');
  const allowance = await celoToken.allowance(wallet.address, SWAP_ROUTER);
  if (allowance < swapAmount) {
    const approveTx = await celoToken.approve(SWAP_ROUTER, ethers.MaxUint256);
    console.log(`Tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log('✅ Approved\n');
  } else {
    console.log('✅ Already approved\n');
  }

  // Execute swap with 0.3% fee (3000)
  const swapRouter = new ethers.Contract(SWAP_ROUTER, SWAP_ROUTER_ABI, wallet);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log('Executing swap with 0.3% fee tier...\n');

  const params = {
    tokenIn: CELO_ADDRESS,
    tokenOut: PONY_ADDRESS,
    fee: 3000, // 0.3%
    recipient: wallet.address,
    amountIn: swapAmount,
    amountOutMinimum: 0,
    sqrtPriceLimitX96: 0
  };

  const tx = await swapRouter.exactInputSingle(params);
  console.log(`✅ Swap tx sent: ${tx.hash}`);
  console.log('⏳ Waiting for confirmation...\n');

  const receipt = await tx.wait();
  console.log(`✅ Confirmed in block ${receipt.blockNumber}\n`);

  // Check PONY balance
  const ponyToken = new ethers.Contract(PONY_ADDRESS, ERC20_ABI, provider);
  const ponyBalance = await ponyToken.balanceOf(wallet.address);

  console.log('📊 Results:');
  console.log(`   PONY received: ${ethers.formatUnits(ponyBalance, 18)}`);

  // Calculate price
  const ponyGot = parseFloat(ethers.formatUnits(ponyBalance, 18));
  const celoSpent = 0.1;
  const ponyPerCelo = ponyGot / celoSpent;
  const ponyPriceCelo = 1 / ponyPerCelo;

  // Get CELO USD price
  const ROUTER_V2 = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121';
  const routerV2 = new ethers.Contract(ROUTER_V2, ['function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)'], provider);
  const oneCelo = ethers.parseUnits('1', 18);
  const amounts = await routerV2.getAmountsOut(oneCelo, [CELO_ADDRESS, cUSD_ADDRESS]);
  const celoUsd = parseFloat(ethers.formatUnits(amounts[1], 18));

  const ponyUsd = ponyPriceCelo * celoUsd;

  console.log(`\n💰 PONY Price:`);
  console.log(`   $${ponyUsd.toExponential(4)}`);
  console.log(`   ${ponyPriceCelo.toExponential(4)} CELO`);
  console.log(`   1 CELO = ${ponyPerCelo.toExponential(4)} PONY`);
}

executeSwap().catch(console.error);
