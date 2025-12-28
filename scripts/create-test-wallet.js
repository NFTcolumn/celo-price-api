const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

console.log('🔑 Creating test wallet for PONY price discovery\n');

// Create a new random wallet
const wallet = ethers.Wallet.createRandom();

console.log('✅ Wallet created!\n');
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('Mnemonic:', wallet.mnemonic.phrase);
console.log('\n⚠️  SAVE THIS INFORMATION! You need it to access the wallet.\n');

// Save to file
const walletData = {
  address: wallet.address,
  privateKey: wallet.privateKey,
  mnemonic: wallet.mnemonic.phrase,
  createdAt: new Date().toISOString(),
  purpose: 'PONY price discovery - test swaps'
};

const walletPath = path.join(__dirname, '../wallets');
if (!fs.existsSync(walletPath)) {
  fs.mkdirSync(walletPath, { recursive: true });
}

const filename = `test-wallet-${Date.now()}.json`;
fs.writeFileSync(
  path.join(walletPath, filename),
  JSON.stringify(walletData, null, 2)
);

console.log(`💾 Wallet saved to: wallets/${filename}\n`);
console.log('📝 Next steps:');
console.log('1. Send some CELO to this address:', wallet.address);
console.log('2. Run the swap script to get PONY price');
console.log('\n💰 You can get CELO from:');
console.log('   - Faucet: https://faucet.celo.org');
console.log('   - Or send from your existing wallet');
