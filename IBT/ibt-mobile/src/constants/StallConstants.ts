import { formatAmountDisplay } from '@/src/utils/currency';

export const BILLING_CONFIG = {
  Permanent: { amountLabel: `₱ ${formatAmountDisplay(6000)}`, periodLabel: "30 DAYS", rawAmount: 6000 },
  NightMarket: { amountLabel: `₱ ${formatAmountDisplay(1120)}`, periodLabel: "7 DAYS", rawAmount: 1120 }
};

export const ENCRYPTION_KEY = process.env.EXPO_PUBLIC_ENCRYPTION_KEY || " ";