const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

const RPC_URL = 'https://forno.celo.org';
const PONY_ADDRESS = '0x000BE46901ea6f7ac2c1418D158f2f0A80992c07';
const CELO_ADDRESS = '0x471EcE3750Da237f93B8E339c536989b8978a438';
const cUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a';

// Ubeswap V3 SwapRouter
const SWAP_ROUTER_V3 = '0x5615CDAb10dc425a742d643d949a7F474C01abc4';

const SWAP_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function balanceOf(address account) external view returns (uint256)',
  'function allowance(address owner, address spender) external view returns (uint256)',
];

const FEE_TIERS = [100, 500, 3000, 10000];

async function executeSwap() {
  console.log('🔄 Executing CELO -> PONY swap\n');

  // Load wallet
  const walletFiles = fs.readdirSync(path.join(__dirname, '../wallets'));
  const latestWallet = walletFiles.sort().reverse()[0];
  const walletData = JSON.parse(fs.readFileSync(path.join(__dirname, '../wallets', latestWallet)));

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(walletData.privateKey, provider);

  console.log(`Using wallet: ${wallet.address}\n`);

  // Check CELO balance
  const celoToken = new ethers.Contract(CELO_ADDRESS, ERC20_ABI, wallet);
  const celoBalance = await celoToken.balanceOf(wallet.address);
  console.log(`CELO Balance: ${ethers.formatUnits(celoBalance, 18)} CELO\n`);

  if (celoBalance === 0n) {
    console.log('❌ No CELO balance. Please fund the wallet first.');
    return;
  }

  // Use a small amount for testing (0.1 CELO)
  const swapAmount = ethers.parseUnits('0.1', 18);

  if (celoBalance < swapAmount) {
    console.log('⚠️  Insufficient CELO. Using available balance instead.');
    swapAmount = celoBalance / 2n; // Use half of balance
  }

  console.log(`Swapping ${ethers.formatUnits(swapAmount, 18)} CELO for PONY\n`);

  // Approve SwapRouter to spend CELO
  console.log('Step 1: Approving SwapRouter...');
  const allowance = await celoToken.allowance(wallet.address, SWAP_ROUTER_V3);

  if (allowance < swapAmount) {
    const approveTx = await celoToken.approve(SWAP_ROUTER_V3, ethers.MaxUint256);
    console.log(`Approval tx: ${approveTx.hash}`);
    await approveTx.wait();
    console.log('✅ Approved\n');
  } else {
    console.log('✅ Already approved\n');
  }

  // Try swapping with each fee tier
  const swapRouter = new ethers.Contract(SWAP_ROUTER_V3, SWAP_ROUTER_ABI, wallet);
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  console.log('Step 2: Finding the right pool and executing swap...\n');

  for (const fee of FEE_TIERS) {
    console.log(`Trying ${fee / 10000}% fee tier...`);

    try {
      const params = {
        tokenIn: CELO_ADDRESS,
        tokenOut: PONY_ADDRESS,
        fee: fee,
        recipient: wallet.address,
        deadline: deadline,
        amountIn: swapAmount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0
      };

      // Execute the swap
      const tx = await swapRouter.exactInputSingle(params);
      console.log(`✅ Swap transaction sent: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...\n');

      const receipt = await tx.wait();
      console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}\n`);

      // Check PONY balance
      const ponyToken = new ethers.Contract(PONY_ADDRESS, ERC20_ABI, provider);
      const ponyBalance = await ponyToken.balanceOf(wallet.address);
      const ponyReceived = ethers.formatUnits(ponyBalance, 18);

      console.log('📊 Swap Results:');
      console.log(`   Sent: ${ethers.formatUnits(swapAmount, 18)} CELO`);
      console.log(`   Received: ${ponyReceived} PONY\n`);

      // Calculate price
      const celoSpent = parseFloat(ethers.formatUnits(swapAmount, 18));
      const ponyGot = parseFloat(ponyReceived);
      const ponyPerCelo = ponyGot / celoSpent;
      const ponyPriceCelo = 1 / ponyPerCelo;

      // Get CELO/USD price
      const ROUTER_V2 = '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121';
      const ROUTER_V2_ABI = [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
      ];
      const routerV2 = new ethers.Contract(ROUTER_V2, ROUTER_V2_ABI, provider);
      const oneCelo = ethers.parseUnits('1', 18);
      const celoToCusd = await routerV2.getAmountsOut(oneCelo, [CELO_ADDRESS, cUSD_ADDRESS]);
      const celoUsdPrice = parseFloat(ethers.formatUnits(celoToCusd[1], 18));

      const ponyPriceUsd = ponyPriceCelo * celoUsdPrice;

      console.log('💰 PONY Price:');
      console.log(`   1 PONY = ${ponyPriceCelo.toExponential(4)} CELO`);
      console.log(`   1 PONY = $${ponyPriceUsd.toExponential(4)}`);
      console.log(`   1 PONY = $${ponyPriceUsd.toFixed(15)}\n`);
      console.log(`   1 CELO = ${ponyPerCelo.toExponential(4)} PONY`);

      return;
    } catch (error) {
      console.log(`   ❌ Failed: ${error.shortMessage || error.reason || error.message.substring(0, 100)}\n`);
    }
  }

  console.log('❌ Could not execute swap on any pool');
}

executeSwap().catch(console.error);
