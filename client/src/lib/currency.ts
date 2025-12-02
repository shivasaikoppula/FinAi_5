// Currency conversion utility
const USD_TO_INR = 83; // 1 USD = 83 INR (approximate)

export function convertToINR(usd: number): number {
  return usd * USD_TO_INR;
}

export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}

export function formatUSD(amount: number): string {
  return `$${amount.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
