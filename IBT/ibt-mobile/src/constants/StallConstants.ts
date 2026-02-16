export const BILLING_CONFIG = {
  Permanent: { amountLabel: "₱ 6,000.00", periodLabel: "30 DAYS", rawAmount: 6000 },
  NightMarket: { amountLabel: "₱ 1,120.00", periodLabel: "7 DAYS", rawAmount: 1120 }
};

export const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || " ";