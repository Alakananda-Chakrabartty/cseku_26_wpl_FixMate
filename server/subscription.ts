export const SUBSCRIPTION_FEE_BDT = 500;

export type SubscriptionMethod = 'bKash' | 'Nagad';
export type SubscriptionStatus = 'not_paid' | 'pending' | 'paid' | 'rejected';

export function normalizeSubscriptionMethod(value: unknown): SubscriptionMethod | null {
  const normalized = String(value ?? '').trim().toLowerCase();

  if (normalized === 'bkash' || normalized === 'b-kash' || normalized === 'b_kash') {
    return 'bKash';
  }

  if (normalized === 'nagad') {
    return 'Nagad';
  }

  return null;
}

export function normalizeTransactionId(value: unknown): string | null {
  const normalized = String(value ?? '').trim();

  if (!normalized || normalized.length < 6 || normalized.length > 80) {
    return null;
  }

  return /^[A-Za-z0-9-]+$/.test(normalized) ? normalized : null;
}
