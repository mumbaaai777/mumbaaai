import type { Ad, AdPlacement, RateCardRow, ZoneId } from './types';

export function todayIST(date = new Date()): string {
  const ist = new Date(date.getTime() + (330 + date.getTimezoneOffset()) * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${ist.getFullYear()}-${p(ist.getMonth() + 1)}-${p(ist.getDate())}`;
}

/** Ads eligible to serve: active, in date window, matching placement and zone (empty zones = all). */
export function eligibleAds(ads: Ad[], placement: AdPlacement, zone?: ZoneId, today = todayIST()): Ad[] {
  return ads.filter(
    (a) =>
      a.status === 'active' &&
      a.placement === placement &&
      a.start_date <= today &&
      a.end_date >= today &&
      (!zone || !a.zones?.length || a.zones.includes(zone)),
  );
}

/** Deterministic-but-rotating pick so a user sees different eligible ads across sessions. */
export function pickAd(ads: Ad[], seed = Math.floor(Date.now() / 600000)): Ad | undefined {
  if (!ads.length) return undefined;
  return ads[seed % ads.length];
}

export function ctr(a: Pick<Ad, 'impressions' | 'clicks'>): number {
  return a.impressions > 0 ? a.clicks / a.impressions : 0;
}

/**
 * Revenue estimate in ₹ for an ad, based on its pricing model and rate.
 * rate falls back to the rate card for (placement, pricing_model). Capped at budget.
 */
export function estimateRevenue(a: Ad, rateCard: RateCardRow[] = [], today = todayIST()): number {
  const rate =
    a.rate_inr ?? rateCard.find((r) => r.placement === a.placement && r.pricing_model === a.pricing_model)?.price_inr ?? 0;
  let v = 0;
  if (a.pricing_model === 'cpm') v = (a.impressions / 1000) * rate;
  else if (a.pricing_model === 'cpc') v = a.clicks * rate;
  else {
    const start = new Date(a.start_date + 'T00:00:00+05:30').getTime();
    const endStr = a.end_date < today ? a.end_date : today;
    const end = new Date(endStr + 'T00:00:00+05:30').getTime();
    const days = a.status === 'draft' || today < a.start_date ? 0 : Math.max(0, Math.round((end - start) / 86400000) + 1);
    v = days * rate;
  }
  return Math.round(Math.min(v, a.budget_inr || Infinity));
}

export const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
