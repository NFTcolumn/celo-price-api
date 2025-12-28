// Direct price calculation from pool reserves you provided

const celoReserve = 624.901;
const ponyReserve = 14369800000000; // 14.37 trillion

console.log('🧮 PONY Price Calculation from Pool Reserves\n');

console.log('Pool Reserves:');
console.log(`CELO: ${celoReserve.toLocaleString()}`);
console.log(`PONY: ${ponyReserve.toLocaleString()}\n`);

// Calculate price
const ponyPerCelo = ponyReserve / celoReserve;
const celoPerPony = celoReserve / ponyReserve;

console.log('Exchange Rate:');
console.log(`1 CELO = ${ponyPerCelo.toLocaleString()} PONY`);
console.log(`1 CELO = ${ponyPerCelo.toExponential(4)} PONY`);
console.log(`1 PONY = ${celoPerPony.toExponential(4)} CELO\n`);

// Calculate USD price (CELO = $0.11)
const celoUsdPrice = 0.11;
const ponyUsdPrice = celoPerPony * celoUsdPrice;

console.log('USD Price (CELO @ $0.11):');
console.log(`💰 1 PONY = $${ponyUsdPrice.toExponential(4)}`);
console.log(`💰 1 PONY = $${ponyUsdPrice.toFixed(15)}\n`);

// Calculate how many PONY for $1
const ponyPer1Usd = 1 / ponyUsdPrice;
console.log('For Reference:');
console.log(`$1 = ${ponyPer1Usd.toExponential(4)} PONY`);
console.log(`$1 = ${ponyPer1Usd.toLocaleString()} PONY\n`);

// Export for use in API
const priceData = {
  priceCelo: celoPerPony,
  priceUsd: ponyUsdPrice,
  tokensPerCelo: ponyPerCelo,
  method: 'calculated-from-reserves',
  reserves: {
    celo: celoReserve,
    pony: ponyReserve
  }
};

console.log('Price Data for API:');
console.log(JSON.stringify(priceData, null, 2));
