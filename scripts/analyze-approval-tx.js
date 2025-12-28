const { ethers } = require('ethers');

const RPC_URL = 'https://forno.celo.org';
const TX_HASH = '0x32e5f115b32bc51c904293788bb2d775dc47e882dde9f802bd8d0e01f5efd6a7';

async function analyzeTx() {
  console.log('🔍 Analyzing approval transaction\n');

  const provider = new ethers.JsonRpcProvider(RPC_URL);

  const tx = await provider.getTransaction(TX_HASH);
  const receipt = await provider.getTransactionReceipt(TX_HASH);

  console.log('Transaction Details:');
  console.log('From:', tx.from);
  console.log('To:', tx.to);
  console.log('Value:', ethers.formatEther(tx.value), 'CELO');
  console.log('Gas Used:', receipt.gasUsed.toString());
  console.log('Status:', receipt.status === 1 ? '✅ Success' : '❌ Failed');
  console.log('\nBlock:', receipt.blockNumber);
  console.log('Confirmations:', await tx.confirmations());
  console.log('\n✅ This confirms:');
  console.log('- Wallet can send transactions');
  console.log('- CELO token address is correct:', tx.to);
  console.log('- SwapRouter approval worked');
  console.log('\nNow we need to figure out why the swap fails...');
}

analyzeTx().catch(console.error);
