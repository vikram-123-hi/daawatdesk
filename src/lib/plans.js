export const PLANS = {
  monthly: { key: 'monthly', label: '1 Month', durationMonths: 1, amount: 499 },
  yearly: { key: 'yearly', label: '1 Year', durationMonths: 12, amount: 3999 },
}

export function formatINR(amount) {
  return `₹${amount.toLocaleString('en-IN')}`
}